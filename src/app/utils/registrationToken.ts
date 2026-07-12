import { encodeIpForRoulette, sanitizeRouletteCode } from '@/app/utils/rouletteCode'

const STORAGE_KEY = 'dinamicas-registration-token-v1'

function newUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/** UUID estable por dispositivo (localStorage). */
export function getOrCreateDeviceToken(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)?.trim()
    if (existing) return existing
    const created = newUuid()
    localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    // Safari privado / storage bloqueado: token de sesión (sigue sirviendo para reintentos en la misma pestaña).
    const g = globalThis as { __dinamicasRegToken?: string }
    if (!g.__dinamicasRegToken) g.__dinamicasRegToken = newUuid()
    return g.__dinamicasRegToken
  }
}

/**
 * Token de registro acotado a la sala/evento (equivalente a UNIQUE(event_id, token)).
 * Formato: {uuid}::r:{rouletteCode}
 */
export function encodeRegistrationToken(deviceToken: string, rouletteCode: string): string {
  return encodeIpForRoulette(deviceToken, sanitizeRouletteCode(rouletteCode))
}
