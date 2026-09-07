import { useState, useEffect, useRef } from 'react'
import { User, AlertCircle, CheckCircle2, Upload } from 'lucide-react'

import anteriorImg from '@/assets/anterior.webp'
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
import { registerFailureReason } from '@/app/utils/registerError'
import {
  clearLastRegisteredUsername,
  saveLastRegisteredUsername,
} from '@/app/utils/registrationToken'
import {
  PARTICIPANT_LIST_ACCEPT,
  parseParticipantListFile,
} from '@/app/utils/parseParticipantListFile'
/**
 * Presupuesto para el INSERT en segundo plano. La UI ya confirmó al instante:
 * este timeout solo decide cuándo dejar de esperar, nunca cuándo “des-registrar”.
 */
const REGISTER_TIMEOUT_MS = 20000
const VERIFY_TIMEOUT_MS = 4000
const BULK_CONCURRENCY = 4

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
  /** Solo Fuecoco: carga masiva desde archivo. */
  isSuperAdmin?: boolean
  sponsorBanners?: Banner[]
  /** Usuario ya tiene registro activo en esta ronda. */
  alreadyRegistered?: boolean
  onViewRoulette?: () => void
  onRegistered?: () => void
  /** Solo si el nombre ya estaba tomado: deshace el “ya registrado” optimista. */
  onRegisterFailed?: () => void
  rouletteCode?: string
}

