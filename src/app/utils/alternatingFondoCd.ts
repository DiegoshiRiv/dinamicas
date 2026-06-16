import fondoCd1 from '@/assets/FondoCD.png'
import fondoCd2 from '@/assets/FondoCD2.png'

export type FondoCdId = 'fondoCD' | 'fondoCD2'

export const FONDO_CD_IDS: FondoCdId[] = ['fondoCD', 'fondoCD2']

export const FONDO_CD_LABELS: Record<FondoCdId, string> = {
  fondoCD: 'Fondo 1',
  fondoCD2: 'Fondo 2',
}

const FONDOS: Record<FondoCdId, string> = {
  fondoCD: fondoCd1,
  fondoCD2: fondoCd2,
}

const FONDO_ORDER: FondoCdId[] = ['fondoCD', 'fondoCD2']
const STORAGE_KEY = 'fondo-cd-index'

let cachedId: FondoCdId | null = null

export function getFondoCdUrl(id: FondoCdId): string {
  return FONDOS[id]
}

/** Alterna entre FondoCD y FondoCD2 en cada recarga (aleatorio la primera vez). */
export function getActiveFondoCdId(): FondoCdId {
  if (cachedId !== null) return cachedId

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    const index =
      stored === null
        ? Math.random() < 0.5
          ? 0
          : 1
        : stored === '0'
          ? 1
          : 0
    sessionStorage.setItem(STORAGE_KEY, String(index))
    cachedId = FONDO_ORDER[index]
  } catch {
    cachedId = FONDO_ORDER[Math.random() < 0.5 ? 0 : 1]
  }

  return cachedId
}

export function getAlternatingFondoCd(): string {
  return FONDOS[getActiveFondoCdId()]
}
