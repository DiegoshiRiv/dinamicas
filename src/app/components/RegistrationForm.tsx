import { useState, useEffect, useRef } from 'react'
import { User, AlertCircle, CheckCircle2, X } from 'lucide-react'

import moltres from '@/assets/iconos/moltres.png'
import zapdos from '@/assets/iconos/zapdos.png'
import articuno from '@/assets/iconos/articuno.png'
import pokebolaImg from '@/assets/iconos/Pokebola.png'
import pogoImg from '@/assets/capturas de pantalla/Pogo.jpg'
import camfImg from '@/assets/capturas de pantalla/Camf.jpg'
import campfireIcon from '@/assets/recursos/campfire.png'
import wpIcon from '@/assets/iconos/w.png'
import {
  CAMPFIRE_JOIN_URL,
  WHATSAPP_CHANNEL_URL,
  CAMPFIRE_MEMBER_COUNT,
  PREVIOUS_MEETUP_TRAINERS,
} from '@/app/data/communityLinks'
import { AnimatedCounter } from '@/app/components/AnimatedCounter'
import { SponsorBannerCarousel } from '@/app/components/SponsorBannerCarousel'
import type { Banner } from '@/hooks/useParticipants'
import { useWhatsAppFollowers } from '@/app/hooks/useWhatsAppFollowers'
import {
  modalOverlayClass,
  modalSheetClass,
} from '@/app/layout/mobileShellLayout'

interface RegistrationFormProps {
  saveRegistration: (username: string, team: string, ip: string, isAdminBypass?: boolean) => Promise<void>
  isAdmin?: boolean
  sponsorBanners?: Banner[]
}

type Team = 'blue' | 'yellow' | 'red'

const IP_LOOKUP_TIMEOUT_MS = 3500
const CLIENT_ID_STORAGE_KEY = 'registrationClientId'

function createFallbackClientId() {
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `client-${randomId}`
}

function getFallbackClientId() {
  if (typeof window === 'undefined') return createFallbackClientId()

  try {
    const existing = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY)
    if (existing) return existing

    const next = createFallbackClientId()
    window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, next)
    return next
  } catch {
    return createFallbackClientId()
  }
}

async function fetchRegistrationIdentifier() {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), IP_LOOKUP_TIMEOUT_MS)

  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) throw new Error('No se pudo obtener la IP')

    const data = (await response.json()) as { ip?: unknown }
    if (typeof data.ip === 'string' && data.ip.trim()) return data.ip.trim()

    throw new Error('Respuesta de IP invalida')
  } catch (error) {
    console.warn('No se pudo obtener la IP publica, usando identificador local.', error)
    return getFallbackClientId()
  } finally {
    window.clearTimeout(timeout)
  }
}

const teams: {
  value: Team
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
}[] = [
  {
    value: 'blue',
    label: 'Sabiduría',
    color: '#3b82f6',
    bgColor: '#3b82f6',
    borderColor: 'border-[#93bbfd]',
    icon: articuno,
  },
  {
    value: 'yellow',
    label: 'Instinto',
    color: '#eab308',
    bgColor: '#eab308',
    borderColor: 'border-[#fde047]',
    icon: zapdos,
  },
  {
    value: 'red',
    label: 'Valor',
    color: '#ef4444',
    bgColor: '#ef4444',
    borderColor: 'border-[#fca5a5]',
    icon: moltres,
  },
]

