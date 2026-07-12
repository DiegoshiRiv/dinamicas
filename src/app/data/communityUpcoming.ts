import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { POKEMON_GO_EVENTS, type PokemonGoEvent } from '@/app/data/pokemonGoEvents'
import { dateToDayKey } from '@/app/utils/eventDates'
import megaRaichuBanner from '@/assets/wallpaper/MegaRaichu.png'
import festBanner from '@/assets/wallpaper/bannnerFest.png'

/** Reuniones presenciales vigentes en el carrusel (sin CD ni eventos pasados). */
export const PRESENTIAL_CAROUSEL_GO_IDS = ['supermega-raichu'] as const

export type PresencialCarouselSlide = {
  id: string
  title: string
  dateLabel: string
  startDate: string
  endDate: string
  banner: string
  badge?: string
  accent: string
  selloDex?: boolean
  dayKey: string
}

const BANNER_BY_ID: Record<string, string> = {
  'supermega-raichu': megaRaichuBanner,
  'fest-global': festBanner,
}

const BADGE_BY_ID: Record<string, string> = {
  'supermega-raichu': 'Supermegaincursiones',
  'fest-global': 'GO Fest',
}

function formatRangeLabel(startDate: string, endDate: string): string {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  if (startDate === endDate) {
    return format(start, "EEEE d 'de' MMMM yyyy", { locale: es })
  }
  return `${format(start, "d 'de' MMMM", { locale: es })} – ${format(end, "d 'de' MMMM yyyy", { locale: es })}`
}

function slideFromGoEvent(ev: PokemonGoEvent): PresencialCarouselSlide {
  return {
    id: ev.id,
    title: ev.title,
    dateLabel: formatRangeLabel(ev.startDate, ev.endDate),
    startDate: ev.startDate,
    endDate: ev.endDate,
    banner: BANNER_BY_ID[ev.id] ?? megaRaichuBanner,
    badge: BADGE_BY_ID[ev.id],
    accent: ev.accent,
    selloDex: ev.selloDex,
    dayKey: ev.startDate,
  }
}

/** Slides del carrusel: reuniones presenciales con SelloDex. */
export function getPresencialCarouselSlides(now = new Date()): PresencialCarouselSlide[] {
  const todayKey = dateToDayKey(now)
  const ids = new Set<string>(PRESENTIAL_CAROUSEL_GO_IDS)

  return POKEMON_GO_EVENTS.filter((ev) => ids.has(ev.id))
    .map(slideFromGoEvent)
    .filter((s) => s.endDate >= todayKey)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
}
