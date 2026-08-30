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
  extractRoomCode,
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
import { RegisterError } from '@/app/utils/registerError'

const PARTICIPANT_COLUMNS =
  'id,username,team,status,ip_address,roulette_code,registration_token,username_key,device_fingerprint'
const PARTICIPANT_COLUMNS_LEGACY = 'id,username,team,status,ip_address'
const UPSERT_BATCH_MS = 200

const IDENTITY_COLUMN_MISSING =
  /registration_token|username_key|device_fingerprint|roulette_code/i

const REGISTER_MAX_ATTEMPTS = 3
const REGISTER_RETRY_DELAYS_MS = [250, 700]

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

/** Traduce fallos técnicos a algo que el entrenador pueda entender y accionar. */
function friendlyRegisterError(error: { code?: string; message?: string }): string {
  const message = String(error.message ?? '')
  if (/failed to fetch|network|socket|econn/i.test(message)) {
    return 'Se perdió la conexión. Revisa tu internet e intenta de nuevo.'
  }
  if (/timeout|aborted/i.test(message)) {
    return 'La red va lenta ahora mismo. Intenta de nuevo en unos segundos.'
  }
  if (/jwt|permission|policy|row-level/i.test(message)) {
    return 'El registro está cerrado en este momento. Avisa al organizador.'
  }
  return 'No se pudo completar el registro. Intenta de nuevo.'
}

/**
 * Fallos de red o saturación momentánea del servidor: merecen reintento.
 * Un conflicto de unicidad o un rechazo de permisos, no.
 */
function isRetryableRegisterError(error: { code?: string; message?: string }): boolean {
  const code = String(error.code ?? '')
  if (code === '23505' || code.startsWith('42')) return false
  const message = String(error.message ?? '')
  if (/failed to fetch|network|timeout|socket|aborted|econn/i.test(message)) return true
  // PostgREST devuelve códigos HTTP como string para errores de infraestructura.
  if (/^(408|429|500|502|503|504)$/.test(code)) return true
  return !error.code
}

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
  /** Sala a la que pertenece la fila. Antes se deducía parseando ip_address. */
  roulette_code?: string | null
  registration_token?: string | null
  username_key?: string | null
  device_fingerprint?: string | null
  created_at?: string
}
export interface BannedUser {
  id: string
  ip_address: string
  roulette_code?: string | null
  username: string
  expires_at: string
  banned_by?: string | null
  created_at?: string
}
export interface RecentWinner {
  id: string
  username: string
  ip_address: string
  roulette_code?: string | null
  won_at: string
}
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

/** La tabla public.app_settings todavía no existe en este proyecto de Supabase. */
function isMissingSettingsTable(error: unknown): boolean {
  const err = error as { code?: string; message?: string } | null
  if (!err) return false
  if (err.code === 'PGRST205' || err.code === '42P01') return true
  return /could not find the table|does not exist/i.test(String(err.message ?? ''))
}

