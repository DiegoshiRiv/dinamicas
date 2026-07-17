export type FondoCdId = 'fondoCD' | 'fondoCD2'

/** Marcador en banners de eventos: se resuelve al renderizar. */
export const FONDO_CD_DYNAMIC = '__fondo_cd_dynamic__'

export const FONDO_CD_IDS: FondoCdId[] = ['fondoCD', 'fondoCD2']

export const FONDO_CD_LABELS: Record<FondoCdId, string> = {
  fondoCD: 'Fondo 1',
  fondoCD2: 'Fondo 2',
}

const FONDO_LOADERS: Record<FondoCdId, () => Promise<{ default: string }>> = {
  fondoCD: () => import('@/assets/Fondo1.png'),
  fondoCD2: () => import('@/assets/Fondo2.png'),
}

const FONDO_ORDER: FondoCdId[] = ['fondoCD', 'fondoCD2']
const STORAGE_KEY = 'fondo-cd-index'

let cachedId: FondoCdId | null = null
let cachedUrl: string | null = null
const urlById = new Map<FondoCdId, string>()

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

/** Carga solo el fondo activo para no descargar las dos variantes a la vez. */
export async function resolveFondoCdUrl(id: FondoCdId = getActiveFondoCdId()): Promise<string> {
  const cached = urlById.get(id)
  if (cached) return cached

  const mod = await FONDO_LOADERS[id]()
  urlById.set(id, mod.default)
  if (id === getActiveFondoCdId()) {
    cachedUrl = mod.default
  }
  return mod.default
}

export function getAlternatingFondoCd(): string {
  return cachedUrl ?? ''
}

export function getFondoCdUrl(id: FondoCdId): string {
  return urlById.get(id) ?? cachedUrl ?? ''
}
