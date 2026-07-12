import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  loadCachedSponsorBanners,
  preloadSponsorBannerImages,
  saveCachedSponsorBanners,
} from '@/app/utils/sponsorBannersCache'
import {
  DEFAULT_ROULETTE_CODE,
  encodeIpForRoulette,
  extractBaseIp,
  extractRouletteCodeFromIp,
  sanitizeRouletteCode,
} from '@/app/utils/rouletteCode'
import { isValidPublicIp } from '@/app/hooks/useClientIp'
import { eventLog } from '@/app/utils/eventLog'
import { diagnostics } from '@/app/utils/runtimeDiagnostics'

const PARTICIPANT_COLUMNS = 'id,username,team,status,ip_address'
const UPSERT_BATCH_MS = 200

export interface Participant {
  id: string
  username: string
  team: 'blue' | 'yellow' | 'red'
  status: 'active' | 'winner' | 'discarded'
  ip_address?: string
  created_at?: string
}
export interface BannedUser {
  id: string
  ip_address: string
  username: string
  expires_at: string
  banned_by?: string | null
  created_at?: string
}
export interface RecentWinner { id: string; username: string; ip_address: string; won_at: string }
export interface Sponsor { id: string; name: string; url: string; image_url: string; order_index: number }
export interface Banner { id: string; image_url: string; link_url?: string }

export type IncomingSpin = {
  rotation: number
  winnerId: string
  winnerUsername?: string
  winnerTeam?: Participant['team']
  localReceivedAt: number
}