export function RegistrationForm({
  saveRegistration,
  isAdmin = false,
  sponsorBanners = [],
}: RegistrationFormProps) {
  const [username, setUsername] = useState('')
  const [team, setTeam] = useState<Team | ''>('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [anteriorGifUrl, setAnteriorGifUrl] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const anteriorSectionRef = useRef<HTMLDivElement>(null)
  const whatsappFollowers = useWhatsAppFollowers()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (isAdmin) return
    const el = anteriorSectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void import('@/assets/pokemon gif/anterior.gif').then((mod) => setAnteriorGifUrl(mod.default))
          observer.disconnect()
        }
      },
      { rootMargin: '120px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!username.trim()) return setError('Escribe tu nombre de usuario')
    if (!team) return setError('Selecciona un equipo')

    setLoading(true)
    try {
      if (isAdmin) {
        await saveRegistration(username.trim(), team, 'admin-ip', true)
      } else {
        const identifier = await fetchRegistrationIdentifier()
        await saveRegistration(username.trim(), team, identifier, false)
      }

      setSuccess(true)
      setUsername('')
      setTeam('')
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al registrar'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="text-[1.05rem] font-black text-[#0d3b66] uppercase tracking-tight text-center leading-snug">
        {isAdmin ? 'Registrar persona' : 'Registrarse en la dinámica'}
      </h1>

      <p className="text-[13px] text-[#0d3b66]/85 text-center mt-2 mb-5 leading-relaxed px-1">
        {isAdmin ? (
          'Estás en modo admin, puedes añadir a cualquier persona.'
        ) : (
          <>
            Al ser mencionado debes tener tu nombre de usuario{' '}
            <button
              type="button"
              onClick={() => setShowExamples(true)}
              className="font-bold text-[#2563eb] underline-offset-2 hover:underline"
            >
              visible en pantalla
            </button>
            .
          </>
        )}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="username"
            className="flex items-center gap-1.5 text-[11px] font-black text-[#0d3b66] uppercase tracking-wider"
          >
            <User className="w-4 h-4 text-[#2563eb]" strokeWidth={2.5} />
            Nombre de usuario
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 pointer-events-none" />
            <input
              ref={inputRef}
              id="username"
              type="text"
              placeholder="Ej: Pawmot923"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full pl-12 pr-4 py-3.5 rounded-[15px] border border-gray-200 bg-white text-[#0d3b66] font-medium placeholder:text-gray-300 focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all text-base"
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="flex items-center justify-center gap-2 text-sm font-bold text-[#0d3b66]">
            <span className="text-gray-300 font-normal">—</span>
            <span
              className="w-4 h-4 inline-block"
              style={{
                backgroundColor: 'currentColor',
                WebkitMask: `url(${pokebolaImg}) center / contain no-repeat`,
                mask: `url(${pokebolaImg}) center / contain no-repeat`,
              }}
              aria-hidden
            />
            <span>{isAdmin ? 'Selecciona su equipo' : 'Selecciona tu equipo'}</span>
            <span
              className="w-4 h-4 inline-block"
              style={{
                backgroundColor: 'currentColor',
                WebkitMask: `url(${pokebolaImg}) center / contain no-repeat`,
                mask: `url(${pokebolaImg}) center / contain no-repeat`,
              }}
              aria-hidden
            />
            <span className="text-gray-300 font-normal">—</span>
          </p>

          <div className="grid grid-cols-3 gap-3">
            {teams.map((t) => {
              const selected = team === t.value
              return (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setTeam(t.value)}
                  disabled={loading}
                  aria-pressed={selected}
                  className={`
                    rounded-[15px] border-2 flex flex-col items-center justify-center gap-1.5 py-3 px-1
                    transition-all duration-200
                    ${selected
                      ? 'scale-[1.04] shadow-lg'
                      : `${t.borderColor} bg-white hover:bg-gray-50/80`}
                  `}
                  style={selected ? { backgroundColor: t.bgColor, borderColor: t.bgColor } : undefined}
                >
                  <div
                    className={`w-12 h-12 sm:w-[3.25rem] sm:h-[3.25rem] transition-transform duration-200 ${
                      selected ? 'scale-110' : ''
                    }`}
                    style={{
                      backgroundColor: selected ? '#ffffff' : t.color,
                      WebkitMask: `url(${t.icon}) center / contain no-repeat`,
                      mask: `url(${t.icon}) center / contain no-repeat`,
                    }}
                    aria-hidden
                  />
                  <span
                    className={`text-[11px] font-black uppercase tracking-wide transition-colors duration-200 ${
                      selected ? 'text-white' : ''
                    }`}
                    style={!selected ? { color: t.color } : undefined}
                  >
                    {t.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-800 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            ¡Registro completado, buena suerte!
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-black text-white text-[15px] btn-register-gradient transition-all disabled:opacity-60 disabled:shadow-none"
        >
          {loading ? 'Registrando...' : isAdmin ? 'Ayudar a registrarse' : 'Registrarse en la Dinámica'}
        </button>
      </form>

      {!isAdmin && (
        <section className="mt-8 pt-6 border-t border-[#0d3b66]/10 space-y-4">
          <SponsorBannerCarousel banners={sponsorBanners} className="mb-4" />

          <a
            href={CAMPFIRE_JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-black text-white text-[15px] bg-[#f97316] shadow-md hover:opacity-95 active:scale-[0.98] transition-all"
          >
            <img src={campfireIcon} alt="" className="w-7 h-7 object-contain" aria-hidden />
            Únete a Campfire
          </a>

          <p className="text-center text-[13px] font-bold text-[#0d3b66]/90">
            Miembros actuales en Campfire{' '}
            <AnimatedCounter value={CAMPFIRE_MEMBER_COUNT} />
          </p>

          <div
            ref={anteriorSectionRef}
            className="flex items-center gap-3 rounded-[15px] border border-[#0d3b66]/10 bg-white p-3.5 shadow-sm"
          >
            <p className="flex-1 text-[13px] font-bold text-[#0d3b66] leading-snug">
              En la quedada anterior se reunieron{' '}
              <AnimatedCounter value={PREVIOUS_MEETUP_TRAINERS} /> entrenadores
            </p>
            <div className="w-20 h-20 shrink-0 flex items-center justify-center overflow-visible">
              {anteriorGifUrl ? (
                <img
                  src={anteriorGifUrl}
                  alt="Pokémon de la quedada anterior"
                  className="w-28 h-28 object-contain scale-125 origin-center"
                  decoding="async"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#0d3b66]/5" aria-hidden />
              )}
            </div>
          </div>

          <a
            href={WHATSAPP_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-black text-white text-[15px] bg-[#25D366] shadow-md hover:opacity-95 active:scale-[0.98] transition-all"
          >
            <img src={wpIcon} alt="" className="w-7 h-7 object-contain" aria-hidden />
            Únete al canal de WhatsApp
          </a>

          <p className="text-center text-[13px] font-bold text-[#0d3b66]/90">
            Seguidores en WhatsApp{' '}
            <AnimatedCounter value={whatsappFollowers} className="text-[#25D366] font-black" />
          </p>
        </section>
      )}

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
                <img src={pogoImg} alt="Pokémon GO" className="w-full h-auto object-contain" />
                <span className="block py-2 text-center text-[10px] font-bold text-gray-500 uppercase">
                  Pokémon GO
                </span>
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                <img src={camfImg} alt="Campfire" className="w-full h-auto object-contain" />
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