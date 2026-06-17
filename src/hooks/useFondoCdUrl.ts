import { useEffect, useState } from 'react'
import {
  getActiveFondoCdId,
  resolveFondoCdUrl,
  type FondoCdId,
} from '@/app/utils/alternatingFondoCd'

export function useFondoCdUrl(overrideId?: FondoCdId) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const id = overrideId ?? getActiveFondoCdId()

    void resolveFondoCdUrl(id).then((resolved) => {
      if (!cancelled) setUrl(resolved)
    })

    return () => {
      cancelled = true
    }
  }, [overrideId])

  return url
}