export function RegistrationForm({
  saveRegistration,
  verifyRegistration,
  isAdmin = false,
  isSuperAdmin = false,
  sponsorBanners = [],
  alreadyRegistered = false,
  onViewRoulette,
  onRegistered,
  onRegisterFailed,
  rouletteCode = 'general',
}: RegistrationFormProps) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const bulkInputRef = useRef<HTMLInputElement>(null)
  const whatsappFollowers = useWhatsAppFollowers()
  const submittingRef = useRef(false)
  const [registeredAs, setRegisteredAs] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{
    done: number
    total: number
    ok: number
    skipped: number
    failed: number
  } | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleBulkFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !isSuperAdmin) return

    setError('')
    setSuccess(false)
    setBulkBusy(true)
    setBulkProgress({ done: 0, total: 0, ok: 0, skipped: 0, failed: 0 })

    try {
      const { names } = await parseParticipantListFile(file)
      if (names.length === 0) {
        setError('No se encontraron nombres en el archivo.')
        return
      }

      let ok = 0
      let skipped = 0
      let failed = 0
      let done = 0
      setBulkProgress({ done: 0, total: names.length, ok: 0, skipped: 0, failed: 0 })

      const queue = [...names]
      const workers = Array.from({ length: Math.min(BULK_CONCURRENCY, queue.length) }, async () => {
        while (queue.length > 0) {
          const name = queue.shift()
          if (!name) break
          try {
            await saveRegistration(name, 'admin', true)
            ok += 1
          } catch (err) {
            const reason = registerFailureReason(err)
            if (reason === 'username-taken' || reason === 'already-registered') skipped += 1
            else failed += 1
          } finally {
            done += 1
            setBulkProgress({ done, total: names.length, ok, skipped, failed })
          }
        }
      })
      await Promise.all(workers)

      const summary = `ok ${ok}` +
        (skipped > 0 ? ` · ya estaban ${skipped}` : '') +
        (failed > 0 ? ` · fallaron ${failed}` : '')
      setRegisteredAs(summary)
      setSuccess(ok > 0)
      if (ok < names.length) {
        setError(
          `De ${names.length} nombres del archivo: ${summary}. ` +
            (failed > 0 || skipped > 0
              ? 'Revisa el panel: solo cuentan los “ok” nuevos.'
              : ''),
        )
      } else {
        setError('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo.')
    } finally {
      setBulkBusy(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingRef.current || bulkBusy) return
    setError('')
    setSuccess(false)

    if (!username.trim()) return setError('Escribe tu nombre de usuario')
    if (username.trim().length > 40) return setError('El nombre es demasiado largo (máx. 40)')

    const typedUsername = username.trim()
    submittingRef.current = true
    setIsSubmitting(true)
    const timer = eventLog.timed('register', 'submit')

    setRegisteredAs(typedUsername)
    setSuccess(true)
    setUsername('')
    if (!isAdmin) {
      saveLastRegisteredUsername(rouletteCode, typedUsername)
      onRegistered?.()
    }
    setTimeout(() => inputRef.current?.focus(), 100)

    const revertTaken = (message: string) => {
      setSuccess(false)
      setRegisteredAs('')
      setUsername(typedUsername)
      setError(message)
      if (!isAdmin) {
        clearLastRegisteredUsername(rouletteCode)
        onRegisterFailed?.()
      }
    }

    const finish = async () => {
      try {
        const save = isAdmin
          ? saveRegistration(typedUsername, 'admin', true)
          : saveRegistration(typedUsername, '', false)

        await withTimeout(save, REGISTER_TIMEOUT_MS, 'network-slow')

        timer.end({ ok: true })
        if (isAdmin) onRegistered?.()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al registrar'
        const reason = registerFailureReason(err)
        const isSlow =
          message === 'network-slow' ||
          /tardó demasiado|Failed to fetch|network|timeout|abort/i.test(message)

        if (reason === 'username-taken' && !isAdmin) {
          timer.fail(err)
          revertTaken(message)
          return
        }

        if (reason === 'already-registered' && !isAdmin) {
          timer.end({ ok: true, idempotent: true })
          return
        }

        if (!isAdmin && verifyRegistration) {
          try {
            const ok = await withTimeout(verifyRegistration(), VERIFY_TIMEOUT_MS, 'verify-slow')
            if (ok) {
              timer.end({ ok: true, recoveredAfterTimeout: true })
              return
            }
          } catch {
            /* se mantiene el éxito optimista */
          }
        }

        if (isSlow || !isAdmin) {
          timer.end({ ok: true, deferred: true, reason: message })
          return
        }

        timer.fail(err)
        setError(message)
        setSuccess(false)
        setRegisteredAs('')
        setUsername(typedUsername)
      } finally {
        submittingRef.current = false
        setIsSubmitting(false)
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
              {registeredAs
                ? `Quedaste como ${registeredAs}. Cuando empiece el sorteo, mira la ruleta en vivo.`
                : 'Tu registro ya quedó. Cuando empiece el sorteo, mira la ruleta en vivo.'}
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
          {isAdmin && (
            <p className="text-[13px] text-[#0d3b66]/85 text-center mt-2 mb-5 leading-relaxed px-1">
              Estás en modo admin, puedes añadir a cualquier persona.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
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
                  maxLength={40}
                  autoComplete="username"
                  disabled={bulkBusy}
                  className="w-full pl-12 pr-4 py-3.5 rounded-[15px] border border-gray-200 bg-white text-[#0d3b66] font-medium placeholder:text-gray-300 focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all text-base disabled:opacity-60"
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
              disabled={(isSubmitting && isAdmin) || bulkBusy}
              className="w-full py-4 rounded-xl font-black text-white text-[15px] btn-register-gradient transition-all disabled:opacity-70"
            >
              {isAdmin
                ? isSubmitting
                  ? 'Registrando…'
                  : 'Ayudar a registrarse'
                : 'Registrarse en la Dinámica'}
            </button>
          </form>

          {isSuperAdmin && (
            <section className="mt-4 rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Upload className="w-5 h-5 text-[#2563eb] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-[#0d3b66]">Carga masiva (Fuecoco)</p>
                  <p className="text-[11px] text-[#5b6483] font-semibold leading-snug mt-0.5">
                    Sube Excel, PDF o TXT con un nombre por línea (o primera columna) para inscribir a muchos de golpe.
                  </p>
                </div>
              </div>
              <input
                ref={bulkInputRef}
                type="file"
                accept={PARTICIPANT_LIST_ACCEPT}
                className="hidden"
                onChange={(e) => void handleBulkFile(e)}
              />
              <button
                type="button"
                disabled={bulkBusy}
                onClick={() => bulkInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-[#93c5fd] bg-white py-3 text-sm font-black text-[#1d4ed8] hover:bg-[#eff6ff] disabled:opacity-60"
              >
                {bulkBusy ? 'Inscribiendo lista…' : 'Elegir archivo (.xlsx, .xls, .csv, .pdf, .txt)'}
              </button>
              {bulkProgress && (
                <p className="text-[11px] font-bold text-[#0d3b66] text-center">
                  {bulkProgress.done}/{bulkProgress.total} · ok {bulkProgress.ok}
                  {bulkProgress.skipped > 0 ? ` · ya estaban ${bulkProgress.skipped}` : ''}
                  {bulkProgress.failed > 0 ? ` · fallaron ${bulkProgress.failed}` : ''}
                </p>
              )}
            </section>
          )}

          {!isAdmin && (
            <section className="mt-5 pt-4 border-t border-[#0d3b66]/10 space-y-4">
              <SponsorBannerCarousel banners={sponsorBanners} className="mb-3" />

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
                    src={anteriorImg}
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
