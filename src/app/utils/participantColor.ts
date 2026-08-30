/** Paleta vibrante para segmentos de ruleta (sin equipos). */
export const PARTICIPANT_PALETTE = [
  '#E74C3C',
  '#549BE7',
  '#F7D548',
  '#2ECC71',
  '#9B59B6',
  '#E67E22',
  '#1ABC9C',
  '#E91E63',
  '#00BCD4',
  '#8BC34A',
  '#FF5722',
  '#3F51B5',
  '#CDDC39',
  '#795548',
  '#607D8B',
  '#FF9800',
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

const LEGACY_TEAM_COLORS: Record<string, string> = {
  blue: '#549BE7',
  yellow: '#F7D548',
  red: '#E74C3C',
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
