import {
  CAMPFIRE_MEMBER_COUNT,
  PREVIOUS_MEETUP_TRAINERS,
  WHATSAPP_FOLLOWER_COUNT,
} from '@/app/data/communityLinks'

export const COMMUNITY_STATS_KEY = 'community_stats'
const LOCAL_CACHE_KEY = 'dinamicas-community-stats-v1'

export type CommunityStats = {
  campfireMembers: number
  previousMeetupTrainers: number
  whatsappFollowers: number
}

export const DEFAULT_COMMUNITY_STATS: CommunityStats = {
  campfireMembers: CAMPFIRE_MEMBER_COUNT,
  previousMeetupTrainers: PREVIOUS_MEETUP_TRAINERS,
  whatsappFollowers: WHATSAPP_FOLLOWER_COUNT,
}

export const COMMUNITY_STAT_FIELDS: {
  id: keyof CommunityStats
  label: string
  hint: string
  min: number
  max: number
  step: number
}[] = [
  {
    id: 'campfireMembers',
    label: 'Miembros en Campfire',
    hint: 'Número que aparece bajo “Únete a Campfire”',
    min: 0,
    max: 9_999_999,
    step: 1,
  },
  {
    id: 'previousMeetupTrainers',
    label: 'Entrenadores reunidos',
    hint: 'Quedada anterior en la pantalla de registro',
    min: 0,
    max: 999_999,
    step: 1,
  },
  {
    id: 'whatsappFollowers',
    label: 'Seguidores de WhatsApp',
    hint: 'Piso del contador (no bajará de este número)',
    min: 0,
    max: 9_999_999,
    step: 1,
  },
]

function clampCount(value: unknown, fallback: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(0, Math.round(value)))
}

export function parseCommunityStats(raw: unknown): CommunityStats {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_COMMUNITY_STATS }
  const row = raw as Record<string, unknown>
  return {
    campfireMembers: clampCount(row.campfireMembers, DEFAULT_COMMUNITY_STATS.campfireMembers, 9_999_999),
    previousMeetupTrainers: clampCount(
      row.previousMeetupTrainers,
      DEFAULT_COMMUNITY_STATS.previousMeetupTrainers,
      999_999,
    ),
    whatsappFollowers: clampCount(
      row.whatsappFollowers,
      DEFAULT_COMMUNITY_STATS.whatsappFollowers,
      9_999_999,
    ),
  }
}

export function loadCommunityStatsFromStorage(): CommunityStats {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY)
    if (!raw) return { ...DEFAULT_COMMUNITY_STATS }
    return parseCommunityStats(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_COMMUNITY_STATS }
  }
}

export function saveCommunityStatsToStorage(stats: CommunityStats) {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(stats))
  } catch {
    /* cuota / modo privado */
  }
}

type Listener = () => void
let liveStats = loadCommunityStatsFromStorage()
const listeners = new Set<Listener>()

export function getLiveCommunityStats(): CommunityStats {
  return liveStats
}

export function setLiveCommunityStats(next: CommunityStats) {
  liveStats = next
  saveCommunityStatsToStorage(next)
  listeners.forEach((fn) => {
    try {
      fn()
    } catch {
      /* ignore */
    }
  })
}

export function subscribeCommunityStats(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
