/** Hora en formato fijo: "10:00 p.m." */
export function formatClockLabel(hour24: number, minute = 0): string {
  const h = Number.isFinite(hour24) ? Math.trunc(hour24) : 0
  const m = Number.isFinite(minute) ? Math.trunc(minute) : 0
  const safeHour = ((h % 24) + 24) % 24
  const safeMinute = Math.min(59, Math.max(0, m))
  const period = safeHour >= 12 ? 'p.m.' : 'a.m.'
  const hour12 = safeHour % 12 || 12
  return `${hour12}:${String(safeMinute).padStart(2, '0')} ${period}`
}

export function formatTimeRangeLabel(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
): string {
  return `${formatClockLabel(startHour, startMinute)} a ${formatClockLabel(endHour, endMinute)}`
}
