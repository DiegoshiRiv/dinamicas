/** Colores de la bandera, tomados tal cual con cuentagotas. */
export const PARTICIPANT_PALETTE = [
  '#F00001',
  '#FF7F00',
  '#FFFF00',
  '#007940',
  '#4041FE',
  '#A001C0',
] as const

function hashSeed(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/** Color estable por participante (mismo en todos los clientes). */
export function colorForParticipant(seed: string): string {
  const idx = hashSeed(seed) % PARTICIPANT_PALETTE.length
  return PARTICIPANT_PALETTE[idx]!
}

export function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

/** Participantes de eventos con equipos: se llevan al tono equivalente. */
const LEGACY_TEAM_COLORS: Record<string, string> = {
  blue: '#4041FE',
  yellow: '#FFFF00',
  red: '#F00001',
}

export function participantSliceColor(participant: { id: string; team?: string }): string {
  if (participant.team) {
    if (isHexColor(participant.team)) return participant.team
    if (LEGACY_TEAM_COLORS[participant.team]) return LEGACY_TEAM_COLORS[participant.team]
  }
  return colorForParticipant(participant.id)
}

export function textColorOnSlice(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#1f2937' : '#ffffff'
}

export function winnerAccentColors(color: string) {
  return {
    bg: `${color}18`,
    border: color,
    text: color,
  }
}

const LAST_COLOR_KEY = 'dinamicas-last-registration-color-v1'

function lastColorKey(rouletteCode: string): string {
  return `${LAST_COLOR_KEY}:${rouletteCode}`
}

export function readLastRegistrationColor(rouletteCode: string): string | null {
  try {
    return localStorage.getItem(lastColorKey(rouletteCode))?.trim() || null
  } catch {
    return null
  }
}

export function saveLastRegistrationColor(rouletteCode: string, color: string) {
  try {
    localStorage.setItem(lastColorKey(rouletteCode), color)
  } catch {
    /* modo privado: solo se pierde la variedad, no el registro */
  }
}

function randomIndex(limit: number): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint32Array(1)
    crypto.getRandomValues(buffer)
    // Se descarta el resto sesgado para que los seis colores sean equiprobables.
    const ceiling = Math.floor(0xffffffff / limit) * limit
    if (buffer[0]! < ceiling) return buffer[0]! % limit
  }
  return Math.floor(Math.random() * limit)
}

/**
 * Color a guardar en `team` al registrar.
 *
 * Antes salía de un hash del token, así que no era aleatorio: los tokens
 * comparten sufijo de sala y varios caían en el mismo color, por eso el rojo
 * parecía repetirse. Ahora se sortea de verdad y se descartan los colores
 * recién usados para que dos altas seguidas no coincidan.
 */
export function randomRegistrationColor(avoid: (string | null | undefined)[] = []): string {
  const excluded = new Set(
    avoid.filter((color): color is string => Boolean(color)).map((color) => color.toLowerCase()),
  )
  const candidates = PARTICIPANT_PALETTE.filter(
    (color) => !excluded.has(color.toLowerCase()),
  )
  const pool = candidates.length > 0 ? candidates : PARTICIPANT_PALETTE
  return pool[randomIndex(pool.length)]!
}
