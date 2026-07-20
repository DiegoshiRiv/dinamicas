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
    // Retraso corto: prioriza pintar el formulario antes del fondo.
    const timeoutId = window.setTimeout(() => {
      void resolveFondoCdUrl(id).then((resolved) => {
        if (!cancelled) setUrl(resolved)
      })
    }, 120)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [overrideId])

  return url
}
