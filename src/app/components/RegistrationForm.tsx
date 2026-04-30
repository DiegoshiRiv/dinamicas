import { useState, useEffect, useRef } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Card, CardContent } from '@/app/components/ui/card'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react'

import moltres from '@/assets/moltres.png'
import zapdos from '@/assets/zapdos.png'
import articuno from '@/assets/articuno.png'

// IMÁGENES DE EJEMPLO
import pogoImg from '@/assets/Pogo.jpg'
import camfImg from '@/assets/Camf.jpg'

interface RegistrationFormProps {
  saveRegistration: (username: string, team: string, ip: string, isAdminBypass?: boolean) => Promise<void>
  isAdmin?: boolean
}

type Team = 'blue' | 'yellow' | 'red'

// ACTUALIZADO: Añadimos colores de fondo, texto y filtros para los iconos cuando se seleccionan
const teams: { value: Team; label: string; borderColor: string; activeBg: string; activeText: string; activeIcon: string; icon: string }[] = [
  { value: 'blue', label: 'Sabiduría', borderColor: 'border-blue-500', activeBg: 'bg-blue-500', activeText: 'text-white', activeIcon: 'brightness-0 invert', icon: articuno },
  { value: 'yellow', label: 'Instinto', borderColor: 'border-yellow-400', activeBg: 'bg-yellow-400', activeText: 'text-black', activeIcon: 'brightness-0', icon: zapdos },
  { value: 'red', label: 'Valor', borderColor: 'border-red-500', activeBg: 'bg-red-500', activeText: 'text-white', activeIcon: 'brightness-0 invert', icon: moltres },
]

export function RegistrationForm({ saveRegistration, isAdmin = false }: RegistrationFormProps) {
  const [username, setUsername] = useState('')
  const [team, setTeam] = useState<Team | ''>('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [showExamples, setShowExamples] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess(false)

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
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (e: any) {
      setError(e.message || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="w-full border-0 shadow-2xl rounded-2xl relative overflow-hidden bg-white">
        {isAdmin && (
          <div className="absolute top-4 right-4 z-10 cursor-help" title="Modo Staff Activo">
            <ShieldCheck className="text-blue-500 w-6 h-6" />
          </div>
        )}

        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="username" className="text-lg font-bold text-gray-900 block">Nombre de usuario</Label>
              <Input 
                ref={inputRef} 
                id="username" 
                placeholder="Ej: AshKetchum123" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                disabled={loading} 
                className="text-base sm:text-lg py-6 bg-gray-100 border-transparent rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 placeholder:text-gray-400 font-medium"
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-lg font-bold text-gray-900 block">Selecciona tu equipo</Label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {teams.map((t) => {
                  const selected = team === t.value
                  return (
                    <button 
                      type="button" 
                      key={t.value} 
                      onClick={() => setTeam(t.value)} 
                      disabled={loading}
                      className={`
                        flex flex-col items-center justify-center gap-2 py-4 px-1 rounded-2xl border-2 transition-all duration-200
                        ${selected 
                          ? `${t.borderColor} ${t.activeBg} scale-105 shadow-md` // Relleno de color si está seleccionado
                          : `${t.borderColor} bg-white hover:bg-gray-50 opacity-80 hover:opacity-100` // Marco de color por defecto
                        }
                      `}
                    >
                      <img 
                        src={t.icon} 
                        alt={t.label} 
                        // Aplicamos el filtro para cambiar a blanco o negro según el color del fondo
                        className={`w-10 h-10 sm:w-12 sm:h-12 object-contain transition-all duration-200 ${selected ? t.activeIcon : 'brightness-0 opacity-90'}`} 
                      />
                      <span className={`font-bold text-xs sm:text-sm transition-colors duration-200 ${selected ? t.activeText : 'text-gray-900'}`}>
                        {t.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {!isAdmin && (
              <Alert className="bg-blue-50 border-blue-100 text-blue-800 rounded-xl flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowExamples(true)} 
                  className="flex-shrink-0 p-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-full cursor-pointer transition-colors shadow-sm animate-pulse"
                  title="Ver ejemplos"
                >
                  <AlertCircle className="h-5 w-5" />
                </button>
                <AlertDescription className="text-xs sm:text-sm font-medium">
                  Debes tener tu nombre de usuario en pantalla para poder reclamar tu premio.
                </AlertDescription>
              </Alert>
            )}
            
            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="bg-green-50 border-green-200 text-green-800 rounded-xl">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="font-bold">Registro completado, ¡buena suerte!</AlertDescription>
              </Alert>
            )}

            <Button type="submit" size="lg" className="w-full text-lg font-bold py-6 bg-[#0B0F19] text-white hover:bg-gray-800 rounded-xl shadow-lg shadow-black/20" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrarse en la Dinámica'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* MODAL DE IMÁGENES DE EJEMPLO */}
      {showExamples && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowExamples(false)}>
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-2xl w-full relative shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            
            <button 
              onClick={() => setShowExamples(false)} 
              className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="shrink-0 pr-8">
              <h3 className="text-xl sm:text-2xl font-black text-center mb-2 text-gray-800">Ejemplos de Pantalla</h3>
              <p className="text-center text-gray-600 mb-4 text-xs sm:text-sm">Asegúrate de mostrar tu perfil así cuando ganes.</p>
            </div>
            
            <div className="overflow-y-auto overflow-x-hidden p-1 flex-1">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col items-center bg-gray-50">
                  <img src={pogoImg} alt="Ejemplo Pokémon GO" className="w-full h-auto max-h-[40vh] object-contain p-1" />
                  <span className="py-2 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wide">Pokémon GO</span>
                </div>
                <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col items-center bg-gray-50">
                  <img src={camfImg} alt="Ejemplo Campfire" className="w-full h-auto max-h-[40vh] object-contain p-1" />
                  <span className="py-2 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wide">Campfire</span>
                </div>
              </div>
            </div>

            <Button onClick={() => setShowExamples(false)} className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-bold text-lg shrink-0">
              Entendido
            </Button>
          </div>
        </div>
      )}
    </>
  )
}