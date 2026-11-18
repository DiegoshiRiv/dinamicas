import { useEffect, useRef, useState } from 'react'
import { Check, ImagePlus, Upload, X } from 'lucide-react'
import defaultAnterior from '@/assets/anterior.webp'
import { EVENT_THEMES } from '@/app/utils/eventTheme'
import { optimizeImageFile } from '@/app/utils/optimizeImageFile'
import { useEventTheme } from '@/hooks/useEventTheme'
import { useBrandingImages } from '@/hooks/useBrandingImages'
import {
  modalOverlayClass,
  modalSheetClass,
} from '@/app/layout/mobileShellLayout'

type Props = {
  open: boolean
  onClose: () => void
}

export function EventThemePanel({ open, onClose }: Props) {
  const { themeId, saving, error, setTheme } = useEventTheme()
  const { images, setSlot, resetSlot, savingSlot } = useBrandingImages()
  const [localError, setLocalError] = useState<string | null>(null)
  const [busyAnterior, setBusyAnterior] = useState(false)
  const anteriorInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setLocalError(null)
      setBusyAnterior(false)
    }
  }, [open])

  if (!open) return null

  const anteriorSrc = images.anterior || defaultAnterior
  const busy = saving || busyAnterior || savingSlot === 'anterior'

  const handleAnterior = async (file: File | undefined) => {
    if (!file) return
    setLocalError(null)
    setBusyAnterior(true)
    try {
      const dataUrl = await optimizeImageFile(file, 700, 0.85, { forceJpeg: true })
      await setSlot('anterior', dataUrl)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'No se pudo procesar la imagen')
    } finally {
      setBusyAnterior(false)
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
            <h2 className="text-base font-black text-[#0d3b66]">Ajustes de fondo</h2>
            <p className="text-[11px] text-[#5b6483] font-semibold mt-0.5">
              Solo Fuecoco · elige el tipo de evento
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

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          <p className="text-[12px] text-[#5b6483] leading-relaxed">
            Al tocar un tipo de evento, el fondo de la portada cambia al instante para todos.
          </p>

          {(localError || error) && (
            <p className="text-[12px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              {localError || error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {EVENT_THEMES.map((theme) => {
              const selected = themeId === theme.id
              return (
                <button
                  key={theme.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void setTheme(theme.id)}
                  className={`relative overflow-hidden rounded-2xl border-2 text-left transition-all disabled:opacity-60 ${
                    selected
                      ? 'border-[#2563eb] ring-2 ring-[#2563eb]/25'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="relative aspect-[16/10] bg-slate-100">
                    <img
                      src={theme.image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      decoding="async"
                    />
                    {selected && (
                      <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#2563eb] text-white inline-flex items-center justify-center shadow">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <div className="px-2.5 py-2 bg-white">
                    <p className="text-[12px] font-black text-[#0d3b66] leading-tight">{theme.label}</p>
                    <p className="text-[10px] font-semibold text-[#64748b] mt-0.5">{theme.hint}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <section className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3 space-y-2">
            <div>
              <p className="text-sm font-black text-[#0d3b66]">Quedada anterior</p>
              <p className="text-[11px] text-[#64748b] font-semibold">
                Miniatura en la pantalla de registro
              </p>
            </div>
            <div className="relative w-full overflow-hidden rounded-xl bg-white border border-slate-200 aspect-square max-w-[140px] mx-auto">
              <img
                src={anteriorSrc}
                alt=""
                className="absolute inset-0 w-full h-full object-contain p-2"
                decoding="async"
              />
            </div>
            <input
              ref={anteriorInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                void handleAnterior(file)
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => anteriorInputRef.current?.click()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0d3b66] text-white text-sm font-black py-2.5 disabled:opacity-60"
              >
                <Upload className="w-4 h-4" />
                {busyAnterior ? 'Subiendo…' : 'Cambiar'}
              </button>
              <button
                type="button"
                disabled={busy || !images.anterior}
                onClick={() => void resetSlot('anterior')}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-[#0d3b66] text-sm font-bold px-3 py-2.5 disabled:opacity-40"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
            </div>
          </section>
        </div>

        <div className="px-4 py-3 border-t border-slate-100">
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
