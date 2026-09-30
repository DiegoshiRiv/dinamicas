import { useCallback, useRef, useState, type ReactNode, type TouchList } from 'react'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ImageIcon,
  RotateCcw,
  Type,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react'
import {
  clampFondoLayout,
  DEFAULT_HEADER_LAYOUT,
  type HeaderLayoutConfig,
} from '@/app/config/headerLayout'
import { FONDO_CD_IDS, FONDO_CD_LABELS, type FondoCdId } from '@/app/utils/alternatingFondoCd'

export type HeaderEditMode = 'fondo' | 'logo'

type HeaderLayoutEditorProps = {
  fondoUrl: string
  fondoId: FondoCdId
  editMode: HeaderEditMode
  onEditModeChange: (mode: HeaderEditMode) => void
  onFondoChange: (id: FondoCdId) => void
  layout: HeaderLayoutConfig
  onChange: (layout: HeaderLayoutConfig) => void
  onSave: () => void | Promise<void>
  onClose: () => void
  onResetCurrent: () => void
}

function touchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.hypot(dx, dy)
}

export function HeaderLayoutEditor({
  fondoUrl,
  fondoId,
  editMode,
  onEditModeChange,
  onFondoChange,
  layout,
  onChange,
  onSave,
  onClose,
  onResetCurrent,
}: HeaderLayoutEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageMetricsRef = useRef({ w: 1600, h: 800 })
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  })
  const pinchRef = useRef({
    active: false,
    startDistance: 0,
    startSize: 100,
  })
  const [saving, setSaving] = useState(false)

  const clampAndApply = useCallback(
    (next: HeaderLayoutConfig) => {
      const el = containerRef.current
      if (!el) {
        onChange(next)
        return
      }
      onChange(
        clampFondoLayout(
          next,
          el.clientWidth,
          el.clientHeight,
          imageMetricsRef.current.w,
          imageMetricsRef.current.h,
        ),
      )
    },
    [onChange],
  )

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    imageMetricsRef.current = { w: img.naturalWidth, h: img.naturalHeight }
    clampAndApply(layout)
  }

  const applyDrag = (dx: number, dy: number) => {
    clampAndApply({
      ...layout,
      bgOffsetX: dragRef.current.startOffsetX + dx,
      bgOffsetY: dragRef.current.startOffsetY + dy,
    })
  }

  const nudge = (dx: number, dy: number) => {
    clampAndApply({
      ...layout,
      bgOffsetX: layout.bgOffsetX + dx,
      bgOffsetY: layout.bgOffsetY + dy,
    })
  }

  const adjustZoom = (delta: number) => {
    clampAndApply({
      ...layout,
      bgSizePercent: layout.bgSizePercent + delta,
    })
  }

  const adjustLogo = (delta: number) => {
    const nextScale = Math.min(1.4, Math.max(0.6, Math.round((layout.logoScale + delta) * 100) / 100))
    onChange({ ...layout, logoScale: nextScale })
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editMode !== 'fondo' || pinchRef.current.active) return
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: layout.bgOffsetX,
      startOffsetY: layout.bgOffsetY,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editMode !== 'fondo' || !dragRef.current.active || dragRef.current.pointerId !== e.pointerId) {
      return
    }
    applyDrag(e.clientX - dragRef.current.startX, e.clientY - dragRef.current.startY)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId !== e.pointerId) return
    dragRef.current.active = false
    dragRef.current.pointerId = -1
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (editMode !== 'fondo' || e.touches.length !== 2) return
    pinchRef.current = {
      active: true,
      startDistance: touchDistance(e.touches),
      startSize: layout.bgSizePercent,
    }
    dragRef.current.active = false
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (editMode !== 'fondo' || !pinchRef.current.active || e.touches.length < 2) return
    e.preventDefault()
    const distance = touchDistance(e.touches)
    if (!pinchRef.current.startDistance) return
    const ratio = distance / pinchRef.current.startDistance
    clampAndApply({
      ...layout,
      bgSizePercent: Math.round(pinchRef.current.startSize * ratio),
    })
  }

  const handleTouchEnd = () => {
    pinchRef.current.active = false
    pinchRef.current.startDistance = 0
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (editMode !== 'fondo') return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -4 : 4
    clampAndApply({
      ...layout,
      bgSizePercent: layout.bgSizePercent + delta,
    })
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await onSave()
    } finally {
      setSaving(false)
    }
  }

  const hint =
    editMode === 'fondo'
      ? 'Arrastra · pellizca · o usa los botones de abajo'
      : 'Pellizca el logo o ajusta el tamaño abajo'

  const isDefault =
    layout.bgOffsetX === DEFAULT_HEADER_LAYOUT.bgOffsetX &&
    layout.bgOffsetY === DEFAULT_HEADER_LAYOUT.bgOffsetY &&
    layout.bgSizePercent === DEFAULT_HEADER_LAYOUT.bgSizePercent &&
    layout.logoScale === DEFAULT_HEADER_LAYOUT.logoScale

  return (
    <div className="absolute inset-0 z-[15]">
      <div className="absolute top-0 inset-x-0 z-30 bg-gradient-to-b from-black/80 via-black/55 to-transparent px-2 pt-2 pb-4 space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-2 text-[11px] font-bold text-white shrink-0 min-h-10"
          >
            <X className="w-3.5 h-3.5" />
            Cancelar
          </button>

          <div className="flex-1 flex justify-center gap-1 min-w-0">
            {FONDO_CD_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onFondoChange(id)}
                className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-wide truncate min-h-10 ${
                  fondoId === id ? 'bg-white text-[#0d3b66]' : 'bg-white/20 text-white'
                }`}
              >
                {FONDO_CD_LABELS[id]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex items-center gap-1 rounded-full bg-[#2563eb] px-3 py-2 text-[11px] font-black text-white shadow-lg shrink-0 min-h-10 disabled:opacity-70"
          >
            <Check className="w-3.5 h-3.5" />
            {saving ? '…' : 'Guardar'}
          </button>
        </div>

        <div className="flex gap-1 p-0.5 rounded-full bg-white/15">
          <button
            type="button"
            onClick={() => onEditModeChange('fondo')}
            className={`flex-1 flex items-center justify-center gap-1 rounded-full py-2 text-[10px] font-black uppercase tracking-wide min-h-10 ${
              editMode === 'fondo' ? 'bg-white text-[#0d3b66]' : 'text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Fondo
          </button>
          <button
            type="button"
            onClick={() => onEditModeChange('logo')}
            className={`flex-1 flex items-center justify-center gap-1 rounded-full py-2 text-[10px] font-black uppercase tracking-wide min-h-10 ${
              editMode === 'logo' ? 'bg-white text-[#0d3b66]' : 'text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Logo
          </button>
        </div>

        <p className="text-center text-[10px] font-semibold text-white/95 pointer-events-none">{hint}</p>
      </div>

      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/40" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white/40" />
        <div className="absolute inset-3 border border-white/35 rounded-lg" />
      </div>

      <div
        ref={containerRef}
        className={`absolute inset-0 z-[18] touch-none ${
          editMode === 'fondo' ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
        }`}
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
        <img
          src={fondoUrl}
          alt=""
          onLoad={handleImageLoad}
          className="absolute left-1/2 top-0 max-w-none select-none pointer-events-none"
          draggable={false}
          style={{
            width: `${layout.bgSizePercent}%`,
            transform: `translate(calc(-50% + ${layout.bgOffsetX}px), ${layout.bgOffsetY}px)`,
          }}
        />
      </div>

      {editMode === 'logo' && (
        <div className="absolute inset-0 z-[17] bg-black/20 pointer-events-none" />
      )}

      <div className="absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black/85 via-black/65 to-transparent px-3 pt-8 pb-3 space-y-2">
        {editMode === 'fondo' ? (
          <>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => adjustZoom(-6)}
                className="w-11 h-11 rounded-full bg-white/20 text-white inline-flex items-center justify-center"
                aria-label="Alejar"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <div className="min-w-[4.5rem] text-center text-[12px] font-black text-white tabular-nums">
                {Math.round(layout.bgSizePercent)}%
              </div>
              <button
                type="button"
                onClick={() => adjustZoom(6)}
                className="w-11 h-11 rounded-full bg-white/20 text-white inline-flex items-center justify-center"
                aria-label="Acercar"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => nudge(-12, 0)}
                className="w-10 h-10 rounded-xl bg-white/15 text-white inline-flex items-center justify-center"
                aria-label="Mover izquierda"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => nudge(0, -12)}
                  className="w-10 h-10 rounded-xl bg-white/15 text-white inline-flex items-center justify-center"
                  aria-label="Mover arriba"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => nudge(0, 12)}
                  className="w-10 h-10 rounded-xl bg-white/15 text-white inline-flex items-center justify-center"
                  aria-label="Mover abajo"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => nudge(12, 0)}
                className="w-10 h-10 rounded-xl bg-white/15 text-white inline-flex items-center justify-center"
                aria-label="Mover derecha"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => adjustLogo(-0.05)}
              className="w-11 h-11 rounded-full bg-white/20 text-white inline-flex items-center justify-center text-lg font-black"
              aria-label="Logo más pequeño"
            >
              −
            </button>
            <div className="min-w-[4.5rem] text-center text-[12px] font-black text-white tabular-nums">
              {Math.round(layout.logoScale * 100)}%
            </div>
            <button
              type="button"
              onClick={() => adjustLogo(0.05)}
              className="w-11 h-11 rounded-full bg-white/20 text-white inline-flex items-center justify-center text-lg font-black"
              aria-label="Logo más grande"
            >
              +
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={isDefault}
          onClick={onResetCurrent}
          className="w-full rounded-xl bg-white/15 text-white text-[11px] font-bold py-2.5 inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restablecer {FONDO_CD_LABELS[fondoId]}
        </button>
      </div>
    </div>
  )
}

type LogoScaleEditorProps = {
  enabled: boolean
  layout: HeaderLayoutConfig
  onChange: (layout: HeaderLayoutConfig) => void
  children: ReactNode
}

export function LogoScaleEditor({ enabled, layout, onChange, children }: LogoScaleEditorProps) {
  const pinchRef = useRef({ active: false, startDistance: 0, startScale: 1 })

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enabled || e.touches.length !== 2) return
    e.stopPropagation()
    pinchRef.current = {
      active: true,
      startDistance: touchDistance(e.touches),
      startScale: layout.logoScale,
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enabled || !pinchRef.current.active || e.touches.length < 2) return
    e.preventDefault()
    e.stopPropagation()
    const distance = touchDistance(e.touches)
    if (!pinchRef.current.startDistance) return
    const ratio = distance / pinchRef.current.startDistance
    const nextScale = Math.min(1.4, Math.max(0.6, pinchRef.current.startScale * ratio))
    onChange({ ...layout, logoScale: Math.round(nextScale * 100) / 100 })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!enabled) return
    e.stopPropagation()
    pinchRef.current.active = false
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (!enabled) return
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.03 : 0.03
    const nextScale = Math.min(1.4, Math.max(0.6, layout.logoScale + delta))
    onChange({ ...layout, logoScale: Math.round(nextScale * 100) / 100 })
  }

  return (
    <div
      className={`relative touch-none ${enabled ? 'pointer-events-auto' : 'pointer-events-none'}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onWheel={handleWheel}
    >
      {children}
    </div>
  )
}
