import { useEffect, useRef, useState } from 'react'
import { Check, ImagePlus, RotateCcw, Type, Upload, X } from 'lucide-react'
import logoImg from '@/assets/logos/Logo.webp'
import { logoMaxHeight, type HeaderLayoutConfig } from '@/app/config/headerLayout'
import {
  ImageCropEditor,
  type ImageCropEditorHandle,
} from '@/app/components/ImageCropEditor'
import { optimizeImageFile } from '@/app/utils/optimizeImageFile'
import {
  exportCroppedImage,
  PORTADA_ASPECT_RATIO,
  PORTADA_EXPORT_HEIGHT,
  PORTADA_EXPORT_WIDTH,
} from '@/app/utils/imageCrop'
import { FONDO_CD_IDS, FONDO_CD_LABELS, type FondoCdId } from '@/app/utils/alternatingFondoCd'

export type HeaderEditMode = 'fondo' | 'logo'

type HeaderLayoutEditorProps = {
  open: boolean
  fondoUrl: string
  fondoId: FondoCdId
  onFondoChange: (id: FondoCdId) => void
  layout: HeaderLayoutConfig
  onLayoutChange: (layout: HeaderLayoutConfig) => void
  onApply: (result: {
    fondoId: FondoCdId
    imageDataUrl: string
    layout: HeaderLayoutConfig
  }) => void | Promise<void>
  onClose: () => void
}

export function HeaderLayoutEditor({
  open,
  fondoUrl,
  fondoId,
  onFondoChange,
  layout,
  onLayoutChange,
  onApply,
  onClose,
}: HeaderLayoutEditorProps) {
  const cropRef = useRef<ImageCropEditorHandle | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<HeaderEditMode>('fondo')
  const [workingSrc, setWorkingSrc] = useState(fondoUrl)
  const [cropReady, setCropReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSm, setIsSm] = useState(false)

  useEffect(() => {
    if (!open) return
    setWorkingSrc(fondoUrl)
    setMode('fondo')
    setError(null)
    setBusy(false)
    setCropReady(false)
  }, [open, fondoUrl, fondoId])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const update = () => setIsSm(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (!open) return null

  const handlePick = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const dataUrl = await optimizeImageFile(file, 2200, 0.92, { forceJpeg: true })
      setWorkingSrc(dataUrl)
      setMode('fondo')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la imagen')
    } finally {
      setBusy(false)
    }
  }

  const handleApply = async () => {
    if (busy) return
    setError(null)
    setBusy(true)
    try {
      const handle = cropRef.current
      const transform = handle?.getTransform()
      const frame = handle?.getFrameSize()
      const imageEl = handle?.getImageElement()
      if (!transform || !frame || !imageEl) {
        throw new Error('Espera a que cargue la imagen')
      }
      const imageDataUrl = exportCroppedImage(imageEl, transform, frame, {
        exportWidth: PORTADA_EXPORT_WIDTH,
        exportHeight: PORTADA_EXPORT_HEIGHT,
        mimeType: 'image/jpeg',
        quality: 0.88,
      })
      await onApply({
        fondoId,
        imageDataUrl,
        layout: {
          bgOffsetX: 0,
          bgOffsetY: 0,
          bgSizePercent: 100,
          logoScale: layout.logoScale,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el recorte')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0b1220] text-white">
      <header className="shrink-0 flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 border-b border-white/10">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-[12px] font-bold min-h-10"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>

        <div className="flex-1 flex justify-center gap-1 min-w-0">
          {FONDO_CD_IDS.map((id) => (
            <button
              key={id}
              type="button"
              disabled={busy}
              onClick={() => onFondoChange(id)}
              className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-wide min-h-10 ${
                fondoId === id ? 'bg-white text-[#0d3b66]' : 'bg-white/10 text-white'
              }`}
            >
              {FONDO_CD_LABELS[id]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={busy || !cropReady}
          className="inline-flex items-center gap-1 rounded-full bg-[#2563eb] px-3 py-2 text-[12px] font-black min-h-10 disabled:opacity-50 shadow-lg"
        >
          <Check className="w-4 h-4" />
          {busy ? '…' : 'Aplicar'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-1 p-0.5 rounded-full bg-white/10">
          <button
            type="button"
            onClick={() => setMode('fondo')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[11px] font-black uppercase tracking-wide min-h-11 ${
              mode === 'fondo' ? 'bg-white text-[#0d3b66]' : 'text-white/80'
            }`}
          >
            <ImagePlus className="w-4 h-4" />
            Recortar
          </button>
          <button
            type="button"
            onClick={() => setMode('logo')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[11px] font-black uppercase tracking-wide min-h-11 ${
              mode === 'logo' ? 'bg-white text-[#0d3b66]' : 'text-white/80'
            }`}
          >
            <Type className="w-4 h-4" />
            Logo
          </button>
        </div>

        <p className="text-center text-[12px] text-white/70 font-semibold leading-relaxed">
          {mode === 'fondo'
            ? 'Arrastra para mover · pellizca o rueda para zoom · sin bordes vacíos'
            : 'Ajusta el tamaño del logo sobre la portada'}
        </p>

        {error && (
          <p className="text-[12px] font-bold text-amber-100 bg-amber-500/20 border border-amber-400/30 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {mode === 'fondo' ? (
          <>
            <ImageCropEditor
              key={`${fondoId}:${workingSrc.slice(0, 64)}`}
              imageSrc={workingSrc}
              aspectRatio={PORTADA_ASPECT_RATIO}
              editorRef={cropRef}
              onReadyChange={setCropReady}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                void handlePick(file)
              }}
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-white text-[#0d3b66] text-sm font-black py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Upload className="w-4 h-4" />
                Subir foto
              </button>
              <button
                type="button"
                disabled={busy || !cropReady}
                onClick={() => cropRef.current?.resetView()}
                className="rounded-xl bg-white/10 text-white text-sm font-bold py-3 inline-flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <RotateCcw className="w-4 h-4" />
                Centrar
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-2xl overflow-hidden bg-[#1e3a5f] ring-1 ring-white/15">
            <div
              className="relative w-full overflow-hidden"
              style={{ aspectRatio: String(PORTADA_ASPECT_RATIO) }}
            >
              <img
                src={workingSrc}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none" />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center px-6">
                <img
                  src={logoImg}
                  alt="Logo"
                  className="w-auto max-w-[88%] object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)]"
                  style={{ maxHeight: `${logoMaxHeight(layout.logoScale, isSm)}px` }}
                  draggable={false}
                />
              </div>
            </div>
            <div className="px-4 py-4 space-y-3 bg-[#0f1b2d]">
              <div className="flex items-center justify-between text-[12px] font-bold text-white/80">
                <span>Tamaño del logo</span>
                <span className="tabular-nums">{Math.round(layout.logoScale * 100)}%</span>
              </div>
              <input
                type="range"
                min={60}
                max={140}
                step={1}
                value={Math.round(layout.logoScale * 100)}
                onChange={(e) =>
                  onLayoutChange({
                    ...layout,
                    logoScale: Number(e.target.value) / 100,
                  })
                }
                className="w-full accent-[#2563eb]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onLayoutChange({
                      ...layout,
                      logoScale: Math.max(0.6, Math.round((layout.logoScale - 0.05) * 100) / 100),
                    })
                  }
                  className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-black"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => onLayoutChange({ ...layout, logoScale: 1 })}
                  className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-bold"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onLayoutChange({
                      ...layout,
                      logoScale: Math.min(1.4, Math.round((layout.logoScale + 0.05) * 100) / 100),
                    })
                  }
                  className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-black"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
