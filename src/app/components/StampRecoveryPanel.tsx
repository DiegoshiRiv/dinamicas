import { useEffect, useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { STAMP_RECOVERY_LINKS } from '@/app/data/stampRecovery'
import registradoImg from '@/assets/capturas de pantalla/registrado.png'
import sellodexImg from '@/assets/recursos/sellodex.png'
import {
  modalDialogSmClass,
  modalOverlayClass,
  modalOverlayNestedClass,
  modalSheetWhiteClass,
} from '@/app/layout/mobileShellLayout'

interface StampRecoveryPanelProps {
  open: boolean
  onClose: () => void
}

function StampRecoveryCard({
  title,
  url,
  image,
}: {
  title: string
  url: string
  image?: string
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center gap-2 rounded-2xl border border-[#0d3b66]/10 bg-white p-3 shadow-sm hover:shadow-md hover:border-[#2563eb]/50 transition-all active:scale-[0.98]"
    >
      <div className="relative">
        {image ? (
          <img
            src={image}
            alt=""
            className="w-[4.75rem] h-[4.75rem] rounded-full object-cover border-[3px] border-[#e8f4fc] shadow-md group-hover:border-[#2563eb] transition-colors"
          />
        ) : (
          <span className="flex w-[4.75rem] h-[4.75rem] items-center justify-center rounded-full border-[3px] border-[#e8f4fc] bg-gradient-to-br from-[#e8f4fc] to-[#bfdbfe] shadow-md group-hover:border-[#2563eb] transition-colors">
            <img src={sellodexImg} alt="" className="w-9 h-9 object-contain opacity-80" />
          </span>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#2563eb] text-white shadow group-hover:bg-[#1d4ed8] transition-colors">
          <ExternalLink className="w-3 h-3" strokeWidth={2.5} />
        </span>
      </div>
      <p className="text-[11px] font-bold text-[#0d3b66] text-center leading-snug line-clamp-3">{title}</p>
    </a>
  )
}

export function StampRecoveryPanel({ open, onClose }: StampRecoveryPanelProps) {
  const [showRegistrado, setShowRegistrado] = useState(false)

  useEffect(() => {
    if (!open) setShowRegistrado(false)
  }, [open])

  if (!open) return null

  return (
    <div className={modalOverlayClass} onClick={onClose} role="presentation">
      <div
        className={`relative ${modalSheetWhiteClass} flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 sm:zoom-in-95 max-h-[min(var(--modal-sheet-max-h),44rem)]`}
        role="dialog"
        aria-labelledby="stamp-recovery-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 id="stamp-recovery-title" className="text-lg font-black text-[#0d3b66]">
            Recuperar sellos
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
          <p className="text-[13px] text-[#0d3b66]/80 leading-relaxed">
            Solo se te pondrá el sello si está registrada tu{' '}
            <button
              type="button"
              onClick={() => setShowRegistrado(true)}
              className="font-bold text-[#0d3b66] underline decoration-[#2563eb] underline-offset-2 hover:text-[#2563eb] transition-colors"
            >
              asistencia en Campfire
            </button>
            .
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STAMP_RECOVERY_LINKS.map((item) => (
              <StampRecoveryCard
                key={item.id}
                title={item.title}
                url={item.url}
                image={item.image}
              />
            ))}
          </div>
        </div>
      </div>

      {showRegistrado && (
        <div
          className={modalOverlayNestedClass}
          onClick={() => setShowRegistrado(false)}
          role="presentation"
        >
          <div
            className={`${modalDialogSmClass} p-4 relative`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Ejemplo de asistencia registrada en Campfire"
          >
            <button
              type="button"
              onClick={() => setShowRegistrado(false)}
              className="absolute top-3 right-3 p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-600 z-10"
              aria-label="Cerrar ejemplo"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={registradoImg}
              alt="Asistencia registrada en Campfire"
              className="w-full h-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
