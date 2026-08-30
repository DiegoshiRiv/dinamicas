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

/**
 * Sala a la que pertenece una fila. Prefiere la columna roulette_code; si la
 * fila es anterior a esa migración, cae al marcador dentro de ip_address.
 */
export function extractRoomCode(row: {
  roulette_code?: string | null
  ip_address?: string | null
}): string {
  const explicit = row.roulette_code?.trim()
  if (explicit) return sanitizeRouletteCode(explicit)
  return extractRouletteCodeFromIp(row.ip_address ?? undefined)
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