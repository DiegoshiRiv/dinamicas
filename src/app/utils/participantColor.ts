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

/** Valor a guardar en `team` al registrar (color hex). */
export function randomRegistrationColor(seed: string): string {
  return colorForParticipant(seed)
}