function readLocalPrizeCodes(key: string): WinnerPrizeCode[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? normalizeWinnerPrizeCodes(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

function writeLocalPrizeCodes(key: string, codes: WinnerPrizeCode[]) {
  try {
    localStorage.setItem(key, JSON.stringify(codes))
  } catch {
    /* sin espacio o modo privado: la copia en servidor sigue siendo la buena */
  }
}

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

  const [rouletteConfig, setRouletteConfig] = useState({ penaltyMonths: 12, penaltyPercent: 90 })
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
  const belongsToRoomRef = useRef(
    (row: { roulette_code?: string | null; ip_address?: string | null }) =>
      extractRoomCode(row) === rouletteCode,
  )

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
    belongsToRoomRef.current = (row) => extractRoomCode(row) === rouletteCode
  }, [rouletteCode])

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

  /**
   * Tira los upserts en vuelo. Se acumulan 200 ms antes de aplicarse, así que
   * sin esto un "limpiar ruleta" o una sincronización que caiga dentro de esa
   * ventana quedaba pisada después por filas ya borradas del servidor, que
   * reaparecían como fantasmas y podían llegar a ganar.
   */
  const discardPendingUpserts = useCallback(() => {
    if (upsertFlushTimerRef.current) {
      window.clearTimeout(upsertFlushTimerRef.current)
      upsertFlushTimerRef.current = null
    }
    pendingUpsertsRef.current.clear()
  }, [])

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
        (bData as BannedUser[]).filter((b) => belongsToRoomRef.current(b)),
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
    const key = WINNER_PRIZE_CODES_KEY(rouletteCodeRef.current)
    const apply = (codes: WinnerPrizeCode[]) => {
      if (gen !== prizeCodeFetchGenRef.current) return
      setWinnerPrizeCodes(codes)
      winnerPrizeCodesRef.current = codes
    }

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle()
      if (gen !== prizeCodeFetchGenRef.current) return
      if (error) throw error
      apply(normalizeWinnerPrizeCodes(data?.value))
    } catch (error) {
      if (isMissingSettingsTable(error)) {
        apply(readLocalPrizeCodes(key))
        return
      }
      eventLog.error('winner_codes', 'fetch failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      apply(readLocalPrizeCodes(key))
    }
  }, [])

  const persistWinnerPrizeCodes = useCallback(async (codes: WinnerPrizeCode[]) => {
    const normalized = normalizeWinnerPrizeCodes(codes)
    const key = WINNER_PRIZE_CODES_KEY(rouletteCodeRef.current)
    // Copia local siempre: si la tabla de ajustes no está creada, los códigos
    // siguen funcionando en este dispositivo en lugar de perderse al guardar.
    writeLocalPrizeCodes(key, normalized)

    const { error } = await supabase
      .from('app_settings')
      .upsert(
        { key, value: normalized, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      )
    if (!error) return
    if (isMissingSettingsTable(error)) {
      eventLog.warn('winner_codes', 'app_settings table missing; usando copia local', {
        message: error.message,
      })
      return
    }
    throw error
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
        data = legacy.data as typeof data
        error = legacy.error
      }

      if (error) throw error
      if (gen !== fetchGenRef.current) {
        timer.end({ reason, stale: true, code })
        return participantsRef.current
      }

      const filtered = ((data ?? []) as Participant[]).filter((p) =>
        belongsToRoomRef.current(p),
      )

      // La consulta manda sobre lo que hubiera en la cola de 200 ms.
      discardPendingUpserts()
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
  }, [discardPendingUpserts])

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
      pRes = (await supabase
        .from('participants')
        .select(PARTICIPANT_COLUMNS_LEGACY)
        .order('created_at', { ascending: true })) as typeof pResRaw
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
        belongsToRoomRef.current(p),
      )
      setParticipants(filtered)
      setSyncError(null)
      timer.end({ count: filtered.length, code })
    }

    if (!bRes.error && bRes.data) {
      setBannedUsers(
        (bRes.data as BannedUser[]).filter((b) => belongsToRoomRef.current(b)),
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
    discardPendingUpserts()
    setParticipants([])
    setWinnerPrizeCodes([])
    setLoading(true)
    setSyncError(null)
    fetchGenRef.current += 1
    prizeCodeFetchGenRef.current += 1
  }, [rouletteCode, discardPendingUpserts])

  /**
   * Se incrementa para forzar la recreación del canal cuando el navegador
   * vuelve de segundo plano con el websocket muerto.
   */
  const [channelEpoch, setChannelEpoch] = useState(0)

  // Canal de sync de ruleta: estable respecto a loadParticipants.
  useEffect(() => {
    const syncChannel = supabase.channel(`roulette_sync_${rouletteCode}_${channelEpoch}`, {
      config: { broadcast: { self: false } },
    })

    syncChannel.on('broadcast', { event: 'set_view' }, (payload) => {
      // Se valida porque un móvil con la app vieja puede mandar otra cosa y
      // dejaría al espectador en una vista que no existe.
      setSpectatorView(payload.payload?.view === 'roulette' ? 'roulette' : 'main')
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
  }, [rouletteCode, syncParticipantsFresh, channelEpoch])

  /**
   * Móvil que se bloquea, cambia de app o pierde cobertura: el websocket se
   * cae en silencio y la pantalla se queda congelada con la lista vieja. Al
   * volver se resincroniza y, si el canal no revivió solo, se recrea.
   */
  const realtimeReadyRef = useRef(realtimeReady)
  useEffect(() => { realtimeReadyRef.current = realtimeReady }, [realtimeReady])

  useEffect(() => {
    const resume = () => {
      if (document.visibilityState !== 'visible') return
      // El canal se revive siempre: sin él un espectador no recibe el giro.
      if (!realtimeReadyRef.current) setChannelEpoch((value) => value + 1)
      // La lista solo donde se usa; en la pantalla de registro se evita a
      // propósito para no gastar datos en 3G.
      if (loadParticipantsRef.current) void syncParticipantsFresh('resume')
    }
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('online', resume)
    window.addEventListener('focus', resume)
    return () => {
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('online', resume)
      window.removeEventListener('focus', resume)
    }
  }, [syncParticipantsFresh])

  /**
   * Respaldo si Realtime no llega a conectar (wifi que bloquea websockets,
   * 3G malo). Solo se activa en modo degradado y con espera irregular para
   * que doscientos móviles no consulten todos en el mismo instante.
   */
  useEffect(() => {
    if (realtimeReady || !loadParticipants) return
    const period = 15000 + Math.floor(Math.random() * 10000)
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void syncParticipantsFresh('poll_fallback')
    }, period)
    return () => window.clearInterval(id)
  }, [realtimeReady, loadParticipants, syncParticipantsFresh])

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

  // Realtime DB: un solo canal por sala.
  const watchParticipants = loadParticipants
  useEffect(() => {
    const dbChannel = supabase.channel(`public:db_changes_${rouletteCode}`)

    // Quien solo viene a registrarse no necesita el flujo de participantes. Con cientos
    // de altas simultáneas eso serían miles de mensajes por teléfono, y es justo lo que
    // hace que la pantalla se sienta trabada. Solo admin y la vista de ruleta lo escuchan.
    if (watchParticipants) {
      dbChannel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'participants' },
          (payload) => {
            const row = payload.new as Participant
            if (belongsToRoomRef.current(row)) {
              upsertParticipant(row)
            }
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'participants' },
          (payload) => {
            const row = payload.new as Participant
            if (belongsToRoomRef.current(row)) {
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
    watchParticipants,
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
      result = (query.single || query.limit === 1
        ? await legacy.maybeSingle()
        : await legacy) as typeof result
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
      if (belongsToRoomRef.current(byToken)) {
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
      roulette_code: rouletteCode,
      registration_token: roomToken,
      username_key: usernameKey,
    }

    // Wi‑Fi de evento con cientos de altas a la vez: un fallo de red puntual no
    // debe costarle el registro a nadie, así que se reintenta con espera creciente.
    let insertedRow: Participant | null = null
    let error: { code?: string; message: string; details?: string } | null = null

    for (let attempt = 0; attempt < REGISTER_MAX_ATTEMPTS; attempt++) {
      const res = await supabase
        .from('participants')
        .insert([payload])
        .select(PARTICIPANT_COLUMNS)
        .maybeSingle()

      insertedRow = (res.data as Participant | null) ?? null
      error = res.error

      if (!error || !isRetryableRegisterError(error)) break

      // Puede que la fila sí entrara y se perdiera la respuesta: comprobar antes de reintentar.
      const mine = await loadParticipantByToken(roomToken)
      if (mine) {
        finishOk(mine, { idempotent: 'recovered-before-retry', attempt })
        return
      }

      eventLog.warn('register', 'insert retry', {
        attempt: attempt + 1,
        message: error.message,
      })
      await delay(REGISTER_RETRY_DELAYS_MS[attempt] ?? 900)
    }

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
      if (!/roulette_code/i.test(error.message)) {
        fallbackPayload.roulette_code = rouletteCode
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

        // Primero: ¿la fila en conflicto es la de ESTE dispositivo? Pasa al reintentar,
        // al recargar o al tocar dos veces. Postgres puede reportar cualquiera de los
        // dos índices únicos, así que preguntar por el token antes de culpar al nombre
        // evita acusar a alguien de usar un nombre que en realidad es suyo.
        const mine = await loadParticipantByToken(roomToken)
        if (mine) {
          telemetry.uniqueConflict(/registration_token/i.test(detail) ? 'token' : 'unknown')
          finishOk(mine, { idempotent: '23505-mine' })
          return
        }

        // Nombre de otra persona → error claro (nunca adjuntar su fila).
        if (/username_key/i.test(detail)) {
          telemetry.uniqueConflict('unknown')
          timer.fail(error, { code: '23505-username' })
          diagnostics.patch({ lastRegisterOk: false, lastError: 'username taken' })
          throw new RegisterError(
            'username-taken',
            'Ese nombre de entrenador ya está registrado. Usa el tuyo.',
          )
        }

        timer.fail(error, { code: '23505' })
        diagnostics.patch({ lastRegisterOk: false, lastError: '23505' })
        throw new RegisterError(
          'generic',
          'No se pudo completar el registro. Intenta de nuevo.',
        )
      }
      // Último recurso: quizá alguna de las tentativas sí escribió la fila.
      const mine = await loadParticipantByToken(roomToken)
      if (mine) {
        finishOk(mine, { idempotent: 'recovered-after-error' })
        return
      }

      timer.fail(error)
      diagnostics.patch({
        lastRegisterOk: false,
        lastError: error.message,
      })
      throw new RegisterError('generic', friendlyRegisterError(error))
    }

    const row: Participant = (insertedRow as Participant | null) ?? {
      id: makeTempId(),
      username,
      team,
      status: 'active',
      ip_address: finalIp,
      roulette_code: rouletteCode,
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
        const winnerPayload: Record<string, string> = {
          username: user.username,
          ip_address: user.ip_address || '',
          roulette_code: extractRoomCode(user),
          won_at: wonAt,
        }
        let insert = await supabase
          .from('recent_winners')
          .insert([winnerPayload])
          .select('*')
          .single()

        if (insert.error && /roulette_code/i.test(insert.error.message)) {
          const { roulette_code: _omit, ...legacyPayload } = winnerPayload
          insert = await supabase
            .from('recent_winners')
            .insert([legacyPayload])
            .select('*')
            .single()
        }

        const winnerRow = insert.data
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
      roulette_code: extractRoomCode(user),
      username: user.username,
      expires_at: expirationDate.toISOString(),
    }
    if (bannedBy?.trim()) payload.banned_by = bannedBy.trim().toLowerCase()

    let { error } = await supabase.from('banned_ips').insert([payload])
    if (error && /roulette_code/i.test(error.message)) {
      // Migración de roulette_code aún sin aplicar: la sala se sigue leyendo de ip_address.
      const { roulette_code: _omit, ...legacyPayload } = payload
      error = (await supabase.from('banned_ips').insert([legacyPayload])).error
    }
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
    discardPendingUpserts()
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

    // Se leen ambas columnas y se decide con extractRoomCode: así el borrado
    // alcanza también las filas anteriores a la migración de roulette_code.
    const idsInRoom = async (table: 'participants' | 'banned_ips' | 'recent_winners') => {
      let res = await supabase.from(table).select('id, ip_address, roulette_code')
      if (res.error && /roulette_code/i.test(res.error.message)) {
        res = (await supabase.from(table).select('id, ip_address')) as typeof res
      }
      return (
        res.data
          ?.filter((row) => extractRoomCode(row) === targetCode)
          .map((row) => row.id) ?? []
      )
    }

    for (const table of ['participants', 'banned_ips', 'recent_winners'] as const) {
      const ids = await idsInRoom(table)
      if (ids.length > 0) {
        await supabase.from(table).delete().in('id', ids)
      }
    }

    writeLocalPrizeCodes(WINNER_PRIZE_CODES_KEY(targetCode), [])
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
