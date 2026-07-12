import { CD_FRIGIBAX_HOURS, CD_SOBBLE_HOURS, formatTimeRangeLabel } from '@/app/utils/formatTime'
import { CALENDAR_GIFS } from '@/app/utils/driveGifs'
import logoFest from '@/assets/logos/logofest.png'
import frigibaxLogo from '@/assets/pokemon gif/Frigibax.gif'
import communityDayGenericLogo from '@/assets/logos/diadelacomunidad.png'
import megaEvIcon from '@/assets/iconos/megaev.png'

/** Eventos oficiales de Pokémon GO (fechas locales, día inclusive). */
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
  /** Logo en calendario y listas. */
  logo?: string
  /** Día de la Comunidad oficial → SelloDex en comunidad. */
  selloDex?: boolean
  /** Mostrar marcador en el calendario (no fondo de temporada/rotaciones). */
  calendarMarker?: boolean
  /** Incluir en la lista semanal (prioridad baja si false). */
  weekList?: boolean
}

const CD_LOGO = communityDayGenericLogo

export const POKEMON_GO_EVENTS: PokemonGoEvent[] = [
  {
    id: 'pase-mayo',
    title: 'Pase de GO: mayo',
    startDate: '2026-05-05',
    endDate: '2026-06-02',
    category: 'go-pass',
    accent: '#7c3aed',
    tint: 'rgba(124, 58, 237, 0.14)',
    weekList: false,
  },
  {
    id: 'blanche',
    title: 'Blanche y la búsqueda del conocimiento',
    startDate: '2026-05-26',
    endDate: '2026-06-01',
    category: 'team',
    accent: '#0ea5e9',
    tint: 'rgba(14, 165, 233, 0.14)',
    calendarMarker: true,
    weekList: true,
  },
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
  {
    id: 'pase-junio',
    title: 'Pase de GO: junio',
    startDate: '2026-06-02',
    endDate: '2026-07-07',
    category: 'go-pass',
    accent: '#8b5cf6',
    tint: 'rgba(139, 92, 246, 0.14)',
    weekList: false,
  },
  {
    id: 'spark',
    title: 'Spark y la búsqueda de los cuidados',
    startDate: '2026-06-02',
    endDate: '2026-06-08',
    category: 'team',
    accent: '#eab308',
    tint: 'rgba(234, 179, 8, 0.14)',
    calendarMarker: true,
    weekList: true,
  },
  {
    id: 'dialga-oscuro',
    title: 'Dialga Oscuro en incursiones',
    startDate: '2026-06-02',
    endDate: '2026-06-30',
    category: 'raid',
    accent: '#475569',
    tint: 'rgba(71, 85, 105, 0.12)',
    weekList: false,
  },
  {
    id: 'max-inkay',
    title: 'Combates Max: Inkay',
    startDate: '2026-06-01',
    endDate: '2026-06-07',
    category: 'max-battle',
    accent: '#6366f1',
    tint: 'rgba(99, 102, 241, 0.12)',
    weekList: false,
  },
  {
    id: 'raid-reshiram',
    title: 'Incursiones 5★: Reshiram',
    startDate: '2026-06-03',
    endDate: '2026-06-09',
    category: 'raid',
    accent: '#ef4444',
    tint: 'rgba(239, 68, 68, 0.12)',
    weekList: false,
  },
  {
    id: 'mega-audino',
    title: 'Megaincursiones: Mega-Audino',
    startDate: '2026-06-03',
    endDate: '2026-06-09',
    category: 'mega',
    accent: '#ec4899',
    tint: 'rgba(236, 72, 153, 0.12)',
    weekList: false,
  },
  {
    id: 'max-electabuzz',
    title: 'Combates Max: Electabuzz',
    startDate: '2026-06-08',
    endDate: '2026-06-14',
    category: 'max-battle',
    accent: '#f59e0b',
    tint: 'rgba(245, 158, 11, 0.12)',
    weekList: false,
  },
  {
    id: 'candela',
    title: 'Candela y la búsqueda de la victoria',
    startDate: '2026-06-09',
    endDate: '2026-06-15',
    category: 'team',
    accent: '#f97316',
    tint: 'rgba(249, 115, 22, 0.14)',
    calendarMarker: true,
    weekList: true,
  },
  {
    id: 'raid-zekrom',
    title: 'Incursiones 5★: Zekrom',
    startDate: '2026-06-10',
    endDate: '2026-06-16',
    category: 'raid',
    accent: '#1e293b',
    tint: 'rgba(30, 41, 59, 0.12)',
    weekList: false,
  },
  {
    id: 'mega-lopunny',
    title: 'Megaincursiones: Mega-Lopunny',
    startDate: '2026-06-10',
    endDate: '2026-06-16',
    category: 'mega',
    accent: '#f472b6',
    tint: 'rgba(244, 114, 182, 0.12)',
    weekList: false,
  },
  {
    id: 'max-roggenrola',
    title: 'Combates Max: Roggenrola',
    startDate: '2026-06-15',
    endDate: '2026-06-21',
    category: 'max-battle',
    accent: '#78716c',
    tint: 'rgba(120, 113, 108, 0.12)',
    weekList: false,
  },
  {
    id: 'raid-necrozma',
    title: 'Incursiones 5★: Necrozma',
    startDate: '2026-06-17',
    endDate: '2026-06-23',
    category: 'raid',
    accent: '#a855f7',
    tint: 'rgba(168, 85, 247, 0.12)',
    weekList: false,
  },
  {
    id: 'mega-scizor',
    title: 'Megaincursiones: Mega-Scizor',
    startDate: '2026-06-17',
    endDate: '2026-06-23',
    category: 'mega',
    accent: '#dc2626',
    tint: 'rgba(220, 38, 38, 0.12)',
    weekList: false,
  },
  {
    id: 'cd-frigibax',
    title: 'Día de la Comunidad: Frigibax',
    description: `${CD_FRIGIBAX_HOURS.event} · SelloDex en reuniones de comunidad`,
    startDate: '2026-06-20',
    endDate: '2026-06-20',
    category: 'community-day',
    accent: '#06b6d4',
    tint: 'rgba(6, 182, 212, 0.35)',
    logo: frigibaxLogo,
    selloDex: true,
    calendarMarker: true,
    weekList: true,
  },
  {
    id: 'max-hoothoot',
    title: 'Combates Max: Hoothoot',
    startDate: '2026-06-22',
    endDate: '2026-06-28',
    category: 'max-battle',
    accent: '#854d0e',
    tint: 'rgba(133, 77, 14, 0.12)',
    weekList: false,
  },
  {
    id: 'taxi-volador',
    title: 'Taxi Volador',
    startDate: '2026-06-23',
    endDate: '2026-06-29',
    category: 'special',
    accent: '#38bdf8',
    tint: 'rgba(56, 189, 248, 0.14)',
    weekList: true,
  },
  {
    id: 'raid-ultra',
    title: 'Incursiones 5★: Celesteela / Kartana',
    startDate: '2026-06-24',
    endDate: '2026-06-30',
    category: 'raid',
    accent: '#1fb988',
    tint: 'rgba(20, 184, 166, 0.12)',
    weekList: false,
  },
  {
    id: 'mega-pidgeot',
    title: 'Megaincursiones: Mega-Pidgeot',
    startDate: '2026-06-24',
    endDate: '2026-06-30',
    category: 'mega',
    accent: '#1fb988',
    tint: 'rgba(217, 119, 6, 0.12)',
    weekList: false,
  },
  {
    id: 'taxi-invasion',
    title: 'Taxi Volador: Invasión',
    startDate: '2026-06-25',
    endDate: '2026-06-29',
    category: 'special',
    accent: '#0284c7',
    tint: 'rgba(2, 132, 199, 0.14)',
    weekList: true,
  },
  {
    id: 'supermega-skarmory',
    title: 'Día de Super Mega Incursiones de Skarmory',
    description: `${formatTimeRangeLabel(14, 0, 17, 0)} · SelloDex en reunión de comunidad`,
    startDate: '2026-06-27',
    endDate: '2026-06-27',
    category: 'raid-day',
    accent: '#64748b',
    tint: 'rgba(100, 116, 139, 0.35)',
    calendarMarker: true,
    weekList: true,
    selloDex: true,
    logo: megaEvIcon,
  },
  {
    id: 'max-pidove',
    title: 'Combates Max: Pidove',
    startDate: '2026-06-29',
    endDate: '2026-07-05',
    category: 'max-battle',
    accent: '#65a30d',
    tint: 'rgba(101, 163, 13, 0.12)',
    weekList: false,
  },
  {
    id: 'cd-julio',
    title: 'Día de la Comunidad: Sobble',
    description: `${CD_SOBBLE_HOURS.event} · SelloDex en reuniones de comunidad`,
    startDate: '2026-07-04',
    endDate: '2026-07-04',
    category: 'community-day',
    accent: '#0891b2',
    tint: 'rgba(8, 145, 178, 0.35)',
    logo: CALENDAR_GIFS.sobble,
    selloDex: true,
    calendarMarker: true,
    weekList: true,
  },
  {
    id: 'fest-chicago',
    title: 'Festival Pokémon GO: Chicago',
    startDate: '2026-06-04',
    endDate: '2026-06-07',
    category: 'special',
    accent: '#c026d3',
    tint: 'rgba(192, 38, 211, 0.18)',
    weekList: false,
  },
  {
    id: 'fest-copenhagen',
    title: 'Festival Pokémon GO: Copenhague',
    startDate: '2026-06-11',
    endDate: '2026-06-14',
    category: 'special',
    accent: '#c026d3',
    tint: 'rgba(192, 38, 211, 0.18)',
    weekList: false,
  },
  {
    id: 'fest-global',
    title: 'Pokémon GO Fest 2026: Global',
    description: '10:00 – 19:00 · Mewtwo y Zeraora',
    startDate: '2026-07-11',
    endDate: '2026-07-12',
    category: 'special',
    accent: '#d946ef',
    tint: 'rgba(217, 70, 239, 0.3)',
    logo: logoFest,
    selloDex: true,
    calendarMarker: true,
    weekList: true,
  },
  {
    id: 'supermega-raichu',
    title: 'Día de Supermegaincursiones de Raichu',
    description: `${formatTimeRangeLabel(14, 0, 17, 0)} · SelloDex en reunión de comunidad`,
    startDate: '2026-07-18',
    endDate: '2026-07-18',
    category: 'raid-day',
    accent: '#f59e0b',
    tint: 'rgba(245, 158, 11, 0.35)',
    calendarMarker: true,
    weekList: true,
    selloDex: true,
    logo: megaEvIcon,
  },
  {
    id: 'eclosiones-agosto',
    title: 'Día de Eclosiones',
    startDate: '2026-08-08',
    endDate: '2026-08-08',
    category: 'special',
    accent: '#84cc16',
    tint: 'rgba(132, 204, 22, 0.35)',
    calendarMarker: true,
    weekList: true,
  },
  {
    id: 'cd-agosto',
    title: 'Día de la Comunidad (agosto)',
    description: 'SelloDex en reuniones de comunidad',
    startDate: '2026-08-15',
    endDate: '2026-08-15',
    category: 'community-day',
    accent: '#06b6d4',
    tint: 'rgba(6, 182, 212, 0.35)',
    logo: CD_LOGO,
    selloDex: true,
    calendarMarker: true,
    weekList: true,
  },
  {
    id: 'raid-day-ago',
    title: 'Día de incursiones (agosto)',
    startDate: '2026-08-22',
    endDate: '2026-08-22',
    category: 'raid-day',
    accent: '#e11d48',
    tint: 'rgba(225, 29, 72, 0.35)',
    calendarMarker: true,
    weekList: true,
  },
]

/** Eventos GO visibles en calendario e infografías. */
export const ACTIVE_GO_EVENT_IDS = new Set(['cd-frigibax', 'cd-julio', 'supermega-skarmory', 'supermega-raichu'])

export function isActiveGoEvent(event: PokemonGoEvent): boolean {
  return ACTIVE_GO_EVENT_IDS.has(event.id)
}

export const ACTIVE_POKEMON_GO_EVENTS = POKEMON_GO_EVENTS.filter(isActiveGoEvent)
