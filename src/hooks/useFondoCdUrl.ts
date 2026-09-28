import { useEffect, useState } from 'react'
import {
  getActiveFondoCdId,
  resolveFondoCdUrl,
  type FondoCdId,
} from '@/app/utils/alternatingFondoCd'
import { subscribeBrandingImages } from '@/app/utils/brandingImages'

export function useFondoCdUrl(overrideId?: FondoCdId) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const id = overrideId ?? getActiveFondoCdId()

    const load = () => {
      const timeoutId = window.setTimeout(() => {
        void resolveFondoCdUrl(id)
          .then((resolved) => {
            if (!cancelled) setUrl(resolved)
          })
          .catch(() => {
            if (!cancelled) setUrl(null)
          })
      }, 120)
      return timeoutId
    }

    let timeoutId = load()
    const unsubscribe = subscribeBrandingImages(() => {
      window.clearTimeout(timeoutId)
      timeoutId = load()
    })

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [overrideId])

  return url
}
