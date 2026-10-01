import { useCallback, useEffect, useRef, useState, type MutableRefObject, type PointerEvent, type TouchEvent, type TouchList, type WheelEvent } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import {
  centerCoverTransform,
  clampCropTransform,
  cropZoomPercent,
  type CropTransform,
  zoomCropAtPoint,
} from '@/app/utils/imageCrop'

type ImageCropEditorProps = {
  imageSrc: string
  aspectRatio: number
  className?: string
  onReadyChange?: (ready: boolean) => void
  /** Expone API al padre vía ref callback */
  editorRef?: MutableRefObject<ImageCropEditorHandle | null>
}

export type ImageCropEditorHandle = {
  getTransform: () => CropTransform | null
  getFrameSize: () => { width: number; height: number } | null
  getImageElement: () => HTMLImageElement | null
  resetView: () => void
}

function touchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.hypot(dx, dy)
}

function touchMidpoint(touches: TouchList): { x: number; y: number } {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  }
}

export function ImageCropEditor({
  imageSrc,
  aspectRatio,
  className = '',
  onReadyChange,
  editorRef,
}: ImageCropEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [frame, setFrame] = useState({ width: 0, height: 0 })
  const [natural, setNatural] = useState({ width: 0, height: 0 })
  const [transform, setTransform] = useState<CropTransform>({ scale: 1, x: 0, y: 0 })
  const [ready, setReady] = useState(false)

  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  })
  const pinchRef = useRef({
    active: false,
    startDistance: 0,
    startScale: 1,
    focalX: 0,
    focalY: 0,
  })
  const transformRef = useRef(transform)
  transformRef.current = transform

  const applyClamp = useCallback(
    (next: CropTransform, nw = natural.width, nh = natural.height, fw = frame.width, fh = frame.height) => {
      if (!nw || !nh || !fw || !fh) return next
      return clampCropTransform(next, nw, nh, fw, fh)
    },
    [natural.width, natural.height, frame.width, frame.height],
  )

  const resetView = useCallback(() => {
    if (!natural.width || !frame.width) return
    const next = centerCoverTransform(natural.width, natural.height, frame.width, frame.height)
    setTransform(next)
  }, [natural, frame])

  useEffect(() => {
    if (!editorRef) return
    editorRef.current = {
      getTransform: () => (ready ? transformRef.current : null),
      getFrameSize: () => (frame.width ? frame : null),
      getImageElement: () => imgRef.current,
      resetView,
    }
    return () => {
      editorRef.current = null
    }
  }, [editorRef, ready, frame, resetView])

  useEffect(() => {
    onReadyChange?.(ready)
  }, [ready, onReadyChange])

  useEffect(() => {
    setReady(false)
    setNatural({ width: 0, height: 0 })
    setTransform({ scale: 1, x: 0, y: 0 })
  }, [imageSrc])

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const measure = () => {
      const width = el.clientWidth
      const height = el.clientHeight
      setFrame((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!natural.width || !frame.width) return
    setTransform(centerCoverTransform(natural.width, natural.height, frame.width, frame.height))
    setReady(true)
  }, [natural.width, natural.height, imageSrc])

  useEffect(() => {
    if (!ready || !natural.width || !frame.width) return
    setTransform((prev) => applyClamp(prev))
  }, [frame.width, frame.height, ready, natural.width, natural.height, applyClamp])

  const handleImageLoad = () => {
    const img = imgRef.current
    if (!img) return
    setNatural({ width: img.naturalWidth, height: img.naturalHeight })
  }

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (pinchRef.current.active || e.button === 2) return
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: transform.x,
      originY: transform.y,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== e.pointerId || pinchRef.current.active) {
      return
    }
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setTransform(
      applyClamp({
        ...transformRef.current,
        x: dragRef.current.originX + dx,
        y: dragRef.current.originY + dy,
      }),
    )
  }

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId !== e.pointerId) return
    dragRef.current.active = false
    dragRef.current.pointerId = -1
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ya liberado */
    }
  }

  const localPoint = (clientX: number, clientY: number) => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) return { x: frame.width / 2, y: frame.height / 2 }
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 2) return
    const mid = touchMidpoint(e.touches)
    const focal = localPoint(mid.x, mid.y)
    pinchRef.current = {
      active: true,
      startDistance: touchDistance(e.touches),
      startScale: transformRef.current.scale,
      focalX: focal.x,
      focalY: focal.y,
    }
    dragRef.current.active = false
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!pinchRef.current.active || e.touches.length < 2) return
    e.preventDefault()
    const distance = touchDistance(e.touches)
    if (!pinchRef.current.startDistance) return
    const mid = touchMidpoint(e.touches)
    const focal = localPoint(mid.x, mid.y)
    const ratio = distance / pinchRef.current.startDistance
    setTransform(
      zoomCropAtPoint(
        { ...transformRef.current, scale: pinchRef.current.startScale },
        natural.width,
        natural.height,
        frame.width,
        frame.height,
        pinchRef.current.startScale * ratio,
        focal.x,
        focal.y,
      ),
    )
  }

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      pinchRef.current.active = false
      pinchRef.current.startDistance = 0
    }
  }

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!natural.width || !frame.width) return
    const focal = localPoint(e.clientX, e.clientY)
    const factor = e.deltaY > 0 ? 0.94 : 1.06
    setTransform(
      zoomCropAtPoint(
        transformRef.current,
        natural.width,
        natural.height,
        frame.width,
        frame.height,
        transformRef.current.scale * factor,
        focal.x,
        focal.y,
      ),
    )
  }

  const bumpZoom = (factor: number) => {
    if (!natural.width || !frame.width) return
    setTransform(
      zoomCropAtPoint(
        transformRef.current,
        natural.width,
        natural.height,
        frame.width,
        frame.height,
        transformRef.current.scale * factor,
        frame.width / 2,
        frame.height / 2,
      ),
    )
  }

  const zoomPct =
    natural.width && frame.width
      ? cropZoomPercent(transform, natural.width, natural.height, frame.width, frame.height)
      : 100

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        ref={frameRef}
        className="relative w-full overflow-hidden rounded-2xl bg-[#0b1220] touch-none select-none cursor-grab active:cursor-grabbing shadow-inner ring-1 ring-white/15"
        style={{ aspectRatio: String(aspectRatio) }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Imagen completa atenuada fuera del “área útil” no aplica: el marco ya recorta */}
        {imageSrc ? (
          <img
            ref={imgRef}
            src={imageSrc}
            alt=""
            draggable={false}
            onLoad={handleImageLoad}
            className="absolute left-0 top-0 max-w-none pointer-events-none"
            style={{
              width: natural.width ? natural.width * transform.scale : undefined,
              height: natural.height ? natural.height * transform.scale : undefined,
              transform: `translate(${transform.x}px, ${transform.y}px)`,
              opacity: ready ? 1 : 0,
            }}
          />
        ) : null}

        {/* Máscara / guía tipo red social */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-2 border-white/80 rounded-2xl" />
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/25" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/25" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/25" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/25" />
        </div>

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm font-semibold">
            Cargando…
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => bumpZoom(0.9)}
          className="w-11 h-11 rounded-full bg-white/10 text-white inline-flex items-center justify-center hover:bg-white/20"
          aria-label="Alejar"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="min-w-[3.5rem] text-center text-sm font-black text-white tabular-nums">
          {zoomPct}%
        </span>
        <button
          type="button"
          onClick={() => bumpZoom(1.1)}
          className="w-11 h-11 rounded-full bg-white/10 text-white inline-flex items-center justify-center hover:bg-white/20"
          aria-label="Acercar"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
