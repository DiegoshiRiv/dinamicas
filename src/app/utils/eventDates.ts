import {
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isWithinInterval,
  parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { PokemonGoEvent } from '@/app/data/pokemonGoEvents'
import { formatClockLabel } from '@/app/utils/formatTime'

const TZ = 'America/Mexico_City'

function formatPart(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('es-MX', { ...options, timeZone: TZ }).format(date)
}

/** parseISO / format lanzan o producen Invalid Date con null/basura de la DB. */
function safeParseIso(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const date = parseISO(value)
    if (Number.isNaN(date.getTime())) return null
    return date
  } catch {
    return null
  }
}

export function formatEventDateLine(startsAt: string, endsAt: string): string {
  const start = safeParseIso(startsAt)
  const end = safeParseIso(endsAt)
  if (!start || !end) return 'Fecha no disponible'
  try {
    const weekday = formatPart(start, { weekday: 'long' })
    const day = formatPart(start, { day: 'numeric' })
    const month = formatPart(start, { month: 'long' })
    const year = formatPart(start, { year: 'numeric' })
    const startHour = Number(formatPart(start, { hour: 'numeric', hour12: false }))
    const startMinute = Number(formatPart(start, { minute: '2-digit' }))
    const endHour = Number(formatPart(end, { hour: 'numeric', hour12: false }))
    const endMinute = Number(formatPart(end, { minute: '2-digit' }))

    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
    return `${capitalizedWeekday}, ${day} de ${month} de ${year}, de ${formatClockLabel(startHour, startMinute)} a ${formatClockLabel(endHour, endMinute)} (hora local)`
  } catch {
    return 'Fecha no disponible'
  }
}

export function isEventLive(startsAt: string, endsAt: string, now = new Date()): boolean {
  const start = safeParseIso(startsAt)
  const end = safeParseIso(endsAt)
  if (!start || !end || start > end) return false
  try {
    return isWithinInterval(now, { start, end })
  } catch {
    return false
  }
}

export function isEventUpcoming(startsAt: string, now = new Date()): boolean {
  const start = safeParseIso(startsAt)
  if (!start) return false
  return start > now
}

export function eventDayKey(iso: string): string {
  const date = safeParseIso(iso)
  if (!date) return ''
  try {
    return format(date, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

export function dateToDayKey(date: Date): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  try {
    return format(date, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

export function pokemonGoEventDurationDays(event: PokemonGoEvent): number {
  const start = safeParseIso(event.startDate)
  const end = safeParseIso(event.endDate)
  if (!start || !end) return 1
  return Math.max(1, differenceInCalendarDays(end, start) + 1)
}

export function isShortPokemonGoEvent(event: PokemonGoEvent): boolean {
  return pokemonGoEventDurationDays(event) <= 2
}

export function isLongPokemonGoEvent(event: PokemonGoEvent): boolean {
  return pokemonGoEventDurationDays(event) >= 5
}

export function eventOverlapsDayKey(
  event: { startDate: string; endDate: string },
  dayKey: string,
): boolean {
  return event.startDate <= dayKey && event.endDate >= dayKey
}

export function eventOverlapsWeek(
  event: { startDate: string; endDate: string },
  weekStartKey: string,
  weekEndKey: string,
): boolean {
  return event.startDate <= weekEndKey && event.endDate >= weekStartKey
}

export function filterGoEventsForDay(events: PokemonGoEvent[], dayKey: string): PokemonGoEvent[] {
  return events
    .filter((ev) => ev.weekList !== false && eventOverlapsDayKey(ev, dayKey))
    .sort((a, b) => {
      const aShort = pokemonGoEventDurationDays(a) <= 2 ? 0 : 1
      const bShort = pokemonGoEventDurationDays(b) <= 2 ? 0 : 1
      if (aShort !== bShort) return aShort - bShort
      return a.startDate.localeCompare(b.startDate)
    })
}

export function filterGoEventsForWeek(
  events: PokemonGoEvent[],
  weekStartKey: string,
  weekEndKey: string,
): PokemonGoEvent[] {
  return events
    .filter((ev) => ev.weekList !== false && eventOverlapsWeek(ev, weekStartKey, weekEndKey))
    .sort((a, b) => {
      const aShort = pokemonGoEventDurationDays(a) <= 2 ? 0 : 1
      const bShort = pokemonGoEventDurationDays(b) <= 2 ? 0 : 1
      if (aShort !== bShort) return aShort - bShort
      return a.startDate.localeCompare(b.startDate)
    })
}

export function getCalendarMarkerGoEvents(dayEvents: PokemonGoEvent[]): PokemonGoEvent[] {
  return dayEvents.filter((ev) => ev.calendarMarker)
}

export function buildPokemonGoEventsByDay(events: PokemonGoEvent[]): Map<string, PokemonGoEvent[]> {
  const map = new Map<string, PokemonGoEvent[]>()
  for (const ev of events) {
    const start = safeParseIso(ev.startDate)
    const end = safeParseIso(ev.endDate)
    if (!start || !end || start > end) continue
    let days: Date[]
    try {
      days = eachDayOfInterval({ start, end })
    } catch {
      continue
    }
    for (const day of days) {
      const key = dateToDayKey(day)
      if (!key) continue
      const list = map.get(key) ?? []
      list.push(ev)
      map.set(key, list)
    }
  }
  return map
}

export type PokemonGoDayStyle = {
  background?: string
  boxShadow?: string
  accentColor?: string
}

/** Solo marcadores destacados (Fest, CD, etc.), sin saturar con temporadas/rotaciones. */
export function getPokemonGoDayStyle(dayEvents: PokemonGoEvent[]): PokemonGoDayStyle | null {
  const markers = getCalendarMarkerGoEvents(dayEvents)
  if (markers.length === 0) return null

  const fest = markers.find((e) => e.id === 'fest-global')
  if (fest) {
    return {
      background: fest.tint,
      boxShadow: `inset 0 0 0 2px ${fest.accent}`,
      accentColor: fest.accent,
    }
  }

  const withDuration = markers.map((ev) => ({
    ev,
    days: pokemonGoEventDurationDays(ev),
  }))
  const short = withDuration.filter(({ days }) => days <= 2).sort((a, b) => a.days - b.days)
  const primary = short[0]?.ev ?? withDuration.sort((a, b) => a.days - b.days)[0]?.ev
  if (!primary) return null

  return {
    background: primary.tint,
    boxShadow: `inset 0 0 0 2px ${primary.accent}`,
    accentColor: primary.accent,
  }
}

export function formatPokemonGoEventRange(event: PokemonGoEvent): string {
  const start = safeParseIso(event.startDate)
  const end = safeParseIso(event.endDate)
  if (!start || !end) return 'Fecha no disponible'
  try {
    const sameDay = event.startDate === event.endDate
    if (sameDay) return format(start, "d 'de' MMMM yyyy", { locale: es })
    return `${format(start, 'd MMM', { locale: es })} – ${format(end, 'd MMM yyyy', { locale: es })}`
  } catch {
    return 'Fecha no disponible'
  }
}
