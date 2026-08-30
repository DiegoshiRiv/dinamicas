import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ExternalLink, MapPin, X } from 'lucide-react'
import { type EventBannerConfig, type BannerPerk } from '@/app/data/eventBanners'
import { FONDO_CD_DYNAMIC } from '@/app/utils/alternatingFondoCd'
import { useFondoCdUrl } from '@/hooks/useFondoCdUrl'
import sellodexImg from '@/assets/recursos/sellodex.webp'
import { CAMPFIRE_JOIN_URL } from '@/app/data/communityLinks'
import {
  modalOverlayClass,
  modalSheetBodyClass,
  modalSheetLightFlexClass,
} from '@/app/layout/mobileShellLayout'

function PerkTile({ perk, accent }: { perk: BannerPerk; accent: string }) {
  return (
    <div
      className="relative flex items-center gap-2 rounded-xl p-2 border min-h-[48px] w-full text-left bg-white shadow-sm"
      style={{ borderColor: `${accent}28` }}
    >
      <img src={perk.icon} alt="" className="w-9 h-9 object-contain shrink-0" loading="lazy" />
      <span className="text-[10px] font-bold leading-snug flex-1 pr-1 text-[#0d3b66]">
        {perk.label}
      </span>
    </div>
  )
}

function EventBannerCard({ config }: { config: EventBannerConfig }) {
  const fondoCdUrl = useFondoCdUrl()
  const bannerSrc =
    config.banner === FONDO_CD_DYNAMIC ? (fondoCdUrl ?? config.banner) : config.banner
  const isSelloDex =
    config.selloDex === true ||
    config.subtitle?.includes('SelloDex') ||
    config.badge === 'Día de la Comunidad'
  const scheduleColor = config.scheduleColor ?? '#2563eb'
  const photoHero = config.photoHero === true
  const hasDualHero = Boolean(config.heroImage && config.heroImageSecondary)

  return (
    <article className="rounded-2xl overflow-hidden border border-[#0d3b66]/10 shadow-lg bg-white">
      <div className="relative h-36 sm:h-44">
        <img
          src={bannerSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {!photoHero && (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${config.accent}ee 0%, ${config.accent}60 45%, ${config.accent}22 100%)`,
            }}
          />
        )}
        {hasDualHero ? (
          <div className="absolute bottom-0 right-0 z-[5] flex h-full w-[62%] items-end justify-end pointer-events-none pr-0.5">
            {config.heroImageSecondary && (
              <img
                src={config.heroImageSecondary}
                alt=""
                className="h-[74%] max-w-[46%] object-contain object-bottom drop-shadow-lg -mr-6 sm:-mr-8"
                loading="lazy"
              />
            )}
            {config.heroImage && (
              <img
                src={config.heroImage}
                alt=""
                className="h-[90%] max-w-[52%] object-contain object-bottom drop-shadow-lg relative z-10"
                loading="lazy"
              />
            )}
          </div>
        ) : (
          config.heroImage && (
            <img
              src={config.heroImage}
              alt=""
              className={`absolute bottom-0 right-2 z-[5] object-contain object-bottom drop-shadow-lg ${
                photoHero ? 'h-14 w-14 sm:h-16 sm:w-16' : 'h-[88%] max-w-[48%]'
              }`}
              loading="lazy"
            />
          )
        )}
        <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1.5">
          {config.badge && config.badge !== 'Día de la Comunidad' && (
            <span className="text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/95 text-[#0d3b66] shadow">
              {config.badge}
            </span>
          )}
          {isSelloDex && (
            <span
              className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white shadow"
              style={{ backgroundColor: config.selloDexBadgeColor ?? '#2563eb' }}
            >
              <img src={sellodexImg} alt="" className="w-3.5 h-3.5 object-contain" />
              SELLODEX
            </span>
          )}
        </div>
        <div className="absolute bottom-2.5 left-3 z-10 right-[38%]">
          {config.subtitle && (
            <p className="text-[10px] font-bold text-white/90 uppercase tracking-wide">
              {config.subtitle}
            </p>
          )}
          <h3 className="text-[15px] sm:text-[17px] font-black text-white leading-tight drop-shadow">
            {config.title}
          </h3>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-2.5">
        {config.badge !== 'Día de la Comunidad' && (
          <p className="text-[12px] font-black leading-snug" style={{ color: scheduleColor }}>
            {config.schedule}
          </p>
        )}
        <p className="text-[13px] text-[#0d3b66]/90 leading-relaxed font-medium">
          {config.description}
        </p>

        {config.perks && config.perks.length > 0 && (
          <div className="grid grid-cols-2 gap-2 p-0.5 rounded-2xl bg-[#e8f4fc]/50">
            {config.perks.map((perk) => (
              <PerkTile key={perk.label} perk={perk} accent={config.accent} />
            ))}
          </div>
        )}

        {config.footerNote && (
          <p className="text-[11px] font-bold text-[#0d3b66]/70 bg-slate-50 rounded-lg px-3 py-2">
            {config.footerNote}
          </p>
        )}

        {isSelloDex && (
          <a
            href={CAMPFIRE_JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-white text-sm bg-[#f97316] hover:opacity-95"
          >
            Registro en Campfire
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {config.mapsUrl && config.locationName && (
          <a
            href={config.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-[#0d3b66]/10 p-3 hover:border-teal-500 transition-colors"
          >
            <MapPin className="w-4 h-4 text-[#2563eb] shrink-0" />
            <span className="text-[12px] font-bold text-[#0d3b66]">{config.locationName}</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 ml-auto shrink-0" />
          </a>
        )}
      </div>
    </article>
  )
}

export function EventDayInfographicModal({
  day,
  banners,
  onClose,
  onCommunityDetail,
}: {
  day: Date
  banners: EventBannerConfig[]
  initialPage?: number
  onClose: () => void
  onCommunityDetail?: (communityEventId: string) => void
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return createPortal(
    <div className={modalOverlayClass} onClick={onClose}>
      <div
        className={modalSheetLightFlexClass}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="shrink-0 z-20 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#f0f7fc]/95 backdrop-blur border-b border-[#0d3b66]/10">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase text-[#2563eb] tracking-wide">
              {banners.length === 1 ? 'Evento' : `${banners.length} eventos`}
            </p>
            <h2 className="text-[14px] font-black text-[#0d3b66] leading-snug uppercase">
              {banners.length === 1
                ? banners[0]?.schedule ?? format(day, "EEEE d 'de' MMMM", { locale: es })
                : format(day, "EEEE d 'de' MMMM yyyy", { locale: es })}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white shadow text-gray-600 hover:bg-gray-50"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`${modalSheetBodyClass} flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 sm:space-y-4 pb-6`}
        >
          {banners.map((config) => (
            <div key={config.id}>
              {config.id.startsWith('community-') && onCommunityDetail ? (
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onCommunityDetail(config.id.replace('community-', ''))}
                >
                  <EventBannerCard config={config} />
                  <p className="text-[10px] font-bold text-[#2563eb] text-center mt-1">
                    Toca para más detalles del evento
                  </p>
                </button>
              ) : (
                <EventBannerCard config={config} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function formatGoEventSchedule(event: { startDate: string; endDate: string }): string {
  const start = parseISO(event.startDate)
  const end = parseISO(event.endDate)
  if (event.startDate === event.endDate) {
    return format(start, "EEEE d 'de' MMMM yyyy", { locale: es })
  }
  return `Del ${format(start, "d 'de' MMMM", { locale: es })} al ${format(end, "d 'de' MMMM yyyy", { locale: es })}`
}

export function formatCommunitySchedule(startsAt: string, endsAt: string): string {
  const start = parseISO(startsAt)
  const end = parseISO(endsAt)
  const sameDay = format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')
  if (sameDay) {
    return `${format(start, "EEEE d 'de' MMMM yyyy", { locale: es })} · ${format(start, 'HH:mm', { locale: es })} – ${format(end, 'HH:mm', { locale: es })}`
  }
  return `Del ${format(start, "d 'de' MMMM", { locale: es })} al ${format(end, "d 'de' MMMM yyyy", { locale: es })}`
}
