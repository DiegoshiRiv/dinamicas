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
import { useClientIp } from '@/app/hooks/useClientIp'
import { eventLog } from '@/app/utils/eventLog'
import {
  modalOverlayClass,
  modalSheetClass,
} from '@/app/layout/mobileShellLayout'

const REGISTER_TIMEOUT_MS = 12000

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let settled = false
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error(message))
    }, ms)
    promise.then(
      (value) => {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        reject(err)
      },
    )
  })
}

interface RegistrationFormProps {
  saveRegistration: (username: string, team: string, ip: string, isAdminBypass?: boolean) => Promise<void>
  /** Tras timeout: comprueba si el INSERT tardío sí quedó. */
  verifyRegistration?: (ip: string) => Promise<boolean>
  isAdmin?: boolean
  sponsorBanners?: Banner[]
  /** Usuario ya tiene registro activo en esta ronda. */
  alreadyRegistered?: boolean
  onViewRoulette?: () => void
  onRegistered?: () => void
}

type Team = 'blue' | 'yellow' | 'red'

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
  verifyRegistration,
  isAdmin = false,
  sponsorBanners = [],
  alreadyRegistered = false,
  onViewRoulette,
  onRegistered,
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
  const { ip: clientIp, ready: ipReady, failed: ipFailed, retry: retryIp } = useClientIp()
  const submittingRef = useRef(false)
  const [retryingIp, setRetryingIp] = useState(false)

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
          void import('@/assets/pokemon gif/megamewtwox.gif').then((mod) => setAnteriorGifUrl(mod.default))
          observer.disconnect()
        }
      },
      { rootMargin: '120px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isAdmin])

  const handleRetryIp = async () => {
    if (retryingIp) return
    setError('')
    setRetryingIp(true)
    try {
      await retryIp()
    } catch {
      setError('No pudimos verificar tu conexión. Revisa tu red e intenta de nuevo.')
    } finally {
      setRetryingIp(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingRef.current) return
    setError('')
    setSuccess(false)

    if (!username.trim()) return setError('Escribe tu nombre de usuario')
    if (!team) return setError('Selecciona un equipo')

    if (!isAdmin) {
      if (ipFailed) {
        return setError('No pudimos verificar tu conexión. Pulsa "Reintentar conexión".')
      }
      if (!clientIp) {
        return setError('Preparando conexión, intenta de nuevo en un segundo.')
      }
    }

    submittingRef.current = true
    setLoading(true)
    const timer = eventLog.timed('register', 'submit')
    const hardStop = window.setTimeout(() => {
      if (submittingRef.current) {
        submittingRef.current = false
        setLoading(false)
        setError('La conexión tardó demasiado. Revisa tu red e intenta de nuevo.')
        timer.fail(new Error('hardStop'))
      }
    }, REGISTER_TIMEOUT_MS + 1500)

    const markSuccess = () => {
      setSuccess(true)
      setUsername('')
      setTeam('')
      onRegistered?.()
      setTimeout(() => inputRef.current?.focus(), 100)
    }

    try {
      const save = isAdmin
        ? saveRegistration(username.trim(), team, 'admin-ip', true)
        : saveRegistration(username.trim(), team, clientIp!, false)

      await withTimeout(
        save,
        REGISTER_TIMEOUT_MS,
        'La conexión tardó demasiado. Revisa tu red e intenta de nuevo.',
      )

      timer.end({ ok: true })
      markSuccess()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar'
      const isTimeout = /tardó demasiado/i.test(message)

      // Timeout ≠ fallo seguro: el INSERT pudo completar después. Verifica por IP.
      if (isTimeout && !isAdmin && clientIp && verifyRegistration) {
        try {
          const confirmed = await verifyRegistration(clientIp)
          if (confirmed) {
            timer.end({ ok: true, recoveredAfterTimeout: true })
            markSuccess()
            return
          }
        } catch {
          // sigue al error visible
        }
      }

      // Idempotencia: si el UNIQUE ya tenía el registro, el hook lo trata como OK;
      // si llega mensaje legacy, también mostrar éxito.
      if (/ya registrado|un registro por persona/i.test(message) && !isAdmin) {
        timer.end({ ok: true, idempotentMessage: true })
        markSuccess()
        return
      }

      timer.fail(err)
      setError(message)
    } finally {
      window.clearTimeout(hardStop)
      setLoading(false)
      submittingRef.current = false
    }
  }

  return (
    <>
      <h1 className="text-[1.05rem] font-black text-[#0d3b66] uppercase tracking-tight text-center leading-snug">
        {isAdmin
          ? 'Registrar persona'
          : alreadyRegistered
            ? 'Ya estás en la dinámica'
            : 'Registrarse en la dinámica'}
      </h1>

      {!isAdmin && alreadyRegistered ? (
        <div className="mt-4 mb-6 space-y-4 text-center">
          <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-4">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-600" />
            <p className="text-sm font-bold text-[#166534] leading-relaxed">
              Tu registro ya quedó. Cuando empiece el sorteo, mira la ruleta en vivo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onViewRoulette?.()}
            className="w-full rounded-2xl bg-[#0d3b66] py-4 text-base font-black text-white shadow-lg active:scale-[0.99]"
          >
            Ver la ruleta
          </button>
        </div>
      ) : (
        <>
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
          disabled={loading || retryingIp || (!isAdmin && (!ipReady || ipFailed))}
          className="w-full py-4 rounded-xl font-black text-white text-[15px] btn-register-gradient transition-all disabled:opacity-60 disabled:shadow-none"
        >
          {loading
            ? 'Registrando...'
            : !isAdmin && ipFailed
              ? 'Error de conexión'
              : !isAdmin && !ipReady
                ? 'Preparando...'
                : isAdmin
                  ? 'Ayudar a registrarse'
                  : 'Registrarse en la Dinámica'}
        </button>

        {!isAdmin && ipFailed && (
          <button
            type="button"
            onClick={() => void handleRetryIp()}
            disabled={retryingIp}
            className="w-full py-3 rounded-xl font-bold text-[#0d3b66] text-sm border border-[#0d3b66]/20 bg-white hover:bg-[#0d3b66]/5 transition-all disabled:opacity-60"
          >
            {retryingIp ? 'Reintentando...' : 'Reintentar conexión'}
          </button>
        )}
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
            <div className="w-20 h-20 shrink-0 flex items-center justify-center overflow-hidden rounded-xl bg-[#0d3b66]/5">
              {anteriorGifUrl ? (
                <img
                  src={anteriorGifUrl}
                  alt="Pokémon de la quedada anterior"
                  className="max-w-full max-h-full w-full h-full object-contain"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full" aria-hidden />
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
        </>
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