import { useCallback, useEffect, useRef, useState } from 'react'
import {
  resolveFondoObjectPosition,
  type HeaderLayoutConfig,
} from '@/app/config/headerLayout'
import type { FondoCdId } from '@/app/utils/alternatingFondoCd'

type HeaderFondoCoverProps = {
  url: string
  fondoId: FondoCdId
  layout: HeaderLayoutConfig
}

export function HeaderFondoCover({ url, fondoId, layout }: HeaderFondoCoverProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [objectPosition, setObjectPosition] = useState('center 64%')

  const updatePosition = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setObjectPosition(
      resolveFondoObjectPosition(layout, fondoId, el.clientWidth, el.clientHeight),
    )
  }, [fondoId, layout])

  useEffect(() => {
    updatePosition()
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver(updatePosition)
    observer.observe(el)
    return () => observer.disconnect()
  }, [updatePosition])

  return (
    <div ref={containerRef} className="absolute inset-0">
      <img
        src={url}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        draggable={false}
        decoding="async"
        fetchPriority="high"
        style={{ objectPosition }}
        onLoad={updatePosition}
      />
    </div>
  )
}
