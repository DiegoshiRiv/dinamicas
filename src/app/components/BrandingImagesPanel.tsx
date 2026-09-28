import { useEffect, useRef, useState } from 'react'
import { ImagePlus, RotateCcw, Upload, X } from 'lucide-react'
import defaultAnterior from '@/assets/anterior.webp'
import defaultFondo1 from '@/assets/Fondo1.webp'
import defaultFondo2 from '@/assets/Fondo2.webp'
import defaultSiguiente from '@/assets/siguiente.webp'
import {
  BRANDING_SLOTS,
  type BrandingImageSlot,
} from '@/app/utils/brandingImages'
import { optimizeImageFile } from '@/app/utils/optimizeImageFile'
import { useBrandingImages } from '@/hooks/useBrandingImages'
import {
  modalOverlayClass,
  modalSheetClass,
} from '@/app/layout/mobileShellLayout'

const DEFAULTS: Record<BrandingImageSlot, string> = {
  fondoCD: defaultFondo1,
  fondoCD2: defaultFondo2,
  siguiente: defaultSiguiente,
  anterior: defaultAnterior,
}

type Props = {
  open: boolean
  onClose: () => void
}

export function BrandingImagesPanel({ open, onClose }: Props) {
  const { images, savingSlot, error, setSlot, resetSlot, resetAll } = useBrandingImages()
  const [localError, setLocalError] = useState<string | null>(null)
  const [busySlot, setBusySlot] = useState<BrandingImageSlot | null>(null)
  const inputRefs = useRef<Partial<Record<BrandingImageSlot, HTMLInputElement | null>>>({})

  useEffect(() => {
    if (!open) {
      setLocalError(null)
      setBusySlot(null)
    }
  }, [open])

  if (!open) return null

  const handlePick = async (slot: BrandingImageSlot, file: File | undefined) => {
    if (!file) return
    const meta = BRANDING_SLOTS.find((s) => s.id === slot)
    if (!meta) return
    setLocalError(null)
    setBusySlot(slot)
    try {
      const dataUrl = await optimizeImageFile(file, meta.maxDimension, meta.quality, {
        forceJpeg: true,
      })
      await setSlot(slot, dataUrl)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'No se pudo procesar la imagen')
    } finally {
      setBusySlot(null)
    }
  }

  return (
    <div className={modalOverlayClass} onClick={onClose}>
      <div
        className={`${modalSheetClass} bg-white max-w-md w-full max-h-[92dvh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-[#0d3b66]">Actualizar imágenes</h2>
            <p className="text-[11px] text-[#5b6483] font-semibold mt-0.5">
              Solo Fuecoco · desde la galería del celular
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-slate-200 inline-flex items-center justify-center text-[#0d3b66]"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <p className="text-[12px] text-[#5b6483] leading-relaxed">
            Toca <span className="font-bold text-[#0d3b66]">Cambiar</span>, elige una foto (JPG/PNG/WebP)
            y se publica al instante para todos. JPG/HEIC del iPhone también sirven.
          </p>

          {(localError || error) && (
            <p className="text-[12px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              {localError || error}
            </p>
          )}

          {BRANDING_SLOTS.map((slot) => {
            const current = images[slot.id] || DEFAULTS[slot.id]
            const isCustom = Boolean(images[slot.id])
            const busy = busySlot === slot.id || savingSlot === slot.id
            return (
              <div
                key={slot.id}
                className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-[#0d3b66]">{slot.label}</p>
                    <p className="text-[11px] text-[#64748b] font-semibold">{slot.hint}</p>
                  </div>
                  {isCustom ? (
                    <span className="text-[10px] font-black uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                      Personalizado
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-0.5">
                      Default
                    </span>
                  )}
                </div>

                <div className="relative w-full overflow-hidden rounded-xl bg-white border border-slate-200 aspect-[16/9]">
                  <img
                    src={current}
                    alt={slot.label}
                    className="absolute inset-0 w-full h-full object-cover"
                    decoding="async"
                  />
                </div>

                <input
                  ref={(el) => {
                    inputRefs.current[slot.id] = el
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    void handlePick(slot.id, file)
                  }}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => inputRefs.current[slot.id]?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0d3b66] text-white text-sm font-black py-2.5 disabled:opacity-60"
                  >
                    {busy ? (
                      'Subiendo…'
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Cambiar
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={busy || !isCustom}
                    onClick={() => void resetSlot(slot.id)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-[#0d3b66] text-sm font-bold px-3 py-2.5 disabled:opacity-40"
                    title="Volver al archivo del sitio"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-4 py-3 border-t border-slate-100 space-y-2">
          <button
            type="button"
            onClick={() => void resetAll()}
            className="w-full rounded-xl border border-slate-200 bg-white text-[#5b6483] text-sm font-bold py-2.5 inline-flex items-center justify-center gap-2"
          >
            <ImagePlus className="w-4 h-4" />
            Restablecer todas al default
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#2563eb] text-white text-sm font-black py-3"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}
