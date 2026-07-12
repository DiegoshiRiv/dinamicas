/** Hora en formato fijo: "10:00 p.m." */
export function formatClockLabel(hour24: number, minute = 0): string {
  const period = hour24 >= 12 ? 'p.m.' : 'a.m.'
  const hour12 = hour24 % 12 || 12
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`
}

export function formatTimeRangeLabel(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
): string {
  return `${formatClockLabel(startHour, startMinute)} a ${formatClockLabel(endHour, endMinute)}`
}

/** Día de la Comunidad Frigibax — horarios locales. */
export const CD_FRIGIBAX_HOURS = {
  event: formatTimeRangeLabel(14, 0, 17, 0),
  lure: formatTimeRangeLabel(14, 0, 21, 0),
  reunion: formatTimeRangeLabel(14, 0, 17, 0),
} as const

/** Día de la Comunidad Sobble — julio 2026. */
export const CD_SOBBLE_HOURS = {
  event: formatTimeRangeLabel(14, 0, 17, 0),
  lure: formatTimeRangeLabel(14, 0, 21, 0),
  reunion: formatTimeRangeLabel(14, 0, 17, 0),
} as const
