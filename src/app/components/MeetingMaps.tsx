import { MapPin, ExternalLink, Navigation } from 'lucide-react'
import { meetingPoints } from '@/app/data/meetingPoints'

function googleEmbedUrl(lat: number, lng: number): string {
  const q = encodeURIComponent(`${lat},${lng}`)
  return `https://maps.google.com/maps?q=${q}&z=16&output=embed`
}

export function MeetingMaps() {
  return (
    <div className="space-y-4">
      <div className="text-center mb-1">
        <h2 className="text-[1rem] font-black text-[#0d3b66] uppercase tracking-wide">
          Puntos de reunión
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Zonas asociadas a la comunidad
        </p>
      </div>

      <div className="space-y-3">
        {meetingPoints.map((point) => (
          <article
            key={point.id}
            className={`rounded-2xl overflow-hidden border-2 transition-shadow ${
              point.isMain
                ? 'border-[#2dd4bf] shadow-md shadow-[#2dd4bf]/10 bg-white'
                : 'border-slate-200 shadow-sm'
            }`}
          >
            <div className="relative w-full h-[168px] bg-slate-100">
              <iframe
                title={`Mapa de ${point.name}`}
                src={googleEmbedUrl(point.lat, point.lng)}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              {point.isMain && (
                <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2dd4bf] text-white shadow">
                  Principal
                </span>
              )}
            </div>

            <div className="p-3.5 bg-white">
              <div className="flex items-start gap-2.5">
                <div
                  className={`shrink-0 p-2 rounded-xl mt-0.5 ${
                    point.isMain ? 'bg-[#2dd4bf] text-white' : 'bg-slate-100 text-[#0d3b66]'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-[#0d3b66] text-[14px] leading-tight">{point.name}</h3>
                  <p className="text-[11px] font-semibold text-[#2dd4bf] mt-0.5">{point.area}</p>
                  <p className="text-[12px] text-slate-600 mt-1.5 leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>

              <a
                href={point.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#0d3b66] text-white font-bold text-[12px] hover:bg-[#0d3b66]/90 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                Abrir en Google Maps
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
