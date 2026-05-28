import { useState, useEffect, useRef } from 'react'
import { User, AlertCircle, CheckCircle2, X } from 'lucide-react'

import moltres from '@/assets/moltres.png'
import zapdos from '@/assets/zapdos.png'
import articuno from '@/assets/articuno.png'
import pokebolaImg from '@/assets/Pokebola.png'
import pogoImg from '@/assets/Pogo.jpg'
import camfImg from '@/assets/Camf.jpg'
import yaParticipasImg from '@/assets/yaparticipas.png'
import yaWeImg from '@/assets/yawe.png'

interface RegistrationFormProps {
  saveRegistration: (username: string, team: string, ip: string, isAdminBypass?: boolean) => Promise<void>
  isAdmin?: boolean
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

export function RegistrationForm({ saveRegistration, isAdmin = false }: RegistrationFormProps) {
  const [username, setUsername] = useState('')
  const [team, setTeam] = useState<Team | ''>('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [participationModalImage, setParticipationModalImage] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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
        const ipResponse = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipResponse.json()
        await saveRegistration(username.trim(), team, ipData.ip, false)
      }

      setSuccess(true)
      setUsername('')
      setTeam('')
      if (!isAdmin) {
        const randomImage = Math.random() < 0.5 ? yaParticipasImg : yaWeImg
        setParticipationModalImage(randomImage)
      }
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
              className="font-bold text-[#2dd4bf] underline-offset-2 hover:underline"
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
            <User className="w-4 h-4 text-[#2dd4bf]" strokeWidth={2.5} />
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
              className="w-full pl-12 pr-4 py-3.5 rounded-[15px] border border-gray-200 bg-white text-[#0d3b66] font-medium placeholder:text-gray-300 focus:outline-none focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20 transition-all text-base"
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
          {loading ? 'Registrando...' : isAdmin ? 'Ayudar a registrarse' : 'Registrarse en Dinamica'}
        </button>
      </form>

      {participationModalImage && !isAdmin && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
          onClick={() => setParticipationModalImage(null)}
        >
          <div
            className="bg-white rounded-3xl p-4 max-w-sm w-full relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setParticipationModalImage(null)}
              className="absolute top-3 right-3 p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-600 z-10"
              aria-label="Cerrar aviso"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={participationModalImage}
              alt="Ya participas"
              className="w-full h-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}

      {showExamples && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setShowExamples(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-2xl w-full relative shadow-2xl max-h-[90vh] flex flex-col"
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
