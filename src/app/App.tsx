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

const validAdmins = ['pawmot', 'bidoof', 'ditto', 'chimchar']
const validPassword = 'sellodex2026'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('main')
  const [activeTab, setActiveTab] = useState('register')
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  
  // Estado para el carrusel de banners
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

  const { 
    participants, bannedUsers, recentWinners, sponsors, banners,
    addParticipant, deleteParticipant, deleteMultiple, updateStatus, 
    banUser, unbanUser, clearAll, resetGame, addSponsor, deleteSponsor, deleteMultipleSponsors, updateSponsorsOrder, updateSponsorImage,
    addBanner, deleteBanner
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

  // ROTACIÓN AUTOMÁTICA DEL BANNER (Cambia cada 4 segundos)
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-6">
        <WinnerRoulette onBack={() => setCurrentView('main')} participants={participants} recentWinners={recentWinners} updateStatus={updateStatus} onResetGame={resetGame} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-6 relative flex flex-col">
      <div className="max-w-6xl mx-auto flex-1 w-full">
        
        <div className="flex justify-end w-full mb-4">
          {!isAdmin ? (
            <button onClick={() => setShowLogin(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-md text-sm font-medium"><LogIn className="w-4 h-4" /> Admin</button>
          ) : (
            <button onClick={handleLogout} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition shadow-md text-sm font-medium"><LogOut className="w-4 h-4" /> Salir</button>
          )}
        </div>

        <header className="text-center mb-8">
          <img src={pokemonLogo} alt="Pokémon GO" className="h-16 sm:h-20 mx-auto mb-4 drop-shadow-md" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight leading-tight px-2">Dinámicas Pokémon GO GDL</h1>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`flex flex-wrap justify-center w-full mx-auto mb-8 h-auto gap-2 bg-transparent sm:bg-slate-100 p-1 sm:rounded-xl ${isAdmin ? 'max-w-4xl' : 'max-w-lg'}`}>
            <TabsTrigger value="register" className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"><Users className="h-4 w-4" /> Registro</TabsTrigger>
            <TabsTrigger value="sponsors" className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"><Heart className="h-4 w-4 text-pink-500" /> Patrocinadores</TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="admin" className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"><Trophy className="h-4 w-4" /> Administración</TabsTrigger>
                <TabsTrigger value="qr" className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"><QrCode className="h-4 w-4" /> QR</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="register"><RegistrationForm saveRegistration={addParticipant} isAdmin={isAdmin} /></TabsContent>

          {/* PESTAÑA PÚBLICA DE PATROCINADORES CON BANNER ROTATIVO */}
          <TabsContent value="sponsors">
             <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-10 border border-gray-100">
               
               {/* BANNER CARRUSEL */}
               {banners.length > 0 && (
                 <div className="relative w-full h-40 sm:h-64 lg:h-80 rounded-2xl overflow-hidden mb-10 shadow-lg bg-gray-100 border border-gray-200">
                   {banners.map((banner, i) => (
                     <img 
                       key={banner.id} 
                       src={banner.image_url} 
                       alt={`Oferta promocional ${i + 1}`} 
                       className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${i === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} 
                     />
                   ))}
                   {/* Puntos de navegación del banner */}
                   {banners.length > 1 && (
                     <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-2">
                       {banners.map((_, i) => (
                         <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentBannerIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
                       ))}
                     </div>
                   )}
                 </div>
               )}

               <div className="text-center mb-8 sm:mb-12">
                 <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-800 mb-3 sm:mb-4 tracking-tight">Nuestros Patrocinadores</h2>
                 <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto leading-relaxed px-2">Gracias al apoyo incondicional de estas cuentas, nuestras dinámicas y premios son posibles. ¡Toca su foto para ir a seguirlos en Instagram!</p>
               </div>
               
               {sponsors.length === 0 ? (
                 <div className="text-center py-10 text-gray-400">Aún estamos reuniendo a nuestros patrocinadores de esta ronda.</div>
               ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-8 gap-x-4 sm:gap-y-10 sm:gap-x-6">
                   {sponsors.map(sponsor => (
                     <a key={sponsor.id} href={sponsor.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group">
                       <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 group-hover:scale-105 transition-transform duration-300 shadow-lg">
                          <img src={sponsor.image_url} alt={sponsor.name} className="w-full h-full rounded-full object-cover border-4 border-white bg-white" onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + sponsor.name + '&background=random' }} />
                       </div>
                       <span className="mt-3 font-semibold text-xs sm:text-sm text-gray-700 group-hover:text-pink-600 transition-colors truncate w-full text-center px-1">@{sponsor.name}</span>
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
                  participants={participants} bannedUsers={bannedUsers} sponsors={sponsors} banners={banners}
                  onDelete={deleteParticipant} onDeleteMultiple={deleteMultiple} onClearAll={clearAll} onStartRoulette={() => setCurrentView('roulette')} 
                  onBanUser={banUser} onUnbanUser={unbanUser} onAddSponsor={addSponsor} onDeleteSponsor={deleteSponsor}
                  onDeleteMultipleSponsors={deleteMultipleSponsors} onUpdateSponsorsOrder={updateSponsorsOrder}
                  onUpdateSponsorImage={updateSponsorImage} onAddBanner={addBanner} onDeleteBanner={deleteBanner}
                />
              </TabsContent>
              <TabsContent value="qr"><QRCodeDisplay url={registrationUrl} /></TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <footer className="mt-16 pb-8 flex flex-col items-center gap-6 text-sm text-gray-500 w-full px-4 text-center">
        <p>En nombre de Pawmi de Bidoff y del Ditto santo, amen.</p>
        {installPrompt && (
          <button onClick={handleInstallApp} className="flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-blue-500 text-blue-600 font-bold hover:bg-blue-50 transition shadow-sm active:scale-95"><Download className="w-5 h-5" /> Instalar esta App</button>
        )}
        <div className="flex gap-6 items-center">
          <a href="https://www.whatsapp.com/channel/0029VbA3X858Pgs9nkwUSO1L?utm_source=ig&utm_medium=social&utm_content=link_in_bio" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition"><MessageCircle className="w-7 h-7" /></a>
          <a href="https://www.instagram.com/pokemon_go_gdl/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition"><Instagram className="w-7 h-7" /></a>
          <a href="https://www.facebook.com/profile.php?id=61577260873239" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition"><Facebook className="w-7 h-7" /></a>
          <a href="https://x.com/PokemonGo_GDL" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition"><Twitter className="w-7 h-7" /></a>
        </div>
      </footer>

      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowLogin(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Acceso Admin</h2>
            <form onSubmit={onLoginSubmit}>
              <input type="text" placeholder="Usuario" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} onKeyDown={handleUsernameKeyDown} className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" autoFocus />
              <div className="relative mb-4">
                <input ref={passwordRef} type={showPassword ? "text" : "password"} placeholder="Contraseña" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2" tabIndex={-1}>{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
              </div>
              {loginError && <p className="text-red-500 mb-4 text-sm font-semibold text-center">{loginError}</p>}
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowLogin(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-md shadow-blue-500/20">Entrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}