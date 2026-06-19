import { useEffect, useState } from 'react'
import type { Banner } from '@/hooks/useParticipants'

const ROTATION_MS = 4000

export function SponsorBannerCarousel({
  banners,
  className = 'mb-6',
}: {
  banners: Banner[]
  className?: string
}) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(
      () => setIndex((prev) => (prev + 1) % banners.length),
      ROTATION_MS,
    )
    return () => clearInterval(interval)
  }, [banners.length])

  if (banners.length === 0) return null

  return (
    <div className={`relative w-full h-32 rounded-xl overflow-hidden bg-gray-100 ${className}`}>
      {banners.map((banner, i) => {
        const isActive = i === index
        const cls = `absolute inset-0 w-full h-full transition-opacity duration-1000 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`
        if (banner.link_url) {
          return (
            <a
              key={banner.id}
              href={banner.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cls}
            >
              <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
            </a>
          )
        }
        return (
          <div key={banner.id} className={cls}>
            <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )
      })}
    </div>
  )
}
