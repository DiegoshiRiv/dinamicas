import { useState, useEffect, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { RegistrationForm } from '@/app/components/RegistrationForm'
import { AdminPanel } from '@/app/components/AdminPanel'
import { WinnerRoulette } from '@/app/components/WinnerRoulette'
import { QRCodeDisplay } from '@/app/components/QRCodeDisplay'
import { Users, Trophy, QrCode, LogIn, LogOut, Eye, EyeOff } from 'lucide-react' // <--- Nuevos iconos
import { useParticipants } from '@/hooks/useParticipants'

import pokemonLogo from '@/assets/pokemon-go-logo.png'

type View = 'main' | 'roulette'

const validAdmins = ['pawmot', 'bidoof', 'ditto']
const validPassword = 'sellodex2026'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('main')
  const [activeTab, setActiveTab] = useState('register')

  const { 
    participants, 
    addParticipant, 
    deleteParticipant, 
    updateStatus, 
    clearAll,
    resetGame 
  } = useParticipants()

  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isAdmin') === 'true'
    }
    return false
  })
  
  const [showLogin, setShowLogin] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false) // <--- Estado para el ojito
  const [loginError, setLoginError] = useState('')

  const passwordRef = useRef<HTMLInputElement>(null)

  const registrationUrl = window.location.origin

  useEffect(() => {
    localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false')
  }, [isAdmin])

  // Resetear estados al abrir/cerrar modal
  useEffect(() => {
    if (!showLogin) {
      setShowPassword(false)
      setLoginError('')
    }
  }, [showLogin])

  const handleLogin = () => {
    if (validAdmins.includes(usernameInput.toLowerCase()) && passwordInput === validPassword) {
      setIsAdmin(true)
      setShowLogin(false)
      setActiveTab('admin')
      setLoginError('')
      setUsernameInput('')
      setPasswordInput('')
    } else {
      setLoginError('Usuario o contraseña incorrectos')
    }
  }

  const onLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLogin()
  }

  const handleUsernameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      passwordRef.current?.focus()
    }
  }

  const handleLogout = () => {
    setIsAdmin(false)
    setActiveTab('register')
  }

  if (currentView === 'roulette') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <WinnerRoulette 
          onBack={() => setCurrentView('main')} 
          participants={participants}
          updateStatus={updateStatus}
          onResetGame={resetGame}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 relative">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8 relative">
          <img src={pokemonLogo} alt="Pokémon GO" className="h-20 mx-auto mb-3" />
          <h1 className="text-4xl font-bold text-gray-800">Dinámicas Pokémon GO GDL</h1>

          <div className="absolute top-0 right-0 mt-4 mr-4">
            {!isAdmin ? (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <LogIn className="w-5 h-5" /> Admin
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
              >
                <LogOut className="w-5 h-5" /> Salir
              </button>
            )}
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full mx-auto mb-8 ${isAdmin ? 'max-w-3xl grid-cols-3' : 'max-w-md grid-cols-1'}`}>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Registro
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" /> Administración
                </TabsTrigger>
                <TabsTrigger value="qr" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" /> QR
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="register">
            <RegistrationForm saveRegistration={addParticipant} />
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="admin">
                <AdminPanel 
                  participants={participants}
                  onDelete={deleteParticipant}
                  onClearAll={clearAll}
                  onStartRoulette={() => setCurrentView('roulette')} 
                />
              </TabsContent>
              <TabsContent value="qr">
                <QRCodeDisplay url={registrationUrl} />
              </TabsContent>
            </>
          )}
        </Tabs>

        <footer className="mt-12 text-center text-sm text-gray-500">
          En nombre de Pawmi de Bidoff y del Ditto santo, amen.
        </footer>
      </div>

      {/* LOGIN MODAL */}
      {showLogin && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
          onClick={() => setShowLogin(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full" 
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-center">Acceso Admin</h2>
            
            <form onSubmit={onLoginSubmit}>
              {/* Usuario */}
              <input 
                type="text" 
                placeholder="Usuario" 
                value={usernameInput} 
                onChange={e => setUsernameInput(e.target.value)} 
                onKeyDown={handleUsernameKeyDown}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                autoFocus 
              />
              
              {/* Contraseña con Ojito */}
              <div className="relative mb-3">
                <input 
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"} // Cambia el tipo dinámicamente
                  placeholder="Contraseña" 
                  value={passwordInput} 
                  onChange={e => setPasswordInput(e.target.value)} 
                  className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1} // Para que no estorbe al tabular
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {loginError && <p className="text-red-600 mb-3 text-sm font-medium">{loginError}</p>}
              
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowLogin(false)} 
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}