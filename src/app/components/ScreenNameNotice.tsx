import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import {
  modalOverlayClass,
  modalSheetClass,
} from '@/app/layout/mobileShellLayout'

/**
 * Recordatorio de llevar el nombre visible. Vive tanto bajo el formulario de
 * registro como bajo la ruleta del espectador, así que el modal de ejemplos
 * se comparte en lugar de duplicarse.
 */
export function ScreenNameNotice({ className = '' }: { className?: string }) {
  const [showExamples, setShowExamples] = useState(false)
  const [shots, setShots] = useState<{ pogo?: string; camf?: string }>({})

  useEffect(() => {
    if (!showExamples) return
    let cancelled = false
    void Promise.all([
      import('@/assets/capturas de pantalla/Pogo.webp'),
      import('@/assets/capturas de pantalla/Camf.webp'),
    ]).then(([pogo, camf]) => {
      if (!cancelled) setShots({ pogo: pogo.default, camf: camf.default })
    })
    return () => {
      cancelled = true
    }
  }, [showExamples])

  return (
    <>
      <p className={`text-[13px] text-[#0d3b66]/85 text-center leading-relaxed px-1 ${className}`}>
        Al ser mencionado debes tener tu nombre de usuario{' '}
        <button
          type="button"
          onClick={() => setShowExamples(true)}
          className="font-bold text-[#2563eb] underline-offset-2 hover:underline"
        >
          visible en pantalla
        </button>
        .
      </p>

      {showExamples && (
        <div className={modalOverlayClass} onClick={() => setShowExamples(false)}>
          <div
            className={`${modalSheetClass} bg-white p-4 sm:p-5 max-w-md w-full relative flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowExamples(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-600 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-center text-[#0d3b66] mb-2 pr-8">
              Ejemplos de pantalla
            </h3>
            <p className="text-center text-gray-600 mb-4 text-sm">
              Asegúrate de mostrar tu perfil así cuando ganes.
            </p>

            <div className="overflow-y-auto grid grid-cols-2 gap-3 flex-1">
              <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                <div className="min-h-[140px] flex items-center justify-center p-1">
                  {shots.pogo ? (
                    <img src={shots.pogo} alt="Pokémon GO" className="w-full h-auto object-contain" loading="lazy" />
                  ) : (
                    <span className="text-[11px] font-semibold text-gray-400">Cargando…</span>
                  )}
                </div>
                <span className="block py-2 text-center text-[10px] font-bold text-gray-500 uppercase">
                  Pokémon GO
                </span>
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                <div className="min-h-[140px] flex items-center justify-center p-1">
                  {shots.camf ? (
                    <img src={shots.camf} alt="Campfire" className="w-full h-auto object-contain" loading="lazy" />
                  ) : (
                    <span className="text-[11px] font-semibold text-gray-400">Cargando…</span>
                  )}
                </div>
                <span className="block py-2 text-center text-[10px] font-bold text-gray-500 uppercase">
                  Campfire
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowExamples(false)}
              className="w-full mt-4 py-4 rounded-full font-bold text-white btn-register-gradient"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}
