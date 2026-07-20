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

    const load = () => {
      void resolveFondoCdUrl(id).then((resolved) => {
        if (!cancelled) setUrl(resolved)
      })
    }

    // Deja pintar primero el formulario; el fondo llega en idle.
    const ric = window.requestIdleCallback
    let idleId: number | undefined
    let timeoutId: number | undefined
    if (typeof ric === 'function') {
      idleId = ric(load, { timeout: 900 })
    } else {
      timeoutId = window.setTimeout(load, 180)
    }

    return () => {
      cancelled = true
      if (idleId != null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId != null) window.clearTimeout(timeoutId)
    }
  }, [overrideId])

  return url
}
