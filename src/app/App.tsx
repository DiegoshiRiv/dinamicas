import { useState, useEffect, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { RegistrationForm } from '@/app/components/RegistrationForm'
import { AdminPanel } from '@/app/components/AdminPanel'
import { WinnerRoulette } from '@/app/components/WinnerRoulette'
import { QRCodeDisplay } from '@/app/components/QRCodeDisplay'
import { Users, Trophy, QrCode, LogIn, LogOut, Eye, EyeOff, Instagram, Facebook, Twitter, Download, Heart } from 'lucide-react'
import { useParticipants } from '@/hooks/useParticipants'

// IMPORTANDO TUS ASSETS
import fondoImg from '@/assets/fondo.png'
import logoImg from '@/assets/Logo.png'
import wpIcon from '@/assets/w.png'

type View = 'main' | 'roulette'

const validAdmins = ['pawmot', 'bidoof', 'ditto']
const validPassword = 'sellodex2026'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('main')
  const [activeTab, setActiveTab] = useState('register')
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  
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

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => { setCurrentBannerIndex((prev) => (prev + 1) % banners.length) }, 4000);
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
      setIsAdmin(true); setShowLogin(false); setActiveTab('admin'); setLoginError(''); setUsernameInput(''); setPasswordInput('')
    } else {
      setLoginError('Usuario o contraseña incorrectos')
    }
  }

  const onLoginSubmit = (e: React.FormEvent) => { e.preventDefault(); handleLogin() }
  const handleUsernameKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); passwordRef.current?.focus() } }
  const handleLogout = () => { setIsAdmin(false); setActiveTab('register') }

  if (currentView === 'roulette') {
    return (
      <div 
        className="min-h-screen p-4 sm:p-6 text-white" 
        style={{ backgroundColor: '#0661C6', backgroundImage: `url(${fondoImg})`, backgroundSize: '100% auto', backgroundPosition: 'top center', backgroundRepeat: 'no-repeat' }}
      >
        <WinnerRoulette onBack={() => setCurrentView('main')} participants={participants} recentWinners={recentWinners} updateStatus={updateStatus} onResetGame={resetGame} />
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen px-4 py-6 sm:p-8 relative flex flex-col items-center overflow-x-hidden font-sans"
      style={{ 
        backgroundColor: '#0661C6', 
        backgroundImage: `url(${fondoImg})`, 
        backgroundSize: '100% auto', 
        backgroundPosition: 'top center', 
        backgroundRepeat: 'no-repeat' 
      }}
    >
      <div className="max-w-md w-full relative z-10 flex-1 flex flex-col mt-2 sm:mt-4">
        
        {/* BOTÓN SALIR / ADMIN CAMBIADO A BLANCO */}
        <div className="absolute -top-2 right-0 z-20">
          {!isAdmin ? (
            <button onClick={() => setShowLogin(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#0661C6] hover:bg-gray-50 transition shadow-lg text-sm font-bold">
              <LogIn className="w-4 h-4" /> Admin
            </button>
          ) : (
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-red-600 hover:bg-gray-50 transition shadow-lg text-sm font-bold">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          )}
        </div>

        <header className="text-center mb-6 mt-4">
          <img src={logoImg} alt="Pokémon GO GDL" className="w-full max-w-[280px] sm:max-w-[320px] mx-auto drop-shadow-xl relative z-10" />
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 gap-3 sm:gap-4 bg-transparent h-auto p-0 mb-6">
            <TabsTrigger value="register" className="data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black data-[state=active]:shadow-lg bg-[#f8f9fc] text-gray-800 rounded-2xl py-3.5 sm:py-4 flex items-center justify-center gap-2 font-bold text-sm sm:text-base border-0 shadow-md transition-all">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" /> Registro
            </TabsTrigger>
            
            <TabsTrigger value="sponsors" className="data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black data-[state=active]:shadow-lg bg-[#f8f9fc] text-gray-800 rounded-2xl py-3.5 sm:py-4 flex items-center justify-center gap-2 font-bold text-sm sm:text-base border-0 shadow-md transition-all">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" /> Patrocinadores
            </TabsTrigger>
            
            {isAdmin && (
              <>
                <TabsTrigger value="admin" className="data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black data-[state=active]:shadow-lg bg-[#f8f9fc] text-gray-800 rounded-2xl py-3.5 sm:py-4 flex items-center justify-center gap-2 font-bold text-sm sm:text-base border-0 shadow-md transition-all">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" /> Administración
                </TabsTrigger>
                <TabsTrigger value="qr" className="data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black data-[state=active]:shadow-lg bg-[#f8f9fc] text-gray-800 rounded-2xl py-3.5 sm:py-4 flex items-center justify-center gap-2 font-bold text-sm sm:text-base border-0 shadow-md transition-all">
                  <QrCode className="w-4 h-4 sm:w-5 sm:h-5" /> QR
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="register" className="mt-0 outline-none"><RegistrationForm saveRegistration={addParticipant} isAdmin={isAdmin} /></TabsContent>

          <TabsContent value="sponsors" className="mt-0 outline-none">
             <div className="w-full bg-white rounded-[24px] shadow-2xl p-6 sm:p-8">
               {banners.length > 0 && (
                 <div className="relative w-full h-32 sm:h-48 rounded-xl overflow-hidden mb-8 shadow-inner bg-gray-100">
                   {banners.map((banner, i) => (
                     <img key={banner.id} src={banner.image_url} alt="Oferta" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} />
                   ))}
                 </div>
               )}
               <div className="text-center mb-6">
                 <h2 className="text-2xl font-black text-gray-900 mb-2">Apoyan a la comunidad</h2>
                 <p className="text-sm text-gray-500">Toca su foto para visitar su Instagram.</p>
               </div>
               
               {sponsors.length === 0 ? (
                 <div className="text-center py-8 text-gray-400">Reuniendo patrocinadores...</div>
               ) : (
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-6 gap-x-2">
                   {sponsors.map(sponsor => (
                     <a key={sponsor.id} href={sponsor.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group">
                       <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 group-hover:scale-105 transition-transform shadow-md">
                          <img src={sponsor.image_url} alt={sponsor.name} className="w-full h-full rounded-full object-cover border-2 border-white bg-white" onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + sponsor.name + '&background=random' }} />
                       </div>
                       <span className="mt-2 font-bold text-[10px] sm:text-xs text-gray-700 truncate w-full text-center">@{sponsor.name}</span>
                     </a>
                   ))}
                 </div>
               )}
             </div>
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="admin" className="mt-0 outline-none bg-white p-4 rounded-2xl shadow-2xl">
                <AdminPanel 
                  participants={participants} bannedUsers={bannedUsers} sponsors={sponsors} banners={banners}
                  onDelete={deleteParticipant} onDeleteMultiple={deleteMultiple} onClearAll={clearAll} onStartRoulette={() => setCurrentView('roulette')} 
                  onBanUser={banUser} onUnbanUser={unbanUser} onAddSponsor={addSponsor} onDeleteSponsor={deleteSponsor}
                  onDeleteMultipleSponsors={deleteMultipleSponsors} onUpdateSponsorsOrder={updateSponsorsOrder}
                  onUpdateSponsorImage={updateSponsorImage} onAddBanner={addBanner} onDeleteBanner={deleteBanner}
                />
              </TabsContent>
              <TabsContent value="qr" className="mt-0 outline-none"><QRCodeDisplay url={registrationUrl} /></TabsContent>
            </>
          )}
        </Tabs>
        
        <footer className="mt-10 pb-16 text-center z-10 text-white">
          <p className="font-semibold text-[17px] drop-shadow-md mb-6">Sigue las Redes Sociales de la Comunidad.</p>
          <div className="flex justify-center items-center gap-6 mb-8">
            <a href="https://www.whatsapp.com/channel/0029VbA3X858Pgs9nkwUSO1L?utm_source=ig&utm_medium=social&utm_content=link_in_bio" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
              <img src={wpIcon} alt="WhatsApp" className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-lg object-contain" />
            </a>
            <a href="https://www.instagram.com/pokemon_go_gdl/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform"><Instagram className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-lg" strokeWidth={1.5} /></a>
            <a href="https://www.facebook.com/profile.php?id=61577260873239" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform"><Facebook className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-lg" strokeWidth={1.5} /></a>
            <a href="https://x.com/PokemonGo_GDL" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform"><Twitter className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-lg" strokeWidth={1.5} /></a>
          </div>

          {installPrompt && (
            <button onClick={handleInstallApp} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white text-blue-600 font-bold shadow-xl mx-auto hover:bg-gray-50 active:scale-95 transition-all text-sm">
              <Download className="w-5 h-5" /> Crear Acceso Directo
            </button>
          )}
        </footer>
      </div>

      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowLogin(false)}>
          <div className="bg-white rounded-[24px] shadow-2xl p-6 sm:p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black mb-6 text-center text-gray-900">Acceso Admin</h2>
            <form onSubmit={onLoginSubmit}>
              <input type="text" placeholder="Usuario" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} onKeyDown={handleUsernameKeyDown} className="w-full border-0 bg-gray-100 rounded-xl px-4 py-4 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" autoFocus />
              <div className="relative mb-4">
                <input ref={passwordRef} type={showPassword ? "text" : "password"} placeholder="Contraseña" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full border-0 bg-gray-100 rounded-xl px-4 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
              </div>
              {loginError && <p className="text-red-500 mb-4 text-sm font-bold text-center">{loginError}</p>}
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowLogin(false)} className="px-5 py-3 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 font-bold w-full">Cancelar</button>
                <button type="submit" className="px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg w-full">Entrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}