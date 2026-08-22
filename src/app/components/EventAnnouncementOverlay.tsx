import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type Announcement = { src: string; alt: string }

type Props = {
  open: boolean
  onDismiss: () => void
}

/** Anuncio a pantalla completa; las imágenes se cargan solo al abrir. */
export function EventAnnouncementOverlay({ open, onDismiss }: Props) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void Promise.all([
      import('@/assets/anuncio.jpg'),
      import('@/assets/barbatacoanuncio.png'),
    ]).then(([a, b]) => {
      if (cancelled) return
      const options: Announcement[] = [
        { src: a.default, alt: 'Anuncio Super Megaincursiones' },
        { src: b.default, alt: 'Anuncio Barbataco Parque Morelos' },
      ]
      setAnnouncement(options[Math.floor(Math.random() * options.length)]!)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Anuncio del evento"
    >
      <div className="relative w-full max-w-md max-h-[92dvh]">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute -top-2 -right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0d3b66] shadow-lg border-2 border-[#0d3b66] active:scale-95"
          aria-label="Cerrar anuncio"
        >
          <X className="h-5 w-5" strokeWidth={2.75} />
        </button>
        {announcement ? (
          <img
            src={announcement.src}
            alt={announcement.alt}
            className="w-full max-h-[92dvh] object-contain rounded-2xl shadow-2xl select-none"
            draggable={false}
          />
        ) : (
          <div className="w-full aspect-[3/4] rounded-2xl bg-[#0d3b66]/20 animate-pulse" />
        )}
      </div>
    </div>
  )
}