function makeTempId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useParticipants(
  activeRouletteCode: string = DEFAULT_ROULETTE_CODE,
  options: { loadParticipants?: boolean } = {},
) {
  const loadParticipants = options.loadParticipants ?? true
  const rouletteCode = sanitizeRouletteCode(activeRouletteCode)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [banners, setBanners] = useState<Banner[]>(() => loadCachedSponsorBanners())
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [realtimeReady, setRealtimeReady] = useState(false)

  const [spectatorView, setSpectatorView] = useState<'main' | 'roulette'>('main')
  const [incomingSpin, setIncomingSpin] = useState<IncomingSpin | null>(null)

  const [rouletteConfig, setRouletteConfig] = useState({ penaltyMonths: 2, penaltyPercent: 70 })
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const refetchTimerRef = useRef<number | null>(null)
  const participantsRef = useRef(participants)
  const bannedUsersRef = useRef(bannedUsers)
  const participantsByIdRef = useRef<Map<string, Participant>>(new Map())
  const pendingUpsertsRef = useRef<Map<string, Participant>>(new Map())
  const upsertFlushTimerRef = useRef<number | null>(null)
  const fetchGenRef = useRef(0)
  const rouletteCodeRef = useRef(rouletteCode)
  const belongsToRoomRef = useRef((ip?: string) => extractRouletteCodeFromIp(ip) === rouletteCode)

  useEffect(() => {
    participantsRef.current = participants
    const map = new Map<string, Participant>()
    for (const p of participants) map.set(p.id, p)
    participantsByIdRef.current = map
  }, [participants])

  useEffect(() => {
    bannedUsersRef.current = bannedUsers
  }, [bannedUsers])

  useEffect(() => {
    rouletteCodeRef.current = rouletteCode
    belongsToRoomRef.current = (ip?: string) => extractRouletteCodeFromIp(ip) === rouletteCode
  }, [rouletteCode])

  const belongsToRoom = useCallback(
    (ipAddress?: string) => extractRouletteCodeFromIp(ipAddress) === rouletteCode,
    [rouletteCode],
  )

  const flushPendingUpserts = useCallback(() => {
    if (pendingUpsertsRef.current.size === 0) return
    const batch = new Map(pendingUpsertsRef.current)
    pendingUpsertsRef.current.clear()

    setParticipants((prev) => {
      const next = [...prev]
      const indexById = new Map(next.map((p, i) => [p.id, i]))
      for (const row of batch.values()) {
        const idx = indexById.get(row.id)
        if (idx !== undefined) {
          next[idx] = row
        } else {
          next.push(row)
          indexById.set(row.id, next.length - 1)
        }
      }
      return next
    })
  }, [])

  const scheduleUpsertFlush = useCallback(() => {
    if (upsertFlushTimerRef.current) window.clearTimeout(upsertFlushTimerRef.current)
    upsertFlushTimerRef.current = window.setTimeout(() => {
      flushPendingUpserts()
      upsertFlushTimerRef.current = null
    }, UPSERT_BATCH_MS)
  }, [flushPendingUpserts])

  const upsertParticipant = useCallback((row: Participant, immediate = false) => {
    if (immediate) {
      pendingUpsertsRef.current.set(row.id, row)
      flushPendingUpserts()
      pendingUpsertsRef.current.clear()
      return
    }
    pendingUpsertsRef.current.set(row.id, row)
    scheduleUpsertFlush()
  }, [flushPendingUpserts, scheduleUpsertFlush])

  const fetchBanners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sponsor_banners')
        .select('id, image_url, link_url')
        .order('created_at', { ascending: true })
      if (error) throw error
      if (data?.length) {
        const next = data as Banner[]
        setBanners(next)
        saveCachedSponsorBanners(next)
        preloadSponsorBannerImages(next)
      }
    } catch (error) {
      eventLog.error('banners', 'fetch failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }, [])

  const fetchRegistrationMeta = useCallback(async () => {
    const { data: bData, error } = await supabase
      .from('banned_ips')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      eventLog.error('register', 'banned_ips fetch failed', { error: error.message })
      return
    }
    if (bData) {
      setBannedUsers(
        (bData as BannedUser[]).filter((b) => belongsToRoomRef.current(b.ip_address)),
      )
    }
  }, [])

  const fetchRecentWinners = useCallback(async () => {
    const { data: rwData, error } = await supabase
      .from('recent_winners')
      .select('*')
      .order('won_at', { ascending: false })
    if (error) {
      eventLog.error('roulette', 'recent_winners fetch failed', { error: error.message })
      return
    }
    if (rwData) {
      setRecentWinners(
        (rwData as RecentWinner[]).filter((w) => belongsToRoomRef.current(w.ip_address)),
      )
    }
  }, [])

  /**
   * Consulta fresca de participantes. Usa generación para evitar que una
   * respuesta vieja pise una más nueva (race de Promise.all / realtime).
   */
  const syncParticipantsFresh = useCallback(async (reason: string): Promise<Participant[]> => {
    const gen = ++fetchGenRef.current
    const code = rouletteCodeRef.current
    const started = performance.now()
    const timer = eventLog.timed('roulette', 'syncParticipantsFresh')

    try {
      const { data, error } = await supabase
        .from('participants')
        .select(PARTICIPANT_COLUMNS)
        .order('created_at', { ascending: true })

      if (error) throw error
      if (gen !== fetchGenRef.current) {
        timer.end({ reason, stale: true, code })
        return participantsRef.current
      }

      const filtered = ((data ?? []) as Participant[]).filter((p) =>
        belongsToRoomRef.current(p.ip_address),
      )

      setParticipants(filtered)
      setSyncError(null)
      const ms = Math.round(performance.now() - started)
      timer.end({ reason, count: filtered.length, code })
      diagnostics.patch({
        lastSyncAt: Date.now(),
        lastSyncReason: reason,
        lastSyncCount: filtered.length,
        lastSyncMs: ms,
        participantCount: filtered.length,
        lastError: null,
      })
      return filtered
    } catch (error) {
      timer.fail(error, { reason, code })
      const msg = error instanceof Error ? error.message : 'Error al sincronizar'
      setSyncError(msg)
      diagnostics.patch({ lastError: msg })
      return participantsRef.current
    }
  }, [])

  const fetchParticipantsData = useCallback(async () => {
    const gen = ++fetchGenRef.current
    const code = rouletteCodeRef.current
    const timer = eventLog.timed('roulette', 'fetchParticipantsData')

    const [pRes, bRes, sRes, rwRes] = await Promise.all([
      supabase.from('participants').select(PARTICIPANT_COLUMNS).order('created_at', { ascending: true }),
      supabase.from('banned_ips').select('*').order('created_at', { ascending: false }),
      supabase.from('sponsors').select('*').order('order_index', { ascending: true }),
      supabase.from('recent_winners').select('*').order('won_at', { ascending: false }),
    ])

    if (gen !== fetchGenRef.current) {
      timer.end({ stale: true, code })
      return
    }

    if (pRes.error) {
      timer.fail(pRes.error, { code })
      setSyncError(pRes.error.message)
    } else if (pRes.data) {
      const filtered = (pRes.data as Participant[]).filter((p) =>
        belongsToRoomRef.current(p.ip_address),
      )
      setParticipants(filtered)
      setSyncError(null)
      timer.end({ count: filtered.length, code })
    }

    if (!bRes.error && bRes.data) {
      setBannedUsers(
        (bRes.data as BannedUser[]).filter((b) => belongsToRoomRef.current(b.ip_address)),
      )
    }

    if (!sRes.error && sRes.data) setSponsors(sRes.data as Sponsor[])

    if (!rwRes.error && rwRes.data) {
      setRecentWinners(
        (rwRes.data as RecentWinner[]).filter((w) => belongsToRoomRef.current(w.ip_address)),
      )
    }
  }, [])

  const scheduleParticipantsRefetch = useCallback(() => {
    if (refetchTimerRef.current) window.clearTimeout(refetchTimerRef.current)
    refetchTimerRef.current = window.setTimeout(() => {
      void fetchParticipantsData().catch((error) => {
        eventLog.error('roulette', 'scheduled refetch failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }, 1500)
  }, [fetchParticipantsData])

  // Cambio de sala: limpia lista y marca loading para no pintar sala anterior.
  useEffect(() => {
    setParticipants([])
    setLoading(true)
    setSyncError(null)
    fetchGenRef.current += 1
  }, [rouletteCode])

  // Canal de sync de ruleta: estable respecto a loadParticipants.
  useEffect(() => {
    const syncChannel = supabase.channel(`roulette_sync_${rouletteCode}`, {
      config: { broadcast: { self: false } },
    })

    syncChannel.on('broadcast', { event: 'set_view' }, (payload) => {
      setSpectatorView(payload.payload.view)
      if (payload.payload.config) setRouletteConfig(payload.payload.config)
      if (payload.payload.view === 'roulette') {
        setLoading(true)
        void syncParticipantsFresh('broadcast_set_view').finally(() => setLoading(false))
      }
    })

    syncChannel.on('broadcast', { event: 'spin' }, (payload) => {
      setIncomingSpin({
        rotation: payload.payload.rotation,
        winnerId: payload.payload.winnerId,
        winnerUsername: payload.payload.winnerUsername,
        winnerTeam: payload.payload.winnerTeam,
        localReceivedAt: Date.now(),
      })
    })

    syncChannel.subscribe((status) => {
      setRealtimeReady(status === 'SUBSCRIBED')
      diagnostics.patch({ realtimeStatus: String(status) })
      eventLog.info('roulette', 'sync channel', { status, code: rouletteCode })
    })
    channelRef.current = syncChannel

    return () => {
      void supabase.removeChannel(syncChannel)
      if (channelRef.current === syncChannel) channelRef.current = null
      setRealtimeReady(false)
      diagnostics.patch({ realtimeStatus: 'unsubscribed' })
    }
  }, [rouletteCode, syncParticipantsFresh])

  // Boot de datos (puede cambiar con loadParticipants) — canal DB va aparte.
  const loadParticipantsRef = useRef(loadParticipants)
  useEffect(() => {
    loadParticipantsRef.current = loadParticipants
  }, [loadParticipants])

  useEffect(() => {
    const cached = loadCachedSponsorBanners()
    if (cached.length > 0) preloadSponsorBannerImages(cached)
    void fetchBanners()

    let cancelled = false
    const boot = async () => {
      try {
        if (loadParticipants) {
          setLoading(true)
          await fetchParticipantsData()
        } else {
          await fetchRegistrationMeta()
        }
      } catch (error) {
        eventLog.error('boot', 'initial fetch failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void boot()

    return () => {
      cancelled = true
    }
  }, [rouletteCode, loadParticipants, fetchBanners, fetchParticipantsData, fetchRegistrationMeta])

  // Realtime DB: un solo canal por sala; NO se remonta al flip de loadParticipants.
  useEffect(() => {
    const dbChannel = supabase.channel(`public:db_changes_${rouletteCode}`)

    dbChannel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participants' },
        (payload) => {
          const row = payload.new as Participant
          if (belongsToRoomRef.current(row.ip_address)) {
            eventLog.info('realtime', 'participant INSERT', { id: row.id, user: row.username })
            upsertParticipant(row)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'participants' },
        (payload) => {
          const row = payload.new as Participant
          if (belongsToRoomRef.current(row.ip_address)) {
            upsertParticipant(row)
            return
          }
          setParticipants((prev) => prev.filter((p) => p.id !== row.id))
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'participants' },
        (payload) => {
          const row = payload.old as { id?: string }
          if (row.id) setParticipants((prev) => prev.filter((p) => p.id !== row.id))
        },
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banned_ips' }, () => {
        if (loadParticipantsRef.current) scheduleParticipantsRefetch()
        else void fetchRegistrationMeta()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recent_winners' }, () => {
        void fetchRecentWinners()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsor_banners' }, () => {
        void fetchBanners()
      })
      .subscribe((status) => {
        eventLog.info('realtime', 'db channel', { status, code: rouletteCode })
      })

    return () => {
      if (refetchTimerRef.current) window.clearTimeout(refetchTimerRef.current)
      void supabase.removeChannel(dbChannel)
    }
  }, [
    rouletteCode,
    fetchBanners,
    fetchRegistrationMeta,
    fetchRecentWinners,
    scheduleParticipantsRefetch,
    upsertParticipant,
  ])

  // Cleanup upsert timer on unmount only
  useEffect(() => {
    return () => {
      if (upsertFlushTimerRef.current) window.clearTimeout(upsertFlushTimerRef.current)
    }
  }, [])

  const broadcastView = async (view: 'main' | 'roulette', config?: unknown) => {
    if (channelRef.current) {
      await channelRef.current.send({ type: 'broadcast', event: 'set_view', payload: { view, config } })
    }
  }

  const broadcastSpin = async (
    rotation: number,
    winnerId: string,
    winnerUsername?: string,
    winnerTeam?: Participant['team'],
  ) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'spin',
        payload: { rotation, winnerId, winnerUsername, winnerTeam },
      })
    }
  }

  const loadParticipantByIp = async (finalIp: string): Promise<Participant | null> => {
    const { data } = await supabase
      .from('participants')
      .select(PARTICIPANT_COLUMNS)
      .eq('ip_address', finalIp)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return (data as Participant | null) ?? null
  }

  /**
   * Tras un timeout de UI: confirma si el INSERT tardío ya quedó en DB.
   * Evita reintentos que el usuario percibe como "falló" cuando en realidad sí registró.
   */
  const verifyParticipantRegistered = async (ip: string): Promise<boolean> => {
    const finalIp = encodeIpForRoulette(ip, rouletteCode)
    try {
      const row = await loadParticipantByIp(finalIp)
      if (!row) return false
      if (belongsToRoomRef.current(row.ip_address)) upsertParticipant(row, true)
      diagnostics.patch({ lastRegisterAt: Date.now(), lastRegisterOk: true })
      return true
    } catch {
      return false
    }
  }

  const addParticipant = async (
    username: string,
    team: string,
    ip: string,
    isAdminBypass: boolean = false,
  ) => {
    const timer = eventLog.timed('register', 'addParticipant')
    const rawIp = isAdminBypass ? `admin-bypass-${Date.now()}` : ip
    const finalIp = encodeIpForRoulette(rawIp, rouletteCode)

    const finishOk = (row: Participant, extra?: Record<string, unknown>) => {
      upsertParticipant(row, true)
      timer.end({ id: row.id, username, ...extra })
      diagnostics.patch({
        lastRegisterAt: Date.now(),
        lastRegisterOk: true,
        lastError: null,
      })
    }

    if (!isAdminBypass) {
      if (!isValidPublicIp(ip)) {
        timer.fail(new Error('invalid ip'))
        diagnostics.patch({ lastRegisterOk: false, lastError: 'invalid ip' })
        throw new Error('No pudimos verificar tu conexión. Reintenta en un momento.')
      }

      const now = new Date()
      const banned = bannedUsersRef.current.find(
        (ban) => ban.ip_address === finalIp && new Date(ban.expires_at) > now,
      )
      if (banned) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        timer.end({ bannedSilent: true })
        diagnostics.patch({ lastRegisterAt: Date.now(), lastRegisterOk: true })
        return
      }

      const alreadyLocal = participantsRef.current.find(
        (row) =>
          row.ip_address === finalIp ||
          (extractBaseIp(row.ip_address) === ip && belongsToRoomRef.current(row.ip_address)),
      )
      if (alreadyLocal) {
        // Idempotente: ya está en lista local → éxito (reintento post-timeout).
        finishOk(alreadyLocal, { idempotent: 'local' })
        return
      }

      const existingRow = await loadParticipantByIp(finalIp)
      if (existingRow) {
        finishOk(existingRow, { idempotent: 'db-precheck' })
        return
      }
    }

    // INSERT sin RETURNING. UNIQUE(ip_address) evita duplicados reales.
    const { error } = await supabase
      .from('participants')
      .insert([{ username, team, status: 'active', ip_address: finalIp }])

    if (error) {
      // Carrera timeout/reintento: el INSERT previo ganó → éxito idempotente.
      if (error.code === '23505') {
        const existing = await loadParticipantByIp(finalIp)
        if (existing) {
          finishOk(existing, { idempotent: '23505' })
          return
        }
        timer.fail(error, { code: '23505' })
        diagnostics.patch({ lastRegisterOk: false, lastError: '23505' })
        throw new Error('Usuario ya registrado.')
      }
      timer.fail(error)
      diagnostics.patch({
        lastRegisterOk: false,
        lastError: error.message,
      })
      throw error
    }

    const inserted = await loadParticipantByIp(finalIp)
    const row: Participant = inserted ?? {
      id: makeTempId(),
      username,
      team: team as Participant['team'],
      status: 'active',
      ip_address: finalIp,
    }

    finishOk(row, { optimistic: !inserted })
  }

  const deleteParticipant = async (id: string) => {
    await supabase.from('participants').delete().eq('id', id)
    setParticipants((prev) => prev.filter((p) => p.id !== id))
  }

  const deleteMultiple = async (ids: string[]) => {
    await supabase.from('participants').delete().in('id', ids)
    const idSet = new Set(ids)
    setParticipants((prev) => prev.filter((p) => !idSet.has(p.id)))
  }

  const updateStatus = async (id: string, status: string) => {
    const previous = participantsByIdRef.current.get(id)
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: status as Participant['status'] } : p)),
    )

    const { error } = await supabase.from('participants').update({ status }).eq('id', id)
    if (error) {
      if (previous) upsertParticipant(previous, true)
      throw error
    }

    if (status === 'winner') {
      const user = participantsByIdRef.current.get(id)
      if (user) {
        const wonAt = new Date().toISOString()
        const { data: winnerRow } = await supabase
          .from('recent_winners')
          .insert([{ username: user.username, ip_address: user.ip_address || '', won_at: wonAt }])
          .select('*')
          .single()

        if (winnerRow && belongsToRoomRef.current(winnerRow.ip_address)) {
          setRecentWinners((prev) => [winnerRow as RecentWinner, ...prev])
        }
      }
    }
  }

  const banUser = async (id: string, durationInDays: number, bannedBy?: string) => {
    const user = participants.find((p) => p.id === id)
    if (!user || !user.ip_address) return
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + durationInDays)
    const payload: Record<string, string> = {
      ip_address: user.ip_address,
      username: user.username,
      expires_at: expirationDate.toISOString(),
    }
    if (bannedBy?.trim()) payload.banned_by = bannedBy.trim().toLowerCase()

    const { error } = await supabase.from('banned_ips').insert([payload])
    if (error) {
      eventLog.error('admin', 'ban failed', { error: error.message })
      throw new Error('No se pudo banear al usuario. Verifica la columna banned_by en Supabase.')
    }
    await deleteParticipant(id)
  }

  const unbanUser = async (id: string) => {
    await supabase.from('banned_ips').delete().eq('id', id)
    setBannedUsers((prev) => prev.filter((b) => b.id !== id))
  }

  const resetGame = async () => {
    if (participants.length === 0) return
    const ids = participants.map((p) => p.id)
    await supabase.from('participants').update({ status: 'active' }).in('id', ids)
    setParticipants((prev) => prev.map((p) => ({ ...p, status: 'active' as const })))
  }

  const clearAll = async () => {
    if (participants.length === 0) return
    const ids = participants.map((p) => p.id)
    await supabase.from('participants').delete().in('id', ids)
    setParticipants([])
  }

  const removeRecentWinner = async (id: string) => {
    await supabase.from('recent_winners').delete().eq('id', id)
    setRecentWinners((prev) => prev.filter((w) => w.id !== id))
  }

  const removeMultipleRecentWinners = async (ids: string[]) => {
    await supabase.from('recent_winners').delete().in('id', ids)
    const idSet = new Set(ids)
    setRecentWinners((prev) => prev.filter((w) => !idSet.has(w.id)))
  }

  const addSponsor = async (rawUrl: string, customImageUrl?: string, customName?: string) => {
    let username = customName?.trim().replace('@', '') || rawUrl.trim().replace('@', '')
    const match = rawUrl.match(/(?:instagram\.com\/)([^/?]+)/i)
    if (match && match[1]) username = match[1]
    if (!username) username = 'patrocinador'
    const finalUrl = rawUrl
      ? rawUrl.includes('instagram.com')
        ? rawUrl
        : `https://instagram.com/${username}`
      : `https://instagram.com/${username}`
    const image_url = customImageUrl || `https://unavatar.io/instagram/${username}`
    const nextOrder = sponsors.length > 0 ? Math.max(...sponsors.map((s) => s.order_index || 0)) + 1 : 0
    await supabase.from('sponsors').insert([{ name: username, url: finalUrl, image_url, order_index: nextOrder }])
    await fetchParticipantsData()
  }

  const deleteSponsor = async (id: string) => {
    await supabase.from('sponsors').delete().eq('id', id)
    await fetchParticipantsData()
  }
  const deleteMultipleSponsors = async (ids: string[]) => {
    await supabase.from('sponsors').delete().in('id', ids)
    await fetchParticipantsData()
  }
  const updateSponsorsOrder = async (reorderedList: Sponsor[]) => {
    setSponsors(reorderedList)
    const updates = reorderedList.map((s, idx) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      image_url: s.image_url,
      order_index: idx,
    }))
    await supabase.from('sponsors').upsert(updates)
  }
  const updateSponsorDetails = async (id: string, image_url: string, url: string) => {
    await supabase.from('sponsors').update({ image_url, url }).eq('id', id)
    await fetchParticipantsData()
  }

  const addBanner = async (image_url: string, link_url: string = '') => {
    await supabase.from('sponsor_banners').insert([{ image_url, link_url }])
    await fetchBanners()
  }
  const updateBanner = async (id: string, image_url: string, link_url: string = '') => {
    await supabase.from('sponsor_banners').update({ image_url, link_url }).eq('id', id)
    await fetchBanners()
  }
  const deleteBanner = async (id: string) => {
    await supabase.from('sponsor_banners').delete().eq('id', id)
    await fetchBanners()
  }

  const deleteRouletteData = async (targetRouletteCode: string) => {
    const targetCode = sanitizeRouletteCode(targetRouletteCode)
    if (targetCode === DEFAULT_ROULETTE_CODE) return

    const { data: participantRows } = await supabase.from('participants').select('id, ip_address')
    const participantIds =
      participantRows
        ?.filter((row) => extractRouletteCodeFromIp(row.ip_address) === targetCode)
        .map((row) => row.id) ?? []
    if (participantIds.length > 0) {
      await supabase.from('participants').delete().in('id', participantIds)
    }

    const { data: bannedRows } = await supabase.from('banned_ips').select('id, ip_address')
    const bannedIds =
      bannedRows
        ?.filter((row) => extractRouletteCodeFromIp(row.ip_address) === targetCode)
        .map((row) => row.id) ?? []
    if (bannedIds.length > 0) {
      await supabase.from('banned_ips').delete().in('id', bannedIds)
    }

    const { data: winnerRows } = await supabase.from('recent_winners').select('id, ip_address')
    const winnerIds =
      winnerRows
        ?.filter((row) => extractRouletteCodeFromIp(row.ip_address) === targetCode)
        .map((row) => row.id) ?? []
    if (winnerIds.length > 0) {
      await supabase.from('recent_winners').delete().in('id', winnerIds)
    }

    await syncParticipantsFresh('delete_roulette')
  }

  return {
    participants,
    bannedUsers,
    recentWinners,
    sponsors,
    banners,
    loading,
    syncError,
    realtimeReady,
    syncParticipantsFresh,
    verifyParticipantRegistered,
    addParticipant,
    deleteParticipant,
    deleteMultiple,
    updateStatus,
    banUser,
    unbanUser,
    resetGame,
    clearAll,
    removeRecentWinner,
    removeMultipleRecentWinners,
    addSponsor,
    deleteSponsor,
    deleteMultipleSponsors,
    updateSponsorsOrder,
    updateSponsorDetails,
    addBanner,
    updateBanner,
    deleteBanner,
    deleteRouletteData,
    spectatorView,
    incomingSpin,
    broadcastView,
    broadcastSpin,
    rouletteConfig,
  }
}
