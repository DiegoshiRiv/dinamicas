import type { FondoCdId } from '@/app/utils/alternatingFondoCd'

export const BRANDING_IMAGES_KEY = 'branding_images'
const LOCAL_CACHE_KEY = 'dinamicas-branding-images-v1'

export type BrandingImageSlot = FondoCdId | 'siguiente' | 'anterior'

export type BrandingImages = {
  fondoCD?: string | null
  fondoCD2?: string | null
  siguiente?: string | null
  anterior?: string | null
}

export const BRANDING_SLOTS: {
  id: BrandingImageSlot
  label: string
  hint: string
  maxDimension: number
  quality: number
}[] = [
  {
    id: 'fondoCD',
    label: 'Fondo 1',
    hint: 'Portada del encabezado (variante A)',
    maxDimension: 1600,
    quality: 0.82,
  },
  {
    id: 'fondoCD2',
    label: 'Fondo 2',
    hint: 'Portada del encabezado (variante B)',
    maxDimension: 1600,
    quality: 0.82,
  },
  {
    id: 'siguiente',
    label: 'Anuncio siguiente',
    hint: 'Pantalla completa al abrir (próximo evento)',
    maxDimension: 1400,
    quality: 0.84,
  },
  {
    id: 'anterior',
    label: 'Quedada anterior',
    hint: 'Miniatura en la pantalla de registro',
    maxDimension: 700,
    quality: 0.85,
  },
]

export function emptyBrandingImages(): BrandingImages {
  return {
    fondoCD: null,
    fondoCD2: null,
    siguiente: null,
    anterior: null,
  }
}

function isDataOrHttpUrl(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 16 &&
    (value.startsWith('data:image/') ||
      value.startsWith('https://') ||
      value.startsWith('http://') ||
      value.startsWith('blob:'))
  )
}

export function parseBrandingImages(raw: unknown): BrandingImages {
  const base = emptyBrandingImages()
  if (!raw || typeof raw !== 'object') return base
  const row = raw as Record<string, unknown>
  for (const key of Object.keys(base) as (keyof BrandingImages)[]) {
    base[key] = isDataOrHttpUrl(row[key]) ? row[key] : null
  }
  return base
}

export function loadBrandingImagesFromStorage(): BrandingImages {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY)
    if (!raw) return emptyBrandingImages()
    return parseBrandingImages(JSON.parse(raw))
  } catch {
    return emptyBrandingImages()
  }
}

export function saveBrandingImagesToStorage(images: BrandingImages) {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(images))
  } catch {
    /* cuota / modo privado */
  }
}

type Listener = () => void
let liveImages = loadBrandingImagesFromStorage()
const listeners = new Set<Listener>()

export function getLiveBrandingImages(): BrandingImages {
  return liveImages
}

export function setLiveBrandingImages(next: BrandingImages) {
  liveImages = next
  saveBrandingImagesToStorage(next)
  listeners.forEach((fn) => {
    try {
      fn()
    } catch {
      /* ignore */
    }
  })
}

export function subscribeBrandingImages(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
