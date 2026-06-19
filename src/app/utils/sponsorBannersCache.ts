import type { Banner } from '@/hooks/useParticipants'

const CACHE_KEY = 'sponsor-banners-v1'
const MAX_CACHE_BYTES = 4_000_000

export function loadCachedSponsorBanners(): Banner[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CACHE_KEY) ?? sessionStorage.getItem(CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Banner[]
    return Array.isArray(parsed) ? parsed.filter((b) => b?.id && b?.image_url) : []
  } catch {
    return []
  }
}

export function saveCachedSponsorBanners(banners: Banner[]) {
  if (typeof window === 'undefined' || banners.length === 0) return
  try {
    const payload = JSON.stringify(banners)
    if (payload.length > MAX_CACHE_BYTES) return
    localStorage.setItem(CACHE_KEY, payload)
    sessionStorage.setItem(CACHE_KEY, payload)
  } catch {
    // quota exceeded — keep in-memory state only
  }
}

export function preloadSponsorBannerImages(banners: Banner[]) {
  for (const banner of banners) {
    if (!banner.image_url) continue
    const img = new Image()
    img.decoding = 'async'
    img.src = banner.image_url
  }
}
