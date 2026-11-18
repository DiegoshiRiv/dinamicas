export const BRANDING_IMAGES_KEY = 'branding_images'
const LOCAL_CACHE_KEY = 'dinamicas-branding-images-v1'

/** Solo queda la miniatura de “quedada anterior”; los fondos van por tipo de evento. */
export type BrandingImageSlot = 'anterior'

export type BrandingImages = {
  anterior?: string | null
  /** Legados: se ignoran al leer/escribir nuevos valores */
  fondoCD?: string | null
  fondoCD2?: string | null
  siguiente?: string | null
}

export const BRANDING_SLOTS: {
  id: BrandingImageSlot
  label: string
  hint: string
  maxDimension: number
  quality: number
}[] = [
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
  base.anterior = isDataOrHttpUrl(row.anterior) ? row.anterior : null
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
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({ anterior: images.anterior ?? null }))
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
  liveImages = { anterior: next.anterior ?? null }
  saveBrandingImagesToStorage(liveImages)
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
