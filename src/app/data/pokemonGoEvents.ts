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
  | 'tour'

export interface PokemonGoEvent {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  /** Hora local de inicio, ej. "14:00" */
  startTime?: string
  /** Hora local de fin, ej. "17:00" */
  endTime?: string
  category: PokemonGoEventCategory
  accent: string
  tint: string
  logo?: string
  selloDex?: boolean
  calendarMarker?: boolean
  weekList?: boolean
}

const CD = {
  accent: '#f59e0b',
  tint: 'rgba(245, 158, 11, 0.18)',
  category: 'community-day' as const,
}

const RAID = {
  accent: '#7c3aed',
  tint: 'rgba(124, 58, 237, 0.16)',
  category: 'raid-day' as const,
}

const MAX = {
  accent: '#06b6d4',
  tint: 'rgba(6, 182, 212, 0.16)',
  category: 'max-battle' as const,
}

const TOUR = {
  accent: '#2563eb',
  tint: 'rgba(37, 99, 235, 0.16)',
  category: 'tour' as const,
}

const AFTERNOON = { startTime: '14:00', endTime: '17:00' } as const

/** Calendario GO vigente (marcadores con icono Campfire). */
export const POKEMON_GO_EVENTS: PokemonGoEvent[] = [
  {
    id: 'cd-eternatus-nov-2026',
    title: 'Día de la Comunidad y El regreso de Eternatus',
    description: 'Día de la Comunidad · Noviembre 2026',
    startDate: '2026-11-21',
    endDate: '2026-11-21',
    ...AFTERNOON,
    ...CD,
    calendarMarker: true,
  },
  {
    id: 'raid-mega-clefable-nov-2026',
    title: 'Día de Incursiones de Mega Clefable',
    description: 'Día de Incursiones Mega',
    startDate: '2026-11-28',
    endDate: '2026-11-28',
    ...AFTERNOON,
    category: 'mega',
    accent: '#db2777',
    tint: 'rgba(219, 39, 119, 0.16)',
    calendarMarker: true,
  },
  {
    id: 'max-battles-dec-2026',
    title: 'Día de Combates Max',
    description: 'Combates Max · 14:00 a 17:00 hora local',
    startDate: '2026-12-05',
    endDate: '2026-12-05',
    ...AFTERNOON,
    ...MAX,
    calendarMarker: true,
  },
  {
    id: 'cd-dec-2026',
    title: 'Día de la Comunidad - Diciembre 2026',
    description: '14:00 a 17:00 hora local',
    startDate: '2026-12-12',
    endDate: '2026-12-13',
    ...AFTERNOON,
    ...CD,
    calendarMarker: true,
  },
  {
    id: 'raid-dec-19-2026',
    title: 'Día de Incursiones',
    description: '14:00 a 17:00 hora local',
    startDate: '2026-12-19',
    endDate: '2026-12-19',
    ...AFTERNOON,
    ...RAID,
    calendarMarker: true,
  },
  {
    id: 'cd-classic-jan-2027',
    title: 'Día de la Comunidad clásico',
    description: '14:00 a 17:00 hora local',
    startDate: '2027-01-02',
    endDate: '2027-01-02',
    ...AFTERNOON,
    ...CD,
    calendarMarker: true,
  },
  {
    id: 'raid-jan-9-2027',
    title: 'Día de Incursiones',
    description: '14:00 a 17:00 hora local',
    startDate: '2027-01-09',
    endDate: '2027-01-09',
    ...AFTERNOON,
    ...RAID,
    calendarMarker: true,
  },
  {
    id: 'cd-jan-2027',
    title: 'Día de la Comunidad - Enero 2027',
    description: '14:00 a 17:00 hora local',
    startDate: '2027-01-16',
    endDate: '2027-01-16',
    ...AFTERNOON,
    ...CD,
    calendarMarker: true,
  },
  {
    id: 'raid-jan-30-2027',
    title: 'Día de Incursiones',
    description: '14:00 a 17:00 hora local',
    startDate: '2027-01-30',
    endDate: '2027-01-30',
    ...AFTERNOON,
    ...RAID,
    calendarMarker: true,
  },
  {
    id: 'cd-feb-2027',
    title: 'Día de la Comunidad - Febrero 2027',
    description: '14:00 a 17:00 hora local',
    startDate: '2027-02-06',
    endDate: '2027-02-06',
    ...AFTERNOON,
    ...CD,
    calendarMarker: true,
  },
  {
    id: 'raid-feb-13-2027',
    title: 'Día de Incursiones',
    description: '14:00 a 17:00 hora local',
    startDate: '2027-02-13',
    endDate: '2027-02-13',
    ...AFTERNOON,
    ...RAID,
    calendarMarker: true,
  },
  {
    id: 'tour-alola-feb-2027',
    title: 'Tour de Pokémon GO: Alola (Global)',
    description: '10:00 a 18:00 hora local',
    startDate: '2027-02-27',
    endDate: '2027-02-28',
    startTime: '10:00',
    endTime: '18:00',
    ...TOUR,
    calendarMarker: true,
  },
]

export const ACTIVE_GO_EVENT_IDS = new Set(POKEMON_GO_EVENTS.map((e) => e.id))

export function isEventArchived(event: PokemonGoEvent): boolean {
  return event.endDate < EVENT_ARCHIVE_CUTOFF
}

export function isActiveGoEvent(event: PokemonGoEvent): boolean {
  if (isEventArchived(event)) return false
  return event.calendarMarker === true || ACTIVE_GO_EVENT_IDS.has(event.id)
}

export const ACTIVE_POKEMON_GO_EVENTS = POKEMON_GO_EVENTS.filter(isActiveGoEvent)
