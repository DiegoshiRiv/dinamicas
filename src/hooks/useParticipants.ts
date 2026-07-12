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

const PARTICIPANT_COLUMNS = 'id,username,team,status,ip_address'
const UPSERT_BATCH_MS = 200

export interface Participant { id: string; username: string; team: 'blue' | 'yellow' | 'red'; status: 'active' | 'winner' | 'discarded'; ip_address?: string }
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

  useEffect(() => {
    participantsRef.current = participants
    const map = new Map<string, Participant>()
    for (const p of participants) map.set(p.id, p)
    participantsByIdRef.current = map
  }, [participants])

  useEffect(() => {
    bannedUsersRef.current = bannedUsers
  }, [bannedUsers])

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

  const fetchBanners = async () => {
    try {
      const { data } = await supabase
        .from('sponsor_banners')
        .select('id, image_url, link_url')
        .order('created_at', { ascending: true })
      if (data?.length) {
        const next = data as Banner[]
        setBanners(next)
        saveCachedSponsorBanners(next)
        preloadSponsorBannerImages(next)
      }
    } catch (error) {
      console.error('Error cargando banners:', error)
    }
  }

  const fetchRegistrationMeta = async () => {
    const { data: bData } = await supabase
      .from('banned_ips')
      .select('*')
      .order('created_at', { ascending: false })

    if (bData) {
      setBannedUsers(
        (bData as BannedUser[]).filter((b) => belongsToRoom(b.ip_address)),
      )
    }
  }

  const fetchRecentWinners = async () => {
    const { data: rwData } = await supabase
      .from('recent_winners')
      .select('*')
      .order('won_at', { ascending: false })

    if (rwData) {
      setRecentWinners(
        (rwData as RecentWinner[]).filter((w) => belongsToRoom(w.ip_address)),
      )
    }
  }

  const fetchParticipantsData = async () => {
    const [
      { data: pData },
      { data: bData },
      { data: sData },
      { data: rwData },
    ] = await Promise.all([
      supabase.from('participants').select(PARTICIPANT_COLUMNS).order('created_at', { ascending: true }),
      supabase.from('banned_ips').select('*').order('created_at', { ascending: false }),
      supabase.from('sponsors').select('*').order('order_index', { ascending: true }),
      supabase.from('recent_winners').select('*').order('won_at', { ascending: false }),
    ])

    if (pData) {
      setParticipants(
        (pData as Participant[]).filter((p) => belongsToRoom(p.ip_address)),
      )
    }

    if (bData) {
      const filtered = (bData as BannedUser[]).filter(
        (b) => extractRouletteCodeFromIp(b.ip_address) === rouletteCode,
      )
      setBannedUsers(filtered)
    }

    if (sData) setSponsors(sData as Sponsor[])

    if (rwData) {
      const filtered = (rwData as RecentWinner[]).filter(
        (w) => extractRouletteCodeFromIp(w.ip_address) === rouletteCode,
      )
      setRecentWinners(filtered)
    }
  }

  const fetchData = async () => {
    try {
      if (loadParticipants) {
        setLoading(true)
        await fetchParticipantsData()
      } else {
        await fetchRegistrationMeta()
      }
    } catch (error) {
      console.error('Error cargando:', error)
    } finally {
      setLoading(false)
    }
  }

  const scheduleParticipantsRefetch = () => {
    if (refetchTimerRef.current) window.clearTimeout(refetchTimerRef.current)
    refetchTimerRef.current = window.setTimeout(() => {
      void fetchParticipantsData().catch((error) => {
        console.error('Error refrescando participantes:', error)
      })
    }, 1500)
  }

  // Canal de sync de ruleta: NUNCA se reinicia al cambiar loadParticipants
  // (evita perder spins/broadcasts al abrir la ruleta).
  useEffect(() => {
    const syncChannel = supabase.channel(`roulette_sync_${rouletteCode}`, {
      config: { broadcast: { self: false } },
    })

    syncChannel.on('broadcast', { event: 'set_view' }, (payload) => {
      setSpectatorView(payload.payload.view)
      if (payload.payload.config) setRouletteConfig(payload.payload.config)
      // Precarga lista apenas el admin abre la ruleta (antes del render de currentView).
      if (payload.payload.view === 'roulette') {
        void fetchParticipantsData().catch((error) => {
          console.error('Error precargando ruleta:', error)
        })
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

    syncChannel.subscribe()
    channelRef.current = syncChannel

    return () => {
      supabase.removeChannel(syncChannel)
      if (channelRef.current === syncChannel) channelRef.current = null
    }
    // fetchParticipantsData is stable enough via closure; rouletteCode is the key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rouletteCode])

  // Datos + realtime DB (sí depende de loadParticipants).
  useEffect(() => {
    const cached = loadCachedSponsorBanners()
    if (cached.length > 0) preloadSponsorBannerImages(cached)
    void fetchBanners()
    void fetchData()

    const dbChannel = supabase.channel(`public:db_changes_${rouletteCode}_${loadParticipants ? 'full' : 'light'}`)

    if (loadParticipants) {
      dbChannel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'participants' },
          (payload) => {
            const row = payload.new as Participant
            if (belongsToRoom(row.ip_address)) upsertParticipant(row)
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'participants' },
          (payload) => {
            const row = payload.new as Participant
            if (belongsToRoom(row.ip_address)) {
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
    }

    dbChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banned_ips' }, () => {
        if (loadParticipants) scheduleParticipantsRefetch()
        else void fetchRegistrationMeta()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recent_winners' }, () => {
        if (loadParticipants) void fetchRecentWinners()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsor_banners' }, () => fetchBanners())
      .subscribe()

    return () => {
      if (refetchTimerRef.current) window.clearTimeout(refetchTimerRef.current)
      if (upsertFlushTimerRef.current) window.clearTimeout(upsertFlushTimerRef.current)
      supabase.removeChannel(dbChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rouletteCode, loadParticipants, belongsToRoom, upsertParticipant])

  const broadcastView = async (view: 'main' | 'roulette', config?: unknown) => {
    if (channelRef.current) await channelRef.current.send({ type: 'broadcast', event: 'set_view', payload: { view, config } })
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

  const checkDuplicateInDb = async (finalIp: string) => {
    const { data: existingRow, error } = await supabase
      .from('participants')
      .select('id')
      .eq('ip_address', finalIp)
      .maybeSingle()
    if (error) throw error
    if (existingRow) {
      throw new Error('Solo se permite un registro por persona.')
    }
  }

  const addParticipant = async (username: string, team: string, ip: string, isAdminBypass: boolean = false) => {
    const rawIp = isAdminBypass ? `admin-bypass-${Date.now()}` : ip
    const finalIp = encodeIpForRoulette(rawIp, rouletteCode)

    if (!isAdminBypass) {
      if (!isValidPublicIp(ip)) {
        throw new Error('No pudimos verificar tu conexión. Reintenta en un momento.')
      }

      const now = new Date()
      const banned = bannedUsersRef.current.find(
        (ban) => ban.ip_address === finalIp && new Date(ban.expires_at) > now,
      )
      if (banned) {
        // Respuesta silenciosa: el usuario ve "¡Registro completado!" sin insertar en DB
        // (evita conflictos presenciales con personas baneadas).
        await new Promise((resolve) => setTimeout(resolve, 800))
        return
      }

      const alreadyRegistered = participantsRef.current.some(
        (row) =>
          row.ip_address === finalIp ||
          (extractBaseIp(row.ip_address) === ip && belongsToRoom(row.ip_address)),
      )
      if (alreadyRegistered) {
        throw new Error('Solo se permite un registro por persona.')
      }

      await checkDuplicateInDb(finalIp)
    }

    const { data: inserted, error } = await supabase
      .from('participants')
      .insert([{ username, team, status: 'active', ip_address: finalIp }])
      .select(PARTICIPANT_COLUMNS)
      .single()

    if (error) {
      if (error.code === '23505') throw new Error('Usuario ya registrado.')
      throw error
    }

    if (inserted) {
      upsertParticipant(inserted as Participant, true)
    }
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

        if (winnerRow && belongsToRoom(winnerRow.ip_address)) {
          setRecentWinners((prev) => [winnerRow as RecentWinner, ...prev])
        }
      }
    }
  }

  const banUser = async (id: string, durationInDays: number, bannedBy?: string) => {
    const user = participants.find(p => p.id === id)
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
      console.error('Error al banear:', error)
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
    const nextOrder = sponsors.length > 0 ? Math.max(...sponsors.map(s => s.order_index || 0)) + 1 : 0
    await supabase.from('sponsors').insert([{ name: username, url: finalUrl, image_url, order_index: nextOrder }])
    await fetchParticipantsData()
  }

  const deleteSponsor = async (id: string) => { await supabase.from('sponsors').delete().eq('id', id); await fetchParticipantsData() }
  const deleteMultipleSponsors = async (ids: string[]) => { await supabase.from('sponsors').delete().in('id', ids); await fetchParticipantsData() }
  const updateSponsorsOrder = async (reorderedList: Sponsor[]) => { setSponsors(reorderedList); const updates = reorderedList.map((s, idx) => ({ id: s.id, name: s.name, url: s.url, image_url: s.image_url, order_index: idx })); await supabase.from('sponsors').upsert(updates) }
  const updateSponsorDetails = async (id: string, image_url: string, url: string) => { await supabase.from('sponsors').update({ image_url, url }).eq('id', id); await fetchParticipantsData() }

  const addBanner = async (image_url: string, link_url: string = '') => { await supabase.from('sponsor_banners').insert([{ image_url, link_url }]); await fetchBanners() }
  const updateBanner = async (id: string, image_url: string, link_url: string = '') => { await supabase.from('sponsor_banners').update({ image_url, link_url }).eq('id', id); await fetchBanners() }
  const deleteBanner = async (id: string) => { await supabase.from('sponsor_banners').delete().eq('id', id); await fetchBanners() }

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

    await fetchData()
  }

  return {
    participants, bannedUsers, recentWinners, sponsors, banners, loading,
    addParticipant, deleteParticipant, deleteMultiple, updateStatus,
    banUser, unbanUser, resetGame, clearAll, 
    removeRecentWinner, removeMultipleRecentWinners,
    addSponsor, deleteSponsor, deleteMultipleSponsors, updateSponsorsOrder, updateSponsorDetails,
    addBanner, updateBanner, deleteBanner,
    deleteRouletteData,
    spectatorView, incomingSpin, broadcastView, broadcastSpin, rouletteConfig
  }
}
