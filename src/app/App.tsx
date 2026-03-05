import { useState, useEffect, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { RegistrationForm } from '@/app/components/RegistrationForm'
import { AdminPanel } from '@/app/components/AdminPanel'
import { WinnerRoulette } from '@/app/components/WinnerRoulette'
import { QRCodeDisplay } from '@/app/components/QRCodeDisplay'
import { Users, Trophy, QrCode, LogIn, LogOut, Eye, EyeOff, MessageCircle, Instagram, Facebook, Twitter, Download, Heart } from 'lucide-react'
import { useParticipants } from '@/hooks/useParticipants'

import pokemonLogo from '@/assets/pokemon-go-logo.png'

type View = 'main' | 'roulette'

const validAdmins = ['pawmot', 'bidoof', 'ditto']
const validPassword = 'sellodex2026'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('main')
  const [activeTab, setActiveTab] = useState('register')
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  const { 
    participants, bannedUsers, recentWinners, sponsors,
    addParticipant, deleteParticipant, deleteMultiple, updateStatus, 
    banUser, unbanUser, clearAll, resetGame, addSponsor, deleteSponsor, deleteMultipleSponsors, updateSponsorsOrder, updateSponsorImage
  } = useParticipants()

  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('isAdmin') === 'true'
    return false
  })
  
  const [showLogin, setShowLogin] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')

  const passwordRef = useRef<HTMLInputElement>(null)
  const registrationUrl = window.location.origin

  useEffect(() => { localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false') }, [isAdmin])
  useEffect(() => { if (!showLogin) { setShowPassword(false); setLoginError('') } }, [showLogin])

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstallApp = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallPrompt(null)
  }

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

  const onLoginSubmit = (e: React.FormEvent) => { e.preventDefault(); handleLogin() }
  const handleUsernameKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); passwordRef.current?.focus() } }
  const handleLogout = () => { setIsAdmin(false); setActiveTab('register') }

  if (currentView === 'roulette') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <WinnerRoulette 
          onBack={() => setCurrentView('main')} 
          participants={participants}
          recentWinners={recentWinners}
          updateStatus={updateStatus}
          onResetGame={resetGame}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 relative flex flex-col">
      <div className="max-w-6xl mx-auto flex-1 w-full">
        <header className="text-center mb-8 relative">
          <img src={pokemonLogo} alt="Pokémon GO" className="h-20 mx-auto mb-3" />
          <h1 className="text-4xl font-bold text-gray-800">Dinámicas Pokémon GO GDL</h1>

          <div className="absolute top-0 right-0 mt-4 mr-4">
            {!isAdmin ? (
              <button onClick={() => setShowLogin(true)} className="flex items-center gap-1 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition shadow-md">
                <LogIn className="w-5 h-5" /> Admin
              </button>
            ) : (
              <button onClick={handleLogout} className="flex items-center gap-1 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition shadow-md">
                <LogOut className="w-5 h-5" /> Salir
              </button>
            )}
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full mx-auto mb-8 ${isAdmin ? 'max-w-4xl grid-cols-4' : 'max-w-lg grid-cols-2'}`}>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Registro
            </TabsTrigger>
            
            <TabsTrigger value="sponsors" className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" /> Patrocinadores
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
            <RegistrationForm saveRegistration={addParticipant} isAdmin={isAdmin} />
          </TabsContent>

          {/* Nueva Pestaña Pública de Patrocinadores */}
          <TabsContent value="sponsors">
             <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-100">
               <div className="text-center mb-10">
                 <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Nuestros Patrocinadores</h2>
                 <p className="text-gray-500 max-w-xl mx-auto">Gracias al apoyo de nuestros amigos, nuestras dinámicas y premios son posibles. ¡Toca su foto para ir a seguirlos en Instagram!</p>
               </div>
               
               {sponsors.length === 0 ? (
                 <div className="text-center py-10 text-gray-400">Aún estamos reuniendo a nuestros patrocinadores de esta ronda.</div>
               ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-10 gap-x-6">
                   {sponsors.map(sponsor => (
                     <a key={sponsor.id} href={sponsor.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group">
                       <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 group-hover:scale-110 transition-transform duration-300 shadow-md">
                          <img 
                            src={sponsor.image_url} 
                            alt={sponsor.name} 
                            className="w-full h-full rounded-full object-cover border-4 border-white bg-white" 
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + sponsor.name + '&background=random' }}
                          />
                       </div>
                       <span className="mt-3 font-semibold text-sm text-gray-700 group-hover:text-pink-600 transition-colors truncate w-full text-center">@{sponsor.name}</span>
                     </a>
                   ))}
                 </div>
               )}
             </div>
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="admin">
                <AdminPanel 
                  participants={participants} bannedUsers={bannedUsers} sponsors={sponsors}
                  onDelete={deleteParticipant} onDeleteMultiple={deleteMultiple} onClearAll={clearAll} onStartRoulette={() => setCurrentView('roulette')} 
                  onBanUser={banUser} onUnbanUser={unbanUser} onAddSponsor={addSponsor} onDeleteSponsor={deleteSponsor}
                  onDeleteMultipleSponsors={deleteMultipleSponsors} onUpdateSponsorsOrder={updateSponsorsOrder}
                  onUpdateSponsorImage={updateSponsorImage}
                />
              </TabsContent>
              <TabsContent value="qr">
                <QRCodeDisplay url={registrationUrl} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <footer className="mt-12 pb-8 flex flex-col items-center gap-6 text-sm text-gray-500 w-full">
        <p className="text-center">Sigue las cuentas de la comunidad</p>
        
        {installPrompt && (
          <button onClick={handleInstallApp} className="flex items-center gap-2 px-6 py-2 rounded-full border-2 border-blue-500 text-blue-600 font-semibold hover:bg-blue-50 transition shadow-sm">
            <Download className="w-4 h-4" /> Instalar esta App
          </button>
        )}
        
        <div className="flex gap-6 items-center">
          <a href="https://www.whatsapp.com/channel/0029VbA3X858Pgs9nkwUSO1L?utm_source=ig&utm_medium=social&utm_content=link_in_bio" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition"><MessageCircle className="w-6 h-6" /></a>
          <a href="https://www.instagram.com/pokemon_go_gdl/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition"><Instagram className="w-6 h-6" /></a>
          <a href="https://www.facebook.com/profile.php?id=61577260873239" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition"><Facebook className="w-6 h-6" /></a>
          <a href="https://x.com/PokemonGo_GDL" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition"><Twitter className="w-6 h-6" /></a>
        </div>
      </footer>

      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLogin(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-center">Acceso Admin</h2>
            <form onSubmit={onLoginSubmit}>
              <input type="text" placeholder="Usuario" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} onKeyDown={handleUsernameKeyDown} className="w-full border border-gray-300 rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
              <div className="relative mb-3">
                <input ref={passwordRef} type={showPassword ? "text" : "password"} placeholder="Contraseña" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {loginError && <p className="text-red-600 mb-3 text-sm font-medium">{loginError}</p>}
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowLogin(false)} className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Entrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}