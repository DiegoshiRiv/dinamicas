export const DEFAULT_ROULETTE_CODE = 'general'
const ROOM_MARKER = '::r:'

export function sanitizeRouletteCode(value: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return cleaned || DEFAULT_ROULETTE_CODE
}

export function encodeIpForRoulette(rawIp: string, rouletteCode: string): string {
  return `${rawIp}${ROOM_MARKER}${sanitizeRouletteCode(rouletteCode)}`
}

export function extractRouletteCodeFromIp(rawIp?: string): string {
  if (!rawIp) return DEFAULT_ROULETTE_CODE
  const markerIndex = rawIp.lastIndexOf(ROOM_MARKER)
  if (markerIndex < 0) return DEFAULT_ROULETTE_CODE
  return sanitizeRouletteCode(rawIp.slice(markerIndex + ROOM_MARKER.length))
}

export function hasRouletteCodeMarker(rawIp?: string): boolean {
  return Boolean(rawIp && rawIp.includes(ROOM_MARKER))
}

export function ipBelongsToRoulette(rawIp: string | undefined, rouletteCode: string): boolean {
  // Legacy/manual rows do not have a marker, so keep them visible in the active roulette.
  if (!hasRouletteCodeMarker(rawIp)) return true
  return extractRouletteCodeFromIp(rawIp) === sanitizeRouletteCode(rouletteCode)
}

export function extractBaseIp(rawIp?: string): string {
  if (!rawIp) return ''
  const markerIndex = rawIp.lastIndexOf(ROOM_MARKER)
  if (markerIndex < 0) return rawIp
  return rawIp.slice(0, markerIndex)
}

export function buildRouletteRegistrationUrl(origin: string, rouletteCode: string): string {
  const code = sanitizeRouletteCode(rouletteCode)
  if (code === DEFAULT_ROULETTE_CODE) return origin
  const url = new URL(origin)
  url.searchParams.set('r', code)
  return url.toString()
}