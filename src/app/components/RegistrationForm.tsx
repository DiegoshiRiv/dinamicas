import { useState, useEffect, useRef } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Card, CardContent } from '@/app/components/ui/card'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

// ICONOS
import moltres from '@/assets/moltres.png'
import zapdos from '@/assets/zapdos.png'
import articuno from '@/assets/articuno.png'

interface RegistrationFormProps {
  onSuccess?: () => void
}

type Team = 'blue' | 'yellow' | 'red'

const teams: {
  value: Team
  label: string
  bg: string
  ring: string
  icon: string
}[] = [
  {
    value: 'blue',
    label: 'Sabiduría',
    bg: 'bg-blue-500',
    ring: 'ring-blue-500',
    icon: articuno,
  },
  {
    value: 'yellow',
    label: 'Instinto',
    bg: 'bg-yellow-400',
    ring: 'ring-yellow-400',
    icon: zapdos,
  },
  {
    value: 'red',
    label: 'Valor',
    bg: 'bg-red-500',
    ring: 'ring-red-500',
    icon: moltres,
  },
]

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [username, setUsername] = useState('')
  const [team, setTeam] = useState<Team | ''>('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!username.trim()) {
      setError('Escribe tu nombre de usuario')
      return
    }

    if (!team) {
      setError('Selecciona un equipo')
      return
    }

    setLoading(true)

    setTimeout(() => {
      const participants = JSON.parse(localStorage.getItem('participants') || '[]')

      const exists = participants.some(
        (p: any) => p.username.toLowerCase() === username.toLowerCase()
      )

      if (exists) {
        setError('Este nombre ya está registrado')
        setLoading(false)
        return
      }

      participants.push({
        id: Date.now().toString(),
        username: username.trim(),
        team,
        status: 'active',
        registeredAt: new Date().toISOString(),
      })

      localStorage.setItem('participants', JSON.stringify(participants))

      setSuccess(true)
      setLoading(false)
      setUsername('')
      setTeam('')

      if (onSuccess) setTimeout(onSuccess, 2000)
    }, 700)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* USUARIO */}
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de usuario de Campfire</Label>
            <Input
              ref={inputRef}
              id="username"
              placeholder="Escribe tu nombre de usuario aquí"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || success}
            />
          </div>

          {/* EQUIPOS */}
          <div className="space-y-3">
            <Label>Selecciona tu equipo</Label>

            <div className="grid grid-cols-3 gap-3">
              {teams.map((t) => {
                const selected = team === t.value

                return (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => setTeam(t.value)}
                    className={`
                      flex flex-col items-center justify-center gap-2
                      p-4 rounded-xl border transition-all
                      ${selected ? `${t.bg} text-white ring-4 ${t.ring}` : 'bg-white'}
                    `}
                  >
                    {/* ICONO */}
                    <img
                      src={t.icon}
                      alt={t.label}
                      className={`
                        w-10 h-10 transition
                        ${selected ? 'invert brightness-0' : ''}
                      `}
                    />

                    <span className="font-semibold">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* AVISO */}
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Debes tener tu check-in en Campfire para poder partcipar en las dinimacas.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Registro exitoso. ¡Buena suerte!
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading || success}>
            {loading ? 'Registrando…' : 'Registrarse'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
