import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { RegistrationForm } from '@/app/components/RegistrationForm'
import { AdminPanel } from '@/app/components/AdminPanel'
import { WinnerRoulette } from '@/app/components/WinnerRoulette'
import { QRCodeDisplay } from '@/app/components/QRCodeDisplay'
import { Users, Trophy, QrCode, LogIn, LogOut } from 'lucide-react'

import pokemonLogo from '@/assets/pokemon-go-logo.png'

type View = 'main' | 'roulette'

const validAdmins = ['pawmot', 'bidoof', 'ditto']
const validPassword = 'sellodex2026'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('main')
  const [activeTab, setActiveTab] = useState('register')

  // Nuevo estado para controlar si está logueado admin
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  // Estados para inputs del login
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const registrationUrl = window.location.origin

  const handleLogin = () => {
    if (validAdmins.includes(username.toLowerCase()) && password === validPassword) {
      setIsAdmin(true)
      setShowLogin(false)
      setActiveTab('admin') // Cambiar a pestaña admin automáticamente
      setLoginError('')
      // Limpiar inputs
      setUsername('')
      setPassword('')
    } else {
      setLoginError('Usuario o contraseña incorrectos')
    }
  }

  const handleLogout = () => {
    setIsAdmin(false)
    setActiveTab('register')
  }

  if (currentView === 'roulette') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <WinnerRoulette onBack={() => setCurrentView('main')} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 relative">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <header className="text-center mb-8 relative">
          <img
            src={pokemonLogo}
            alt="Pokémon GO"
            className="h-20 mx-auto mb-3"
          />
          <h1 className="text-4xl font-bold text-gray-800">
            Dinámicas Pokémon GO GDL
          </h1>

          {/* Botón login/logout en esquina superior derecha */}
          <div className="absolute top-0 right-0 mt-4 mr-4">
            {!isAdmin ? (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                aria-label="Iniciar sesión admin"
              >
                <LogIn className="w-5 h-5" /> Admin
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                aria-label="Cerrar sesión admin"
              >
                <LogOut className="w-5 h-5" /> Salir
              </button>
            )}
          </div>
        </header>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className={`grid w-full mx-auto mb-8 ${
              isAdmin ? 'max-w-3xl grid-cols-3' : 'max-w-md grid-cols-1'
            }`}
          >
            <TabsTrigger value="register" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Registro
            </TabsTrigger>

            {isAdmin && (
              <>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Administración
                </TabsTrigger>

                <TabsTrigger value="qr" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="register">
            <RegistrationForm />
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="admin">
                <AdminPanel onStartRoulette={() => setCurrentView('roulette')} />
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

      {/* Modal simple de login */}
      {showLogin && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowLogin(false)}
        >
          <div
            className="bg-white rounded p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Inicio de sesión administrador</h2>

            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
              autoFocus
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
            />

            {loginError && (
              <p className="text-red-600 mb-3">{loginError}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogin(false)}
                className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogin}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
