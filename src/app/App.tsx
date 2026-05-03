import { useState, useEffect, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { RegistrationForm } from '@/app/components/RegistrationForm'
import { AdminPanel } from '@/app/components/AdminPanel'
import { WinnerRoulette } from '@/app/components/WinnerRoulette'
import { QRCodeDisplay } from '@/app/components/QRCodeDisplay'
import { FriendBoard } from '@/app/components/FriendBoard'
import { TournamentBoard } from '@/app/components/TournamentBoard' // <-- COMPONENTE DE TORNEOS IMPORTADO
import { Users, Trophy, QrCode, LogIn, LogOut, Eye, EyeOff, Instagram, Facebook, Twitter, Download, Heart, Image as ImageIcon, Plus, Trash2, ChevronUp, ChevronDown, Pencil, Radio, ChevronRight, Contact, Swords } from 'lucide-react'
import { useParticipants } from '@/hooks/useParticipants'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Checkbox } from '@/app/components/ui/checkbox'

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

  const [showSponsorModal, setShowSponsorModal] = useState(false)
  const [newSponsorUrl, setNewSponsorUrl] = useState('')
  const [addingSponsor, setAddingSponsor] = useState(false)
  const [selectedSponsorIds, setSelectedSponsorIds] = useState<Set<string>>(new Set())

  const [editingSponsor, setEditingSponsor] = useState<any>(null)
  const [editSponsorImgUrl, setEditSponsorImgUrl] = useState('')
  const [editSponsorDestUrl, setEditSponsorDestUrl] = useState('')
  const [isUpdatingSponsor, setIsUpdatingSponsor] = useState(false)

  const [showBannerModal, setShowBannerModal] = useState(false)
  const [bannerImgInput, setBannerImgInput] = useState('')
  const [bannerLinkInput, setBannerLinkInput] = useState('')
  const [addingBanner, setAddingBanner] = useState(false)
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null)

  const { 
    participants, bannedUsers, recentWinners, sponsors, banners,
    addParticipant, deleteParticipant, deleteMultiple, updateStatus, 
    banUser, unbanUser, clearAll, resetGame, addSponsor, deleteSponsor, deleteMultipleSponsors, updateSponsorsOrder, updateSponsorDetails,
    addBanner, updateBanner, deleteBanner,
    spectatorView, incomingSpin, broadcastView, broadcastSpin 
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
    if (!isAdmin) {
      setCurrentView(spectatorView)
    }
  }, [spectatorView, isAdmin])

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
      setIsAdmin(true); setShowLogin(false); setActiveTab('ruleta'); setLoginError(''); setUsernameInput(''); setPasswordInput('')
    } else {
      setLoginError('Usuario o contraseña incorrectos')
    }
  }

  const onLoginSubmit = (e: React.FormEvent) => { e.preventDefault(); handleLogin() }
  const handleUsernameKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); passwordRef.current?.focus() } }
  const handleLogout = () => { setIsAdmin(false); setActiveTab('register'); broadcastView('main') }

  const handleStartRoulette = () => {
    setCurrentView('roulette');
    broadcastView('roulette');
  }

  const handleExitRoulette = () => {
    setCurrentView('main');
    broadcastView('main');
  }

  const submitSponsor = async () => {
    if (!newSponsorUrl.trim()) return
    setAddingSponsor(true)
    await addSponsor(newSponsorUrl.trim())
    setNewSponsorUrl('')
    setAddingSponsor(false)
    setShowSponsorModal(false)
  }

  const handleOpenEditSponsor = (s: any) => {
    setEditingSponsor(s)
    setEditSponsorImgUrl(s.image_url)
    setEditSponsorDestUrl(s.url)
  }

  const submitEditSponsor = async () => {
    if (!editingSponsor) return
    setIsUpdatingSponsor(true)
    await updateSponsorDetails(editingSponsor.id, editSponsorImgUrl.trim(), editSponsorDestUrl.trim())
    setIsUpdatingSponsor(false)
    setEditingSponsor(null)
  }

  const moveSponsor = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sponsors.length - 1) return;
    const newSponsors = [...sponsors];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newSponsors[index];
    newSponsors[index] = newSponsors[swapIndex];
    newSponsors[swapIndex] = temp;
    updateSponsorsOrder(newSponsors);
  }

  const toggleSponsorSelection = (id: string) => {
    const newSelection = new Set(selectedSponsorIds)
    newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id)
    setSelectedSponsorIds(newSelection)
  }

  const handleOpenBannerModal = (id: string = '', img: string = '', link: string = '') => {
    setEditingBannerId(id ? id : null)
    setBannerImgInput(img)
    setBannerLinkInput(link)
    setShowBannerModal(true)
  }

  const submitBanner = async () => {
    if (!bannerImgInput.trim()) return
    setAddingBanner(true)
    
    if (editingBannerId) {
      await updateBanner(editingBannerId, bannerImgInput.trim(), bannerLinkInput.trim())
    } else {
      await addBanner(bannerImgInput.trim(), bannerLinkInput.trim())
    }
    
    setBannerImgInput('')
    setBannerLinkInput('')
    setEditingBannerId(null)
    setAddingBanner(false)
    setShowBannerModal(false)
  }

  if (currentView === 'roulette') {
    return (
      <div className="min-h-screen p-4 sm:p-6 text-white" style={{ backgroundColor: '#0661C6', backgroundImage: `url(${fondoImg})`, backgroundSize: '100% auto', backgroundPosition: 'top center', backgroundRepeat: 'no-repeat' }}>
        <WinnerRoulette 
          onBack={isAdmin ? handleExitRoulette : () => setCurrentView('main')} 
          participants={participants} 
          recentWinners={recentWinners} 
          updateStatus={updateStatus} 
          onResetGame={resetGame} 
          isSpectator={!isAdmin} 
          incomingSpin={incomingSpin} 
          broadcastSpin={broadcastSpin} 
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:p-8 relative flex flex-col items-center overflow-x-hidden font-sans" style={{ backgroundColor: '#0661C6', backgroundImage: `url(${fondoImg})`, backgroundSize: '100% auto', backgroundPosition: 'top center', backgroundRepeat: 'no-repeat' }}>
      
      <div className="max-w-md w-full relative z-10 flex-1 flex flex-col mt-2 sm:mt-4">
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

        {!isAdmin && spectatorView === 'roulette' && (
          <div 
            onClick={() => setCurrentView('roulette')}
            className="w-full bg-red-500 hover:bg-red-600 text-white rounded-2xl p-4 mb-6 cursor-pointer flex items-center justify-between shadow-lg shadow-red-500/30 transition-all transform hover:scale-[1.02] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-white text-red-500 p-2.5 rounded-full shadow-inner">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-left">
                <h3 className="font-black text-lg leading-tight drop-shadow-sm">¡Ruleta en Vivo!</h3>
                <p className="text-sm font-medium text-red-100">Toca aquí para volver a verla.</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 relative z-10" />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* NUEVO MENÚ: 4 Columnas para que quepan Registro, Torneos, Amigos y Patrocinadores */}
          <TabsList className="w-full grid grid-cols-4 gap-1.5 sm:gap-2 bg-transparent h-auto p-0 mb-6">
            <TabsTrigger value="register" className="data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black data-[state=active]:shadow-lg bg-[#f8f9fc] text-gray-800 rounded-xl py-3 flex flex-col sm:flex-row items-center justify-center gap-1 font-bold text-[10px] sm:text-[13px] border-0 shadow-md transition-all">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> <span className="truncate">Registro</span>
            </TabsTrigger>
            
            <TabsTrigger value="tournaments" className="data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black data-[state=active]:shadow-lg bg-[#f8f9fc] text-gray-800 rounded-xl py-3 flex flex-col sm:flex-row items-center justify-center gap-1 font-bold text-[10px] sm:text-[13px] border-0 shadow-md transition-all">
              <Swords className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-purple-600" /> <span className="truncate">Torneos</span>
            </TabsTrigger>

            <TabsTrigger value="friends" className="data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black data-[state=active]:shadow-lg bg-[#f8f9fc] text-gray-800 rounded-xl py-3 flex flex-col sm:flex-row items-center justify-center gap-1 font-bold text-[10px] sm:text-[13px] border-0 shadow-md transition-all">
              <Contact className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-blue-500" /> <span className="truncate">Amigos</span>
            </TabsTrigger>

            <TabsTrigger value="sponsors" className="data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black data-[state=active]:shadow-lg bg-[#f8f9fc] text-gray-800 rounded-xl py-3 flex flex-col sm:flex-row items-center justify-center gap-1 font-bold text-[10px] sm:text-[13px] border-0 shadow-md transition-all">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-pink-500" /> <span className="truncate">Patro...</span>
            </TabsTrigger>
            
            {isAdmin && (
              <>
                <TabsTrigger value="ruleta" className="data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black data-[state=active]:shadow-lg bg-[#f8f9fc] text-gray-800 rounded-xl py-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 font-bold text-[11px] sm:text-sm border-0 shadow-md transition-all col-span-2">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" /> Ruleta
                </TabsTrigger>
                <TabsTrigger value="qr" className="data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black data-[state=active]:shadow-lg bg-[#f8f9fc] text-gray-800 rounded-xl py-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 font-bold text-[11px] sm:text-sm border-0 shadow-md transition-all col-span-2">
                  <QrCode className="w-4 h-4 sm:w-5 sm:h-5" /> QR
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="register" className="mt-0 outline-none"><RegistrationForm saveRegistration={addParticipant} isAdmin={isAdmin} /></TabsContent>

          {/* VISTA DE TORNEOS */}
          <TabsContent value="tournaments" className="mt-0 outline-none">
            <TournamentBoard isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="friends" className="mt-0 outline-none">
            <FriendBoard isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="sponsors" className="mt-0 outline-none">
             {isAdmin && (
               <div className="w-full bg-white rounded-[24px] shadow-2xl p-6 sm:p-8 mb-6">
                 <div className="mb-8">
                   <h3 className="font-bold text-[#6B21A8] text-xl flex items-center gap-2 mb-1"><ImageIcon className="w-6 h-6"/> Banners Promocionales</h3>
                   <p className="text-sm text-gray-500 mb-4">Imágenes que rotarán en la vista del público.</p>
                   <Button onClick={() => handleOpenBannerModal()} className="w-full bg-[#A855F7] hover:bg-[#9333EA] text-white rounded-xl py-6 font-bold shadow-md text-lg mb-4">
                     <Plus className="w-5 h-5 mr-2" /> Añadir Banner
                   </Button>
                   
                   <div className="flex gap-3 overflow-x-auto pb-2">
                     {banners.length === 0 ? <p className="text-sm text-gray-400 italic">No hay banners activos.</p> : banners.map(b => (
                       <div key={b.id} className="relative w-36 h-24 flex-shrink-0 rounded-xl overflow-hidden group shadow-sm border border-gray-200">
                         <img src={b.image_url} alt="Banner" className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                           <Button variant="secondary" size="icon" className="w-10 h-10 rounded-full" onClick={() => handleOpenBannerModal(b.id, b.image_url, b.link_url)}><Pencil className="w-5 h-5" /></Button>
                           <Button variant="destructive" size="icon" className="w-10 h-10 rounded-full" onClick={() => deleteBanner(b.id)}><Trash2 className="w-5 h-5" /></Button>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 <div>
                   <h3 className="font-bold text-[#9D174D] text-xl flex items-center gap-2 mb-4"><Instagram className="w-6 h-6"/> Cuentas Patrocinadoras</h3>
                   
                   <div className="flex flex-col gap-3 mb-4">
                     <Button onClick={() => setShowSponsorModal(true)} className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white rounded-xl py-6 font-bold shadow-md text-lg">
                       <Plus className="w-5 h-5 mr-2" /> Añadir Patrocinador
                     </Button>
                     {selectedSponsorIds.size > 0 && (
                       <Button variant="destructive" className="w-full rounded-xl py-6 font-bold text-lg" onClick={() => { deleteMultipleSponsors(Array.from(selectedSponsorIds)); setSelectedSponsorIds(new Set()) }}>
                         <Trash2 className="w-5 h-5 mr-2" /> Borrar ({selectedSponsorIds.size})
                       </Button>
                     )}
                   </div>

                   <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scroll-smooth border border-gray-100 rounded-xl p-2 bg-gray-50/50">
                     {sponsors.length === 0 ? <div className="text-center py-6 text-gray-400">Sin registros</div> : sponsors.map((s, index) => (
                       <div key={s.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                         <div className="flex items-center gap-2 overflow-hidden w-full">
                           <Checkbox checked={selectedSponsorIds.has(s.id)} onCheckedChange={() => toggleSponsorSelection(s.id)} className="w-5 h-5 rounded-md mx-1" />
                           <div className="flex flex-col bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                             <button onClick={() => moveSponsor(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-pink-600 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                             <button onClick={() => moveSponsor(index, 'down')} disabled={index === sponsors.length - 1} className="p-1 text-gray-400 hover:text-pink-600 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                           </div>
                           <img src={s.image_url} alt={s.name} className="w-10 h-10 rounded-full border border-gray-200 object-cover bg-white" onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + s.name + '&background=random' }} />
                           <span className="font-bold text-gray-700 truncate text-sm">@{s.name}</span>
                         </div>
                         <div className="flex items-center gap-1 shrink-0">
                           <Button variant="ghost" size="icon" onClick={() => handleOpenEditSponsor(s)} className="rounded-lg text-gray-400 hover:text-blue-600 bg-gray-50/50"><Pencil className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon" onClick={() => deleteSponsor(s.id)} className="rounded-lg text-gray-400 hover:text-red-600 bg-gray-50/50"><Trash2 className="h-4 w-4" /></Button>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             )}

             <div className="w-full bg-white rounded-[24px] shadow-2xl p-6 sm:p-8">
               {isAdmin && (
                 <div className="mb-6 border-b-2 border-gray-100 pb-3">
                   <h2 className="text-2xl font-black text-gray-800">Vista Previa</h2>
                   <p className="text-sm text-gray-500">Así es como el público ve esta sección.</p>
                 </div>
               )}

               {banners.length > 0 && (
                 <div className="relative w-full h-32 sm:h-48 rounded-xl overflow-hidden mb-8 shadow-inner bg-gray-100">
                   {banners.map((banner, i) => {
                     const isActive = i === currentBannerIndex;
                     const commonClasses = `absolute inset-0 w-full h-full transition-opacity duration-1000 ${isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`;
                     
                     if (banner.link_url) {
                       return (
                         <a key={banner.id} href={banner.link_url} target="_blank" rel="noopener noreferrer" className={commonClasses}>
                           <img src={banner.image_url} alt="Oferta" className="w-full h-full object-cover" />
                         </a>
                       )
                     }
                     return (
                       <div key={banner.id} className={commonClasses}>
                         <img src={banner.image_url} alt="Oferta" className="w-full h-full object-cover" />
                       </div>
                     )
                   })}
                 </div>
               )}
               
               <div className="text-center mb-6">
                 <h2 className="text-2xl font-black text-gray-900 mb-2">Nuestros Patrocinadores</h2>
                 <p className="text-sm text-gray-500">Toca su foto para visitar su Instagram.</p>
               </div>
               
               {sponsors.length === 0 ? (
                 <div className="text-center py-8 text-gray-400">Reuniendo patrocinadores...</div>
               ) : (
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-6 gap-x-2">
                   {sponsors.map(sponsor => (
                     <a key={sponsor.id} href={sponsor.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group">
                       <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[3px] bg-[#E5E7EB] group-hover:bg-[#D946EF] group-hover:scale-105 transition-all shadow-sm">
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
              <TabsContent value="ruleta" className="mt-0 outline-none">
                <AdminPanel 
                  participants={participants} bannedUsers={bannedUsers}
                  onDelete={deleteParticipant} onDeleteMultiple={deleteMultiple} onClearAll={clearAll} 
                  onStartRoulette={handleStartRoulette} 
                  onBanUser={banUser} onUnbanUser={unbanUser}
                />
              </TabsContent>
              <TabsContent value="qr" className="mt-0 outline-none bg-white p-4 rounded-2xl shadow-2xl"><QRCodeDisplay url={registrationUrl} /></TabsContent>
            </>
          )}
        </Tabs>
        
        <footer className="mt-10 pb-16 text-center z-10 text-white">
          <p className="font-semibold text-[17px] drop-shadow-md mb-6">Sigue las Redes Sociales de la Comunidad.</p>
          <div className="flex justify-center items-center gap-6 mb-8">
            <a href="https://www.whatsapp.com/channel/0029VbA3X858Pgs9nkwUSO1L?utm_source=ig&utm_medium=social&utm_content=link_in_bio" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform"><img src={wpIcon} alt="WhatsApp" className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-lg object-contain" /></a>
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

      {showSponsorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSponsorModal(false)}>
          <div className="bg-white rounded-[24px] shadow-2xl p-6 sm:p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-5"><div className="bg-pink-50 p-4 rounded-full text-[#D946EF] shadow-inner"><Instagram className="w-8 h-8" /></div></div>
            <h2 className="text-2xl font-black mb-2 text-center text-gray-800">Añadir Patrocinador</h2>
            <p className="text-sm text-gray-500 mb-6 text-center leading-relaxed">Pega el link de su perfil de Instagram o su usuario directo.</p>
            <Input autoFocus placeholder="Ej: https://instagram.com/michiblue2299" value={newSponsorUrl} onChange={(e) => setNewSponsorUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitSponsor()} className="mb-6 border-gray-200 focus-visible:ring-[#D946EF] rounded-xl px-4 py-6 bg-gray-50 text-base" />
            <div className="flex flex-col gap-3">
              <Button onClick={submitSponsor} disabled={addingSponsor || !newSponsorUrl} className="w-full rounded-xl py-6 bg-[#D946EF] hover:bg-[#C026D3] text-white font-bold text-lg">{addingSponsor ? 'Buscando...' : 'Guardar'}</Button>
              <Button variant="outline" className="w-full rounded-xl py-6 font-bold text-gray-600 border-0 bg-gray-100 hover:bg-gray-200 text-lg" onClick={() => setShowSponsorModal(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {editingSponsor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingSponsor(null)}>
          <div className="bg-white rounded-[24px] shadow-2xl p-6 sm:p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-5"><div className="bg-pink-50 p-4 rounded-full text-[#D946EF] shadow-inner"><Pencil className="w-8 h-8" /></div></div>
            <h2 className="text-2xl font-black mb-2 text-center text-gray-800">Editar Patrocinador</h2>
            <p className="text-sm text-gray-500 mb-6 text-center leading-relaxed">Actualiza la foto o el enlace para <span className="font-bold text-gray-900">@{editingSponsor.name}</span>.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Enlace de la imagen (Foto)</label>
                <Input autoFocus placeholder="Ej: https://i.imgur.com/foto.jpg" value={editSponsorImgUrl} onChange={(e) => setEditSponsorImgUrl(e.target.value)} className="border-gray-200 focus-visible:ring-[#D946EF] rounded-xl px-4 py-5 bg-gray-50 text-base" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Enlace de destino (Instagram/Web)</label>
                <Input placeholder="Ej: https://instagram.com/..." value={editSponsorDestUrl} onChange={(e) => setEditSponsorDestUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitEditSponsor()} className="border-gray-200 focus-visible:ring-[#D946EF] rounded-xl px-4 py-5 bg-gray-50 text-base" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={submitEditSponsor} disabled={isUpdatingSponsor || !editSponsorImgUrl || !editSponsorDestUrl} className="w-full rounded-xl py-6 bg-[#D946EF] hover:bg-[#C026D3] text-white font-bold text-lg">{isUpdatingSponsor ? 'Guardando...' : 'Guardar Cambios'}</Button>
              <Button variant="outline" className="w-full rounded-xl py-6 font-bold text-gray-600 border-0 bg-gray-100 hover:bg-gray-200 text-lg" onClick={() => setEditingSponsor(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {showBannerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBannerModal(false)}>
          <div className="bg-white rounded-[24px] shadow-2xl p-6 sm:p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-5"><div className="bg-purple-50 p-4 rounded-full text-[#A855F7] shadow-inner"><ImageIcon className="w-8 h-8" /></div></div>
            <h2 className="text-2xl font-black mb-2 text-center text-gray-800">{editingBannerId ? 'Editar Banner' : 'Añadir Banner'}</h2>
            <p className="text-sm text-gray-500 mb-6 text-center leading-relaxed">Pega el enlace de la imagen y, opcionalmente, hacia dónde debe redirigir al tocarlo.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Enlace de la imagen (JPG/PNG) *</label>
                <Input autoFocus placeholder="Ej: https://i.imgur.com/foto.jpg" value={bannerImgInput} onChange={(e) => setBannerImgInput(e.target.value)} className="border-gray-200 focus-visible:ring-[#A855F7] rounded-xl px-4 py-5 bg-gray-50 text-base" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Enlace de destino (Opcional)</label>
                <Input placeholder="Ej: https://wa.me/..." value={bannerLinkInput} onChange={(e) => setBannerLinkInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitBanner()} className="border-gray-200 focus-visible:ring-[#A855F7] rounded-xl px-4 py-5 bg-gray-50 text-base" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={submitBanner} disabled={addingBanner || !bannerImgInput} className="w-full rounded-xl py-6 bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold text-lg">{addingBanner ? 'Guardando...' : 'Guardar Banner'}</Button>
              <Button variant="outline" className="w-full rounded-xl py-6 font-bold text-gray-600 border-0 bg-gray-100 hover:bg-gray-200 text-lg" onClick={() => setShowBannerModal(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}