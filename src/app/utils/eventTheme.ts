import fondoDefault from '@/assets/fondos/predeterminado.jpg'
import fondoComunidad from '@/assets/fondos/dia-comunidad.png'
import fondoIncursiones from '@/assets/fondos/dia-incursiones.jpg'
import fondoMega from '@/assets/fondos/mega-incursiones.webp'
import fondoMax from '@/assets/fondos/combates-max.png'

export const EVENT_THEME_KEY = 'event_theme'
const LOCAL_CACHE_KEY = 'dinamicas-event-theme-v1'

export type EventThemeId =
  | 'default'
  | 'community_day'
  | 'raid_day'
  | 'mega_raids'
  | 'max_battles'

export type EventThemeOption = {
  id: EventThemeId
  label: string
  hint: string
  image: string
}

export const EVENT_THEMES: EventThemeOption[] = [
  {
    id: 'default',
    label: 'Predeterminado',
    hint: 'Fondo general de la comunidad',
    image: fondoDefault,
  },
  {
    id: 'community_day',
    label: 'Día de la Comunidad',
    hint: 'Community Day y eventos de comunidad',
    image: fondoComunidad,
  },
  {
    id: 'raid_day',
    label: 'Día de Incursiones',
    hint: 'Raid Day',
    image: fondoIncursiones,
  },
  {
    id: 'mega_raids',
    label: 'Día de Incursiones Mega',
    hint: 'Mega Evolution / Mega Clefable',
    image: fondoMega,
  },
  {
    id: 'max_battles',
    label: 'Día de Combates Max',
    hint: 'Dynamax / Gigantamax',
    image: fondoMax,
  },
]

export const DEFAULT_EVENT_THEME: EventThemeId = 'default'

const THEME_IDS = new Set<EventThemeId>(EVENT_THEMES.map((t) => t.id))

export function parseEventThemeId(raw: unknown): EventThemeId {
  if (typeof raw === 'string' && THEME_IDS.has(raw as EventThemeId)) {
    return raw as EventThemeId
  }
  if (raw && typeof raw === 'object') {
    const id = (raw as { id?: unknown }).id
    if (typeof id === 'string' && THEME_IDS.has(id as EventThemeId)) {
      return id as EventThemeId
    }
  }
  return DEFAULT_EVENT_THEME
}

export function getEventThemeOption(id: EventThemeId): EventThemeOption {
  return EVENT_THEMES.find((t) => t.id === id) ?? EVENT_THEMES[0]
}

export function getEventThemeImage(id: EventThemeId): string {
  return getEventThemeOption(id).image
}

/** Fondo asociado a la categoría del calendario GO. */
export function themeIdForGoCategory(
  category: string,
): EventThemeId {
  switch (category) {
    case 'community-day':
      return 'community_day'
    case 'raid-day':
    case 'raid':
      return 'raid_day'
    case 'mega':
      return 'mega_raids'
    case 'max-battle':
      return 'max_battles'
    case 'tour':
    case 'special':
      return 'default'
    default:
      return 'default'
  }
}

export function loadEventThemeFromStorage(): EventThemeId {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY)
    if (!raw) return DEFAULT_EVENT_THEME
    return parseEventThemeId(JSON.parse(raw))
  } catch {
    return DEFAULT_EVENT_THEME
  }
}

export function saveEventThemeToStorage(id: EventThemeId) {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({ id }))
  } catch {
    /* cuota / modo privado */
  }
}

type Listener = () => void
let liveTheme = loadEventThemeFromStorage()
const listeners = new Set<Listener>()

export function getLiveEventTheme(): EventThemeId {
  return liveTheme
}

export function setLiveEventTheme(id: EventThemeId) {
  liveTheme = id
  saveEventThemeToStorage(id)
  listeners.forEach((fn) => {
    try {
      fn()
    } catch {
      /* ignore */
    }
  })
}

export function subscribeEventTheme(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
