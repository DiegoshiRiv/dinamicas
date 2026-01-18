import { useState, useEffect, useRef } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Card, CardContent } from '@/app/components/ui/card'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

// IMPORTAR TUS ASSETS
import moltres from '@/assets/moltres.png'
import zapdos from '@/assets/zapdos.png'
import articuno from '@/assets/articuno.png'

interface RegistrationFormProps {
  saveRegistration: (username: string, team: string) => Promise<void>
}

type Team = 'blue' | 'yellow' | 'red'

const teams: { value: Team; label: string; bg: string; ring: string; icon: string }[] = [
  { value: 'blue', label: 'Sabiduría', bg: 'bg-blue-500', ring: 'ring-blue-500', icon: articuno },
  { value: 'yellow', label: 'Instinto', bg: 'bg-yellow-400', ring: 'ring-yellow-400', icon: zapdos },
  { value: 'red', label: 'Valor', bg: 'bg-red-500', ring: 'ring-red-500', icon: moltres },
]

export function RegistrationForm({ saveRegistration }: RegistrationFormProps) {
  const [username, setUsername] = useState('')
  const [team, setTeam] = useState<Team | ''>('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess(false)

    if (!username.trim()) return setError('Escribe tu nombre de usuario')
    if (!team) return setError('Selecciona un equipo')

    setLoading(true)
    try {
      await saveRegistration(username.trim(), team)
      setSuccess(true)
      setUsername('')
      setTeam('')
      // Volver a enfocar después de éxito para registros rápidos
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (e: any) {
      setError(e.message || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-lg">Nombre de usuario (Campfire)</Label>
            <Input 
              ref={inputRef} 
              id="username" 
              placeholder="Ej: AshKetchum123" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              disabled={loading} 
              className="text-lg py-5"
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-lg">Selecciona tu equipo</Label>
            <div className="grid grid-cols-3 gap-3">
              {teams.map((t) => {
                const selected = team === t.value
                return (
                  <button 
                    type="button" 
                    key={t.value} 
                    onClick={() => setTeam(t.value)} 
                    disabled={loading}
                    className={`
                      flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all
                      ${selected ? `${t.bg} border-transparent text-white ring-4 ${t.ring} shadow-lg scale-105` : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                    `}
                  >
                    <img src={t.icon} alt={t.label} className={`w-12 h-12 transition-all ${selected ? 'brightness-0 invert' : ''}`} />
                    <span className="font-bold text-sm">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Debes tener tu check-in en Campfire para partcipar.</AlertDescription>
          </Alert>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="font-medium">¡Registro exitoso!</AlertDescription>
            </Alert>
          )}

          <Button type="submit" size="lg" className="w-full text-lg font-bold" disabled={loading}>
            {loading ? 'Registrando...' : 'Confirmar Registro'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
