import { useState, useEffect, useRef } from 'react'
import { User, AlertCircle, CheckCircle2 } from 'lucide-react'

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
import { ScreenNameNotice } from '@/app/components/ScreenNameNotice'

/**
 * Presupuesto para que el alta termine en segundo plano, con margen para los
 * reintentos del hook. La persona no espera: la confirmación es inmediata.
 */
const REGISTER_TIMEOUT_MS = 15000

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
  const inputRef = useRef<HTMLInputElement>(null)
  const whatsappFollowers = useWhatsAppFollowers()
  const submittingRef = useRef(false)
  const [registeredAs, setRegisteredAs] = useState('')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingRef.current) return
    setError('')
    setSuccess(false)

    if (!username.trim()) return setError('Escribe tu nombre de usuario')

    const typedUsername = username.trim()
    submittingRef.current = true
    const timer = eventLog.timed('register', 'submit')

    // Confirmación inmediata: el INSERT viaja en segundo plano y solo se revierte
    // si el servidor rechaza de verdad (p. ej. el nombre ya está tomado).
    setRegisteredAs(typedUsername)
    setSuccess(true)
    setUsername('')
    setTimeout(() => inputRef.current?.focus(), 100)

    const revert = (message: string) => {
      setSuccess(false)
      setRegisteredAs('')
      setUsername(typedUsername)
      setError(message)
    }

    const finish = async () => {
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
        onRegistered?.()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al registrar'

        // El nombre es de otra persona: es el único caso que invalida el registro.
        if (/nombre de entrenador/i.test(message) && !isAdmin) {
          timer.fail(err)
          revert(message)
          return
        }

        if (/ya está registrado|ya registrado|un registro por persona/i.test(message) && !isAdmin) {
          timer.end({ ok: true, idempotentMessage: true })
          onRegistered?.()
          return
        }

        // Cualquier otro fallo: confirmar contra el servidor por token de dispositivo.
        if (!isAdmin && verifyRegistration) {
          try {
            if (await verifyRegistration()) {
              timer.end({ ok: true, recoveredAfterTimeout: true })
              onRegistered?.()
              return
            }
          } catch {
            /* cae al revert */
          }
        }

        timer.fail(err)
        revert(message)
      } finally {
        submittingRef.current = false
      }
    }

    void finish()
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
      {isAdmin ? (
        <p className="text-[13px] text-[#0d3b66]/85 text-center mt-2 mb-5 leading-relaxed px-1">
          Estás en modo admin, puedes añadir a cualquier persona.
        </p>
      ) : (
        <ScreenNameNotice className="mt-2 mb-5" />
      )}

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
          className="w-full py-4 rounded-xl font-black text-white text-[15px] btn-register-gradient transition-all"
        >
          {isAdmin ? 'Ayudar a registrarse' : 'Registrarse en la Dinámica'}
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

    </>
  )
}