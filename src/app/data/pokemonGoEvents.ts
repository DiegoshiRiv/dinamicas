/** Eventos con fecha de fin anterior a esta clave ya no se muestran. */
export const EVENT_ARCHIVE_CUTOFF = '2026-08-30'

export type PokemonGoEventCategory =
  | 'season'
  | 'go-pass'
  | 'team'
  | 'community-day'
  | 'raid-day'
  | 'special'
  | 'raid'
  | 'mega'
  | 'max-battle'

export interface PokemonGoEvent {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  category: PokemonGoEventCategory
  accent: string
  tint: string
  logo?: string
  selloDex?: boolean
  calendarMarker?: boolean
  weekList?: boolean
}

/** Solo temporada vigente a partir del corte (sin eventos pasados en calendario). */
export const POKEMON_GO_EVENTS: PokemonGoEvent[] = [
  {
    id: 'siempre-adelante',
    title: 'Siempre Adelante',
    startDate: '2026-06-02',
    endDate: '2026-09-08',
    category: 'season',
    accent: '#0d3b66',
    tint: 'rgba(13, 59, 102, 0.12)',
    weekList: false,
  },
]

export const ACTIVE_GO_EVENT_IDS = new Set<string>()

export function isEventArchived(event: PokemonGoEvent): boolean {
  return event.endDate < EVENT_ARCHIVE_CUTOFF
}

export function isActiveGoEvent(event: PokemonGoEvent): boolean {
  if (isEventArchived(event)) return false
  if (event.category === 'community-day') return false
  return ACTIVE_GO_EVENT_IDS.has(event.id)
}

export const ACTIVE_POKEMON_GO_EVENTS = POKEMON_GO_EVENTS.filter(isActiveGoEvent)
