import { useState, useEffect, useRef } from 'react'
import { User, AlertCircle, CheckCircle2, X } from 'lucide-react'

import pokebolaImg from '@/assets/iconos/Pokebola.webp'
import campfireIcon from '@/assets/recursos/campfire.webp'
import wpIcon from '@/assets/iconos/w.webp'
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
import { eventLog } from '@/app/utils/eventLog'
import {
  modalOverlayClass,
  modalSheetClass,
} from '@/app/layout/mobileShellLayout'

/** Timeout corto: el INSERT es un solo round-trip. */
const REGISTER_TIMEOUT_MS = 6000

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
  saveRegistration: (username: string, ip: string, isAdminBypass?: boolean) => Promise<void>
  /** Tras timeout: confirma por token de dispositivo. */
  verifyRegistration?: () => Promise<boolean>
  isAdmin?: boolean
  sponsorBanners?: Banner[]
  /** Usuario ya tiene registro activo en esta ronda. */
  alreadyRegistered?: boolean
  onViewRoulette?: () => void
  onRegistered?: () => void
}

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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [exampleShotUrls, setExampleShotUrls] = useState<{ pogo?: string; camf?: string }>({})

  const inputRef = useRef<HTMLInputElement>(null)
  const whatsappFollowers = useWhatsAppFollowers()
  const submittingRef = useRef(false)
  const [registeredAs, setRegisteredAs] = useState('')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!showExamples) return
    let cancelled = false
    void Promise.all([
      import('@/assets/capturas de pantalla/Pogo.webp'),
      import('@/assets/capturas de pantalla/Camf.webp'),
    ]).then(([pogo, camf]) => {
      if (!cancelled) {
        setExampleShotUrls({ pogo: pogo.default, camf: camf.default })
      }
    })
    return () => {
      cancelled = true
    }
  }, [showExamples])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingRef.current) return
    setError('')
    setSuccess(false)

    if (!username.trim()) return setError('Escribe tu nombre de usuario')

    const typedUsername = username.trim()
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
      setRegisteredAs(typedUsername)
      setSuccess(true)
      setUsername('')
      onRegistered?.()
      setTimeout(() => inputRef.current?.focus(), 100)
    }

    try {
      const save = isAdmin
        ? saveRegistration(typedUsername, 'admin', true)
        : saveRegistration(typedUsername, '', false)

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

      if (isTimeout && !isAdmin && verifyRegistration) {
        try {
          const confirmed = await verifyRegistration()
          if (confirmed) {
            timer.end({ ok: true, recoveredAfterTimeout: true })
            markSuccess()
            return
          }
        } catch {
          // sigue al error visible
        }
      }

      if (/ya está registrado|ya registrado|un registro por persona/i.test(message) && !isAdmin) {
        // Nombre tomado → mostrar error claro; no fingir éxito.
        if (/nombre de entrenador/i.test(message)) {
          timer.fail(err)
          setError(message)
          return
        }
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

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-800 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {registeredAs
              ? `¡Registrado como ${registeredAs}! Buena suerte.`
              : '¡Registro completado, buena suerte!'}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-black text-white text-[15px] btn-register-gradient transition-all disabled:opacity-60 disabled:shadow-none"
        >
          {loading
            ? 'Registrando...'
            : isAdmin
              ? 'Ayudar a registrarse'
              : 'Registrarse en la Dinámica'}
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

          <div className="flex items-center gap-3 rounded-[15px] border border-[#0d3b66]/10 bg-white p-3.5 shadow-sm">
            <p className="flex-1 text-[13px] font-bold text-[#0d3b66] leading-snug">
              En la quedada anterior se reunieron{' '}
              <AnimatedCounter value={PREVIOUS_MEETUP_TRAINERS} /> entrenadores
            </p>
            <div className="w-20 h-20 shrink-0 flex items-center justify-center overflow-hidden rounded-xl bg-[#0d3b66]/5 p-3">
              <img
                src={pokebolaImg}
                alt=""
                className="max-w-full max-h-full object-contain"
                decoding="async"
                loading="lazy"
                aria-hidden
              />
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
                <div className="min-h-[140px] flex items-center justify-center p-1">
                  {exampleShotUrls.pogo ? (
                    <img src={exampleShotUrls.pogo} alt="Pokémon GO" className="w-full h-auto object-contain" loading="lazy" />
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
                  {exampleShotUrls.camf ? (
                    <img src={exampleShotUrls.camf} alt="Campfire" className="w-full h-auto object-contain" loading="lazy" />
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