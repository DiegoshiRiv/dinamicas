import { X, ExternalLink } from 'lucide-react'
import { CAMPFIRE_JOIN_LABEL, CAMPFIRE_JOIN_URL } from '@/app/data/communityLinks'
import campfireIcon from '@/assets/recursos/campfire.png'
import { modalOverlayClass, modalSheetWhiteClass } from '@/app/layout/mobileShellLayout'

const FAQ_ITEMS = [
  {
    q: '¿El SelloDex tiene costo?',
    a: 'No, es gratis y se te regala en los eventos.',
  },
  {
    q: '¿Dónde consigo mi Sello Dex?',
    a: 'Puedes pedirlo con los organizadores.',
  },
  {
    q: '¿Qué es el Sello Dex?',
    a: 'El Sello Dex es un pasaporte de sellos. En determinados eventos se coloca un sello.',
  },
  {
    q: '¿Si me pierdo un sello, puedo recuperarlo?',
    a: 'Sí, se puede. Con tu registro en Campfire se guarda tu historial de asistencia.',
  },
  {
    q: '¿Cómo me uno al Campfire de la comunidad?',
    a: null,
    link: { href: CAMPFIRE_JOIN_URL, label: CAMPFIRE_JOIN_LABEL },
  },
  {
    q: '¿Para qué sirven los sellos?',
    a: 'A final de año se hará una dinámica especial.',
  },
 
] as const

interface FaqPanelProps {
  open: boolean
  onClose: () => void
}

export function FaqPanel({ open, onClose }: FaqPanelProps) {
  if (!open) return null

  return (
    <div className={modalOverlayClass} onClick={onClose} role="presentation">
      <div
        className={`relative ${modalSheetWhiteClass} flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 sm:zoom-in-95 max-h-[min(var(--modal-sheet-max-h),40rem)]`}
        role="dialog"
        aria-labelledby="faq-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 id="faq-title" className="text-lg font-black text-[#0d3b66]">
            Preguntas frecuentes
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 sm:py-4 space-y-3 modal-sheet-body">
          {FAQ_ITEMS.map((item) => (
            <article key={item.q} className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-4">
              <h3 className="text-sm font-black text-[#0d3b66] leading-snug">{item.q}</h3>
              {'link' in item && item.link ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Entra a la comunidad oficial desde la app Campfire:
                  </p>
                  <a
                    href={item.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-2xl border border-orange-200/80 bg-gradient-to-br from-[#fff7ed] via-white to-[#ffedd5] p-3.5 shadow-sm hover:shadow-md hover:border-orange-300 transition-all active:scale-[0.99]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-orange-100 shadow-inner overflow-hidden">
                      <img src={campfireIcon} alt="" className="h-10 w-10 object-contain" />
                    </span>
                    <span className="flex-1 min-w-0 text-left">
                      <span className="block text-[13px] font-black text-[#9a3412] leading-snug">
                        {item.link.label}
                      </span>
                      <span className="block text-[11px] font-semibold text-orange-600/90 mt-0.5">
                        Toca para abrir en Campfire
                      </span>
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f97316] text-white shadow-md group-hover:bg-[#ea580c] transition-colors">
                      <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
                    </span>
                  </a>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.a}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
