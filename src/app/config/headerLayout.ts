import type { FondoCdId } from '@/app/utils/alternatingFondoCd'

export type HeaderLayoutConfig = {
  bgOffsetX: number
  bgOffsetY: number
  bgSizePercent: number
  logoScale: number
}

export type HeaderLayoutsStore = {
  fondos: Record<FondoCdId, HeaderLayoutConfig>
}

export const DEFAULT_HEADER_LAYOUT: HeaderLayoutConfig = {
  bgOffsetX: 0,
  bgOffsetY: -40,
  bgSizePercent: 100,
  logoScale: 1,
}

export const HEADER_LAYOUT_STORAGE_KEY = 'headerLayoutConfig'
export const HEADER_LAYOUT_SETTINGS_KEY = 'header_layout'

const LOGO_BASE_HEIGHT = { mobile: 108, sm: 145 } as const

export function createDefaultHeaderLayoutsStore(): HeaderLayoutsStore {
  return {
    fondos: {
      fondoCD: { ...DEFAULT_HEADER_LAYOUT },
      fondoCD2: { ...DEFAULT_HEADER_LAYOUT, bgOffsetY: -40 },
    },
  }
}

export function logoMaxHeight(scale: number, isSm: boolean): number {
  const base = isSm ? LOGO_BASE_HEIGHT.sm : LOGO_BASE_HEIGHT.mobile
  return Math.round(base * scale)
}

export function parseHeaderLayout(raw: unknown): HeaderLayoutConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_HEADER_LAYOUT }
  const o = raw as Record<string, unknown>
  return {
    bgOffsetX: typeof o.bgOffsetX === 'number' ? o.bgOffsetX : DEFAULT_HEADER_LAYOUT.bgOffsetX,
    bgOffsetY: typeof o.bgOffsetY === 'number' ? o.bgOffsetY : DEFAULT_HEADER_LAYOUT.bgOffsetY,
    bgSizePercent:
      typeof o.bgSizePercent === 'number' ? o.bgSizePercent : DEFAULT_HEADER_LAYOUT.bgSizePercent,
    logoScale: typeof o.logoScale === 'number' ? o.logoScale : DEFAULT_HEADER_LAYOUT.logoScale,
  }
}

export function parseHeaderLayoutsStore(raw: unknown): HeaderLayoutsStore {
  const defaults = createDefaultHeaderLayoutsStore()
  if (!raw || typeof raw !== 'object') return defaults

  const o = raw as Record<string, unknown>

  if (o.fondos && typeof o.fondos === 'object') {
    const fondos = o.fondos as Record<string, unknown>
    return {
      fondos: {
        fondoCD: parseHeaderLayout(fondos.fondoCD ?? defaults.fondos.fondoCD),
        fondoCD2: parseHeaderLayout(fondos.fondoCD2 ?? defaults.fondos.fondoCD2),
      },
    }
  }

  const legacy = parseHeaderLayout(raw)
  return {
    fondos: {
      fondoCD: { ...legacy },
      fondoCD2: { ...legacy },
    },
  }
}

export function loadHeaderLayoutsFromStorage(): HeaderLayoutsStore {
  if (typeof window === 'undefined') return createDefaultHeaderLayoutsStore()
  try {
    const raw = localStorage.getItem(HEADER_LAYOUT_STORAGE_KEY)
    if (!raw) return createDefaultHeaderLayoutsStore()
    return parseHeaderLayoutsStore(JSON.parse(raw))
  } catch {
    return createDefaultHeaderLayoutsStore()
  }
}

export function saveHeaderLayoutsToStorage(store: HeaderLayoutsStore) {
  if (typeof window === 'undefined') return
  localStorage.setItem(HEADER_LAYOUT_STORAGE_KEY, JSON.stringify(store))
}

export function getRenderedFondoSize(
  containerWidth: number,
  bgSizePercent: number,
  naturalWidth: number,
  naturalHeight: number,
) {
  const width = containerWidth * (bgSizePercent / 100)
  const height = width * (naturalHeight / naturalWidth)
  return { width, height }
}

/** Ajusta zoom y posición para que el fondo siempre cubra el contenedor. */
export function clampFondoLayout(
  layout: HeaderLayoutConfig,
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): HeaderLayoutConfig {
  if (!containerWidth || !containerHeight || !naturalWidth || !naturalHeight) return layout

  const minPercentForHeight =
    (containerHeight / containerWidth) * (naturalWidth / naturalHeight) * 100
  const minPercent = Math.max(100, Math.ceil(minPercentForHeight))
  const bgSizePercent = Math.min(180, Math.max(minPercent, layout.bgSizePercent))

  const { width: imgW, height: imgH } = getRenderedFondoSize(
    containerWidth,
    bgSizePercent,
    naturalWidth,
    naturalHeight,
  )

  const minOffsetX = containerWidth / 2 - imgW / 2
  const maxOffsetX = imgW / 2 - containerWidth / 2
  const minOffsetY = containerHeight - imgH
  const maxOffsetY = 0

  return {
    ...layout,
    bgSizePercent,
    bgOffsetX: Math.min(maxOffsetX, Math.max(minOffsetX, layout.bgOffsetX)),
    bgOffsetY: Math.min(maxOffsetY, Math.max(minOffsetY, layout.bgOffsetY)),
  }
}
