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
import { eventLog } from '@/app/utils/eventLog'
import { diagnostics } from '@/app/utils/runtimeDiagnostics'
import { telemetry } from '@/app/utils/telemetry'
import {
  encodeRegistrationToken,
  encodeUsernameKey,
  getOrCreateDeviceToken,
} from '@/app/utils/registrationToken'
import { randomRegistrationColor } from '@/app/utils/participantColor'

const PARTICIPANT_COLUMNS =
  'id,username,team,status,ip_address,registration_token,username_key,device_fingerprint'
const PARTICIPANT_COLUMNS_LEGACY = 'id,username,team,status,ip_address'
const UPSERT_BATCH_MS = 200

const IDENTITY_COLUMN_MISSING =
  /registration_token|username_key|device_fingerprint/i

/** Valor de sala sin IP pública: identity = token de dispositivo. */
function encodeDeviceRoomKey(deviceToken: string, rouletteCode: string): string {
  return encodeIpForRoulette(`d:${deviceToken}`, sanitizeRouletteCode(rouletteCode))
}

export interface Participant {
  id: string
  username: string
  /** Color hex del segmento en ruleta (legacy: blue/yellow/red). */
  team: string
  status: 'active' | 'winner' | 'discarded'
  ip_address?: string
  registration_token?: string | null
  username_key?: string | null
  device_fingerprint?: string | null
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
export interface WinnerPrizeCode {
  id: string
  code: string
  assigned_to_participant_id?: string | null
  assigned_to_username?: string | null
  assigned_at?: string | null
}

export type IncomingSpin = {
  rotation: number
  winnerId: string
  winnerUsername?: string
  winnerTeam?: Participant['team']
  winnerPrizeCode?: string | null
  localReceivedAt: number
}

function makeTempId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function makePrizeCodeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `code-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const WINNER_PRIZE_CODES_KEY = (code: string) =>
  `winner_prize_codes:${sanitizeRouletteCode(code)}`

function normalizeWinnerPrizeCodes(raw: unknown): WinnerPrizeCode[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const codes: WinnerPrizeCode[] = []

  for (const item of raw) {
    const source =
      typeof item === 'string'
        ? { code: item }
        : item && typeof item === 'object'
          ? (item as Record<string, unknown>)
          : null
    if (!source) continue

    const code = typeof source.code === 'string' ? source.code.trim() : ''
    if (!code || seen.has(code)) continue
    seen.add(code)

    const id = typeof source.id === 'string' && source.id.trim()
      ? source.id.trim()
      : makePrizeCodeId()
    const assignedToParticipantId =
      typeof source.assigned_to_participant_id === 'string'
        ? source.assigned_to_participant_id
        : null
    const assignedToUsername =
      typeof source.assigned_to_username === 'string'
        ? source.assigned_to_username
        : null
    const assignedAt =
      typeof source.assigned_at === 'string'
        ? source.assigned_at
        : null

    codes.push({
      id,
      code,
      assigned_to_participant_id: assignedToParticipantId,
      assigned_to_username: assignedToUsername,
      assigned_at: assignedAt,
    })
  }

  return codes.slice(0, 10)
}

export function useParticipants(
  activeRouletteCode: string = DEFAULT_ROULETTE_CODE,
  options: { loadParticipants?: boolean; loadWinnerPrizeCodes?: boolean } = {},
) {
  const loadParticipants = options.loadParticipants ?? true
  const loadWinnerPrizeCodes = options.loadWinnerPrizeCodes ?? loadParticipants
  const rouletteCode = sanitizeRouletteCode(activeRouletteCode)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([])
  const [winnerPrizeCodes, setWinnerPrizeCodes] = useState<WinnerPrizeCode[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [banners, setBanners] = useState<Banner[]>(() => loadCachedSponsorBanners())
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [realtimeReady, setRealtimeReady] = useState(false)

  const [spectatorView, setSpectatorView] = useState<'main' | 'roulette'>('main')
  const [incomingSpin, setIncomingSpin] = useState<IncomingSpin | null>(null)
  /** Sube cuando admin limpia la ruleta → nueva ronda de registro. */
  const [roundVersion, setRoundVersion] = useState(0)
  /** false cuando la ruleta gira (o se recibió el giro). */
  const [showWaitingAnnouncement, setShowWaitingAnnouncement] = useState(true)

  const [rouletteConfig, setRouletteConfig] = useState({ penaltyMonths: 2, penaltyPercent: 70 })
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const refetchTimerRef = useRef<number | null>(null)
  const loadWinnerPrizeCodesRef = useRef(loadWinnerPrizeCodes)
  const participantsRef = useRef(participants)
  const bannedUsersRef = useRef(bannedUsers)
  const winnerPrizeCodesRef = useRef(winnerPrizeCodes)
  const participantsByIdRef = useRef<Map<string, Participant>>(new Map())
  const pendingUpsertsRef = useRef<Map<string, Participant>>(new Map())
  const upsertFlushTimerRef = useRef<number | null>(null)
  const fetchGenRef = useRef(0)
  const prizeCodeFetchGenRef = useRef(0)
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
    winnerPrizeCodesRef.current = winnerPrizeCodes
  }, [winnerPrizeCodes])

  useEffect(() => {
    loadWinnerPrizeCodesRef.current = loadWinnerPrizeCodes
  }, [loadWinnerPrizeCodes])

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
      let next = [...prev]
      // Quita filas temporales del mismo token (evita duplicados tras INSERT+realtime).
      const tokens = new Set(
        [...batch.values()]
          .map((row) => row.registration_token)
          .filter((token): token is string => Boolean(token)),
      )
      if (tokens.size > 0) {
        next = next.filter(
          (row) => !(row.id.startsWith('local-') && row.registration_token && tokens.has(row.registration_token)),
        )
      }
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

  const fetchSponsors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('order_index', { ascending: true })
      if (error) throw error
      setSponsors((data as Sponsor[]) ?? [])
    } catch (error) {
      eventLog.error('sponsors', 'fetch failed', {
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
      // Historial global: sirve para penalizaciones y panel admin (no se acota por sala).
      setRecentWinners(rwData as RecentWinner[])
    }
  }, [])

  const fetchWinnerPrizeCodes = useCallback(async () => {
    if (!loadWinnerPrizeCodesRef.current) {
      setWinnerPrizeCodes([])
      winnerPrizeCodesRef.current = []
      return
    }
    const gen = ++prizeCodeFetchGenRef.current
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', WINNER_PRIZE_CODES_KEY(rouletteCodeRef.current))
        .maybeSingle()
      if (gen !== prizeCodeFetchGenRef.current) return
      if (error) throw error
      const parsed = normalizeWinnerPrizeCodes(data?.value)
      setWinnerPrizeCodes(parsed)
      winnerPrizeCodesRef.current = parsed
    } catch (error) {
      eventLog.error('winner_codes', 'fetch failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      if (gen === prizeCodeFetchGenRef.current) {
        setWinnerPrizeCodes([])
        winnerPrizeCodesRef.current = []
      }
    }
  }, [])

  const persistWinnerPrizeCodes = useCallback(async (codes: WinnerPrizeCode[]) => {
    const normalized = normalizeWinnerPrizeCodes(codes)
    const key = WINNER_PRIZE_CODES_KEY(rouletteCodeRef.current)
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        { key, value: normalized, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      )
    if (error) throw error
  }, [])

  const saveWinnerPrizeCodes = useCallback(async (codes: WinnerPrizeCode[]) => {
    const normalized = normalizeWinnerPrizeCodes(codes)
    setWinnerPrizeCodes(normalized)
    winnerPrizeCodesRef.current = normalized
    try {
      await persistWinnerPrizeCodes(normalized)
    } catch (error) {
      eventLog.error('winner_codes', 'save failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }, [persistWinnerPrizeCodes])

  const assignWinnerPrizeCode = useCallback(async (winner: Participant): Promise<WinnerPrizeCode | null> => {
    const current = winnerPrizeCodesRef.current
    const existing = current.find((entry) => entry.assigned_to_participant_id === winner.id)
    if (existing) return existing

    const available = current.find((entry) => !entry.assigned_to_participant_id)
    if (!available) return null

    const assigned: WinnerPrizeCode = {
      ...available,
      assigned_to_participant_id: winner.id,
      assigned_to_username: winner.username,
      assigned_at: new Date().toISOString(),
    }
    const next = current.map((entry) => (entry.id === available.id ? assigned : entry))
    setWinnerPrizeCodes(next)
    winnerPrizeCodesRef.current = next

    try {
      await persistWinnerPrizeCodes(next)
    } catch (error) {
      eventLog.error('winner_codes', 'assign failed', {
        error: error instanceof Error ? error.message : String(error),
        winnerId: winner.id,
      })
    }

    return assigned
  }, [persistWinnerPrizeCodes])

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
      let { data, error } = await supabase
        .from('participants')
        .select(PARTICIPANT_COLUMNS)
        .order('created_at', { ascending: true })

      if (error && IDENTITY_COLUMN_MISSING.test(error.message)) {
        const legacy = await supabase
          .from('participants')
          .select(PARTICIPANT_COLUMNS_LEGACY)
          .order('created_at', { ascending: true })
        data = legacy.data
        error = legacy.error
      }

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
      telemetry.syncDuration(ms, reason, filtered.length)
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

    const [pResRaw, bRes, sRes, rwRes] = await Promise.all([
      supabase.from('participants').select(PARTICIPANT_COLUMNS).order('created_at', { ascending: true }),
      supabase.from('banned_ips').select('*').order('created_at', { ascending: false }),
      supabase.from('sponsors').select('*').order('order_index', { ascending: true }),
      supabase.from('recent_winners').select('*').order('won_at', { ascending: false }),
    ])

    let pRes = pResRaw
    if (pRes.error && IDENTITY_COLUMN_MISSING.test(pRes.error.message)) {
      pRes = await supabase
        .from('participants')
        .select(PARTICIPANT_COLUMNS_LEGACY)
        .order('created_at', { ascending: true })
    }

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
      setRecentWinners(rwRes.data as RecentWinner[])
    } else if (rwRes.error) {
      eventLog.error('roulette', 'recent_winners fetch failed', { error: rwRes.error.message })
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
    setWinnerPrizeCodes([])
    setLoading(true)
    setSyncError(null)
    fetchGenRef.current += 1
    prizeCodeFetchGenRef.current += 1
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
      setShowWaitingAnnouncement(false)
      setIncomingSpin({
        rotation: payload.payload.rotation,
        winnerId: payload.payload.winnerId,
        winnerUsername: payload.payload.winnerUsername,
        winnerTeam: payload.payload.winnerTeam,
        winnerPrizeCode: payload.payload.winnerPrizeCode ?? null,
        localReceivedAt: Date.now(),
      })
    })

    syncChannel.on('broadcast', { event: 'round_reset' }, () => {
      setShowWaitingAnnouncement(true)
      setIncomingSpin(null)
      setRoundVersion((v) => v + 1)
      eventLog.info('roulette', 'round_reset received', { code: rouletteCode })
    })

    syncChannel.subscribe((status) => {
      setRealtimeReady(status === 'SUBSCRIBED')
      diagnostics.patch({ realtimeStatus: String(status) })
      eventLog.info('roulette', 'sync channel', { status, code: rouletteCode })
      // No precargar toda la lista en espectadores de registro (acelera el arranque en 3G).
      if (status === 'SUBSCRIBED' && loadParticipantsRef.current) {
        void syncParticipantsFresh('channel_subscribed')
      }
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
    void fetchSponsors()
    if (loadWinnerPrizeCodes) void fetchWinnerPrizeCodes()
    else {
      setWinnerPrizeCodes([])
      winnerPrizeCodesRef.current = []
    }

    let cancelled = false
    const boot = async () => {
      try {
        if (loadParticipants) {
          setLoading(true)
          await Promise.all([fetchParticipantsData(), fetchRecentWinners(), fetchRegistrationMeta()])
        } else {
          // Público: sin banned_ips ni lista completa. Solo sponsors/banners en paralelo arriba.
          setLoading(false)
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
  }, [rouletteCode, loadParticipants, loadWinnerPrizeCodes, fetchBanners, fetchSponsors, fetchParticipantsData, fetchRegistrationMeta, fetchRecentWinners, fetchWinnerPrizeCodes])

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsors' }, () => {
        void fetchSponsors()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload) => {
        const row = (payload.new || payload.old) as { key?: string }
        if (loadWinnerPrizeCodesRef.current && row.key === WINNER_PRIZE_CODES_KEY(rouletteCodeRef.current)) {
          void fetchWinnerPrizeCodes()
        }
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
    fetchSponsors,
    fetchRegistrationMeta,
    fetchRecentWinners,
    fetchWinnerPrizeCodes,
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
    winnerPrizeCode?: string | null,
  ) => {
    setShowWaitingAnnouncement(false)
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'spin',
        payload: { rotation, winnerId, winnerUsername, winnerTeam, winnerPrizeCode },
      })
    }
  }

  const broadcastRoundReset = async () => {
    setShowWaitingAnnouncement(true)
    setIncomingSpin(null)
    setRoundVersion((v) => v + 1)
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'round_reset',
        payload: { at: Date.now() },
      })
    }
  }

  const selectParticipants = async (query: {
    eq?: { col: string; val: string }
    orderAsc?: boolean
    orderDesc?: boolean
    limit?: number
    single?: boolean
  }) => {
    let builder = supabase.from('participants').select(PARTICIPANT_COLUMNS)
    if (query.eq) builder = builder.eq(query.eq.col, query.eq.val)
    if (query.orderAsc) builder = builder.order('created_at', { ascending: true })
    if (query.orderDesc) builder = builder.order('created_at', { ascending: false })
    if (query.limit) builder = builder.limit(query.limit)

    let result = query.single || query.limit === 1
      ? await builder.maybeSingle()
      : await builder

    if (result.error && IDENTITY_COLUMN_MISSING.test(result.error.message)) {
      let legacy = supabase.from('participants').select(PARTICIPANT_COLUMNS_LEGACY)
      if (query.eq) legacy = legacy.eq(query.eq.col, query.eq.val)
      if (query.orderAsc) legacy = legacy.order('created_at', { ascending: true })
      if (query.orderDesc) legacy = legacy.order('created_at', { ascending: false })
      if (query.limit) legacy = legacy.limit(query.limit)
      result = query.single || query.limit === 1 ? await legacy.maybeSingle() : await legacy
    }
    return result
  }

  const loadParticipantByToken = async (token: string): Promise<Participant | null> => {
    const { data, error } = await selectParticipants({
      eq: { col: 'registration_token', val: token },
      single: true,
    })
    if (error) return null
    return (data as Participant | null) ?? null
  }

  /**
   * Confirma registro de ESTE dispositivo (solo por token).
   * No usa IP ni huella: en Wi‑Fi de evento eso robaba identidad.
   */
  const verifyParticipantRegistered = async (_ip?: string): Promise<boolean> => {
    const roomToken = encodeRegistrationToken(getOrCreateDeviceToken(), rouletteCode)
    try {
      const byToken = await loadParticipantByToken(roomToken)
      if (!byToken) return false
      if (belongsToRoomRef.current(byToken.ip_address)) {
        upsertParticipant(byToken, true)
      }
      diagnostics.patch({ lastRegisterAt: Date.now(), lastRegisterOk: true })
      eventLog.info('register', 'verify ok by token', { id: byToken.id })
      return true
    } catch {
      return false
    }
  }

  const addParticipant = async (
    username: string,
    _ip: string,
    isAdminBypass: boolean = false,
  ) => {
    const timer = eventLog.timed('register', 'addParticipant')
    const deviceToken = isAdminBypass ? `admin-${Date.now()}` : getOrCreateDeviceToken()
    const roomToken = encodeRegistrationToken(deviceToken, rouletteCode)
    const usernameKey = encodeUsernameKey(username, rouletteCode)
    const team = randomRegistrationColor(roomToken)
    // Sin IP pública: usamos d:{token} para pertenencia a sala (UNIQUE de IP ya no aplica).
    const finalIp = encodeDeviceRoomKey(deviceToken, rouletteCode)

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
      const alreadyLocal = participantsRef.current.find(
        (row) => row.registration_token === roomToken,
      )
      if (alreadyLocal) {
        finishOk(alreadyLocal, { idempotent: 'local-token' })
        return
      }
    }

    const payload: Record<string, string> = {
      username,
      team,
      status: 'active',
      ip_address: finalIp,
      registration_token: roomToken,
      username_key: usernameKey,
    }

    let { data: insertedRow, error } = await supabase
      .from('participants')
      .insert([payload])
      .select(PARTICIPANT_COLUMNS)
      .maybeSingle()

    if (error && IDENTITY_COLUMN_MISSING.test(error.message)) {
      eventLog.warn('register', 'identity columns missing; fallback insert', {
        message: error.message,
      })
      const fallbackPayload: Record<string, string> = {
        username,
        team,
        status: 'active',
        ip_address: finalIp,
      }
      if (!/registration_token/i.test(error.message)) {
        fallbackPayload.registration_token = roomToken
      }
      if (!/username_key/i.test(error.message)) {
        fallbackPayload.username_key = usernameKey
      }
      const fallback = await supabase
        .from('participants')
        .insert([fallbackPayload])
        .select(PARTICIPANT_COLUMNS_LEGACY)
        .maybeSingle()
      error = fallback.error
      insertedRow = fallback.data as Participant | null
    }

    if (error) {
      if (error.code === '23505') {
        const detail = String(error.details || error.message)
        eventLog.warn('register', '23505 unique conflict', {
          details: detail,
          roomTokenPrefix: roomToken.slice(0, 12),
        })

        // Mismo dispositivo reintentando → OK con SU fila.
        if (/registration_token/i.test(detail) || /ip_address/i.test(detail)) {
          const mine = await loadParticipantByToken(roomToken)
          if (mine) {
            telemetry.uniqueConflict(/registration_token/i.test(detail) ? 'token' : 'ip')
            finishOk(mine, { idempotent: '23505-token' })
            return
          }
        }

        // Nombre ya tomado por OTRA persona → error (nunca adjuntar su fila).
        if (/username_key/i.test(detail)) {
          telemetry.uniqueConflict('unknown')
          timer.fail(error, { code: '23505-username' })
          diagnostics.patch({ lastRegisterOk: false, lastError: 'username taken' })
          throw new Error('Ese nombre de entrenador ya está registrado. Usa el tuyo.')
        }

        // Conflicto genérico: solo recupera si es ESTE token.
        const mine = await loadParticipantByToken(roomToken)
        if (mine) {
          telemetry.uniqueConflict('unknown')
          finishOk(mine, { idempotent: '23505-mine' })
          return
        }

        timer.fail(error, { code: '23505' })
        diagnostics.patch({ lastRegisterOk: false, lastError: '23505' })
        throw new Error('No se pudo completar el registro. Intenta de nuevo.')
      }
      timer.fail(error)
      diagnostics.patch({
        lastRegisterOk: false,
        lastError: error.message,
      })
      throw error
    }

    const row: Participant = (insertedRow as Participant | null) ?? {
      id: makeTempId(),
      username,
      team,
      status: 'active',
      ip_address: finalIp,
      registration_token: roomToken,
      username_key: usernameKey,
    }
    finishOk(row, { optimistic: !insertedRow })
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

        if (winnerRow) {
          setRecentWinners((prev) => [winnerRow as RecentWinner, ...prev])
        } else {
          // Fallback si .single() no devolvió fila: recarga historial completo.
          void fetchRecentWinners()
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
    if (participants.length === 0) {
      await broadcastRoundReset()
      return
    }
    const ids = participants.map((p) => p.id)
    await supabase.from('participants').delete().in('id', ids)
    setParticipants([])
    await broadcastRoundReset()
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
    await fetchSponsors()
  }

  const deleteSponsor = async (id: string) => {
    await supabase.from('sponsors').delete().eq('id', id)
    await fetchSponsors()
  }
  const deleteMultipleSponsors = async (ids: string[]) => {
    await supabase.from('sponsors').delete().in('id', ids)
    await fetchSponsors()
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
    await fetchSponsors()
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

    await supabase.from('app_settings').delete().eq('key', WINNER_PRIZE_CODES_KEY(targetCode))

    await syncParticipantsFresh('delete_roulette')
  }

  return {
    participants,
    bannedUsers,
    recentWinners,
    winnerPrizeCodes,
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
    saveWinnerPrizeCodes,
    assignWinnerPrizeCode,
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
    roundVersion,
    showWaitingAnnouncement,
    broadcastView,
    broadcastSpin,
    broadcastRoundReset,
    rouletteConfig,
  }
}
