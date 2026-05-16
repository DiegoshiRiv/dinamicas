import { useState, useEffect, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { RegistrationForm } from '@/app/components/RegistrationForm'
import { AdminPanel } from '@/app/components/AdminPanel'
import { WinnerRoulette } from '@/app/components/WinnerRoulette'
import { QRCodeDisplay } from '@/app/components/QRCodeDisplay'
import { FriendBoard } from '@/app/components/FriendBoard'
import { TournamentBoard } from '@/app/components/TournamentBoard'
import { PollBoard } from '@/app/components/PollBoard'
import { Users, Trophy, QrCode, LogIn, LogOut, Eye, EyeOff, Instagram, Facebook, Twitter, Download, Heart, Image as ImageIcon, Plus, Trash2, ChevronUp, ChevronDown, Pencil, Contact, Swords, BarChart3, X } from 'lucide-react'
import { useParticipants } from '@/hooks/useParticipants'
import { useTournaments } from '@/hooks/useTournaments'
import { usePolls } from '@/hooks/usePolls'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Checkbox } from '@/app/components/ui/checkbox'

import fondoImg from '@/assets/fondo.png'
import logoImg from '@/assets/Logo.png'
import wpIcon from '@/assets/w.png'
import ruletaIcon from '@/assets/ruleta.png'

type View = 'main' | 'roulette'

const validAdmins = ['pawmot', 'bidoof', 'ditto']
const validPassword = 'sellodex2026'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('main')
  const [activeTab, setActiveTab] = useState('register')
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  
  // ESTADOS DEL GLOBO ANIMADO Y DRAGGABLE
  const [showTooltip, setShowTooltip] = useState(true)
  const [tooltipDismissedUntilReload, setTooltipDismissedUntilReload] = useState(false)
  
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [isDraggingTooltip, setIsDraggingTooltip] = useState(false)
  const [isOverDismissZone, setIsOverDismissZone] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const dismissZoneRef = useRef<HTMLDivElement>(null) // ESTE AHORA SOLO APUNTA AL BOTE DE BASURA
  const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 })
  const hasMoved = useRef(false)

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

  const [penaltyMonths, setPenaltyMonths] = useState(() => Number(localStorage.getItem('penaltyMonths')) || 2)
  const [penaltyPercent, setPenaltyPercent] = useState(() => Number(localStorage.getItem('penaltyPercent')) || 70)

  useEffect(() => {
    localStorage.setItem('penaltyMonths', penaltyMonths.toString())
    localStorage.setItem('penaltyPercent', penaltyPercent.toString())
  }, [penaltyMonths, penaltyPercent])

  const { 
    participants, bannedUsers, recentWinners, sponsors, banners,
    addParticipant, deleteParticipant, deleteMultiple, updateStatus, 
    banUser, unbanUser, clearAll, resetGame, addSponsor, deleteSponsor, deleteMultipleSponsors, updateSponsorsOrder, updateSponsorDetails,
    addBanner, updateBanner, deleteBanner, removeRecentWinner, removeMultipleRecentWinners,
    spectatorView, incomingSpin, broadcastView, broadcastSpin, rouletteConfig 
  } = useParticipants()

  const { tournaments } = useTournaments()
  const { polls } = usePolls() 

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

  useEffect(() => {
    if (!isAdmin && !tooltipDismissedUntilReload) {
      const timer = setTimeout(() => setShowTooltip(false), 8000)
      return () => clearTimeout(timer)
    }
  }, [isAdmin, tooltipDismissedUntilReload])

  useEffect(() => {
    if (spectatorView === 'roulette' && currentView !== 'roulette' && !isAdmin && !tooltipDismissedUntilReload) {
      setShowTooltip(true)
      const timer = setTimeout(() => setShowTooltip(false), 8000)
      return () => clearTimeout(timer)
    }
  }, [spectatorView, currentView, isAdmin, tooltipDismissedUntilReload])

  // LÓGICA DE ARRASTRE
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tooltipRef.current) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    hasMoved.current = false;
    const rect = tooltipRef.current.getBoundingClientRect();
    
    dragInfo.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top
    };
    
    setIsDraggingTooltip(true);
    tooltipRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfo.current.isDragging || !tooltipRef.current) return;

    const deltaX = e.clientX - dragInfo.current.startX;
    const deltaY = e.clientY - dragInfo.current.startY;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasMoved.current = true;
    }

    setTooltipPosition({
      x: dragInfo.current.initialLeft + deltaX,
      y: dragInfo.current.initialTop + deltaY
    });

    if (dismissZoneRef.current) {
      const dismissRect = dismissZoneRef.current.getBoundingClientRect();
      
      // Ahora la zona es MUCHO MÁS PRECISA, apuntando solo al círculo
      const isOver = (
        e.clientX >= dismissRect.left &&
        e.clientX <= dismissRect.right &&
        e.clientY >= dismissRect.top &&
        e.clientY <= dismissRect.bottom
      );
      setIsOverDismissZone(isOver);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfo.current.isDragging) return;
    
    dragInfo.current.isDragging = false;
    setIsDraggingTooltip(false);

    if (tooltipRef.current) {
      tooltipRef.current.releasePointerCapture(e.pointerId);
    }

    if (isOverDismissZone) {
      setShowTooltip(false);
      setTooltipDismissedUntilReload(true);
      setIsOverDismissZone(false);
    }
  };

  const handleWidgetClick = (e: React.MouseEvent) => {
    if (hasMoved.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setCurrentView('roulette');
    setShowTooltip(false);
  };

  useEffect(() => { localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false') }, [isAdmin])
  useEffect(() => { if (!showLogin) { setShowPassword(false); setLoginError('') } }, [showLogin])

  useEffect(() => {
    if (!isAdmin) { setCurrentView(spectatorView) }
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
  
  const handleLogout = () => { setIsAdmin(false); setActiveTab('register'); broadcastView('main'); }
  const handleStartRoulette = () => { setCurrentView('roulette'); broadcastView('roulette', { penaltyMonths, penaltyPercent }); }
  const handleExitRoulette = () => { setCurrentView('main'); broadcastView('main'); }

  const submitSponsor = async () => {
    if (!newSponsorUrl.trim()) return
    setAddingSponsor(true); await addSponsor(newSponsorUrl.trim()); setNewSponsorUrl(''); setAddingSponsor(false); setShowSponsorModal(false)
  }

  const handleOpenEditSponsor = (s: any) => { setEditingSponsor(s); setEditSponsorImgUrl(s.image_url); setEditSponsorDestUrl(s.url) }
  const submitEditSponsor = async () => {
    if (!editingSponsor) return
    setIsUpdatingSponsor(true); await updateSponsorDetails(editingSponsor.id, editSponsorImgUrl.trim(), editSponsorDestUrl.trim()); setIsUpdatingSponsor(false); setEditingSponsor(null)
  }

  const moveSponsor = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sponsors.length - 1) return;
    const newSponsors = [...sponsors];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newSponsors[index]; newSponsors[index] = newSponsors[swapIndex]; newSponsors[swapIndex] = temp;
    updateSponsorsOrder(newSponsors);
  }

  const toggleSponsorSelection = (id: string) => {
    const newSelection = new Set(selectedSponsorIds)
    newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id)
    setSelectedSponsorIds(newSelection)
  }

  const handleOpenBannerModal = (id: string = '', img: string = '', link: string = '') => {
    setEditingBannerId(id ? id : null); setBannerImgInput(img); setBannerLinkInput(link); setShowBannerModal(true)
  }

  const submitBanner = async () => {
    if (!bannerImgInput.trim()) return
    setAddingBanner(true)
    if (editingBannerId) { await updateBanner(editingBannerId, bannerImgInput.trim(), bannerLinkInput.trim()) } 
    else { await addBanner(bannerImgInput.trim(), bannerLinkInput.trim()) }
    setBannerImgInput(''); setBannerLinkInput(''); setEditingBannerId(null); setAddingBanner(false); setShowBannerModal(false)
  }

  const hasActivePolls = polls.some(p => p.is_active);
  const hasActiveTournaments = tournaments.some(t => t.status === 'open' || t.status === 'active');

  if (currentView === 'roulette') {
    return (
      <div className="min-h-screen p-4 sm:p-6 text-white" style={{ backgroundColor: '#0661C6', backgroundImage: `url(${fondoImg})`, backgroundSize: '100% auto', backgroundPosition: 'top center', backgroundRepeat: 'no-repeat' }}>
        <WinnerRoulette 
          onBack={isAdmin ? handleExitRoulette : () => setCurrentView('main')} 
          participants={participants} recentWinners={recentWinners} updateStatus={updateStatus} onResetGame={resetGame} 
          isSpectator={!isAdmin} incomingSpin={incomingSpin} broadcastSpin={broadcastSpin} 
          penaltyMonths={isAdmin ? penaltyMonths : rouletteConfig.penaltyMonths}
          penaltyPercent={isAdmin ? penaltyPercent : rouletteConfig.penaltyPercent}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:p-8 relative flex flex-col items-center overflow-x-hidden font-sans" style={{ backgroundColor: '#0661C6', backgroundImage: `url(${fondoImg})`, backgroundSize: '100% auto', backgroundPosition: 'top center', backgroundRepeat: 'no-repeat' }}>
      
      {/* ==================================================== */}
      {/* COMPONENTE DRAGGABLE (BOTÓN + LETRERO) PARA ESPECTADOR */}
      {/* ==================================================== */}
      {!isAdmin && !tooltipDismissedUntilReload && (
        <div 
          ref={tooltipRef}
          className={`fixed z-[60] flex items-center gap-2 select-none touch-none ${isDraggingTooltip ? 'opacity-80 transition-none' : 'transition-transform'}`}
          style={{ 
            left: tooltipPosition.x !== 0 ? `${tooltipPosition.x}px` : undefined, 
            top: tooltipPosition.y !== 0 ? `${tooltipPosition.y}px` : undefined,
            bottom: tooltipPosition.y === 0 ? '1.5rem' : 'auto', 
            right: tooltipPosition.x === 0 ? '1.5rem' : 'auto',  
            cursor: isDraggingTooltip ? 'grabbing' : 'grab'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {showTooltip && (
            <div className={`relative ${!isDraggingTooltip && (spectatorView === 'roulette' ? 'animate-pulse scale-105' : 'hover:scale-105')}`}>
              <div 
                className="bg-[#EF4444] text-white font-black px-4 py-2 sm:py-2.5 rounded-l-xl rounded-tr-xl shadow-lg text-sm sm:text-base tracking-wide flex items-center cursor-pointer" 
                onClick={handleWidgetClick}
              >
                ¡Mira la Ruleta!
              </div>
              <div className="absolute top-1/2 -right-[6px] -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[8px] border-l-[#EF4444] drop-shadow-sm"></div>
            </div>
          )}

          <button
            onClick={handleWidgetClick}
            className="w-16 h-16 sm:w-20 sm:h-20 p-0 bg-white rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.4)] hover:scale-110 transition-all flex items-center justify-center border-4 border-white group overflow-hidden pointer-events-auto shrink-0"
            title="Abrir Ruleta"
          >
            {spectatorView === 'roulette' && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 z-20">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
              </span>
            )}
            <img src={ruletaIcon} alt="Ruleta" className="w-full h-full object-cover relative z-10 group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* ZONA DE ELIMINACIÓN (BASURA) INFERIOR                 */}
      {/* ==================================================== */}
      {!isAdmin && isDraggingTooltip && !tooltipDismissedUntilReload && (
        <div 
          className={`fixed inset-x-0 bottom-0 h-32 bg-gradient-to-t from-red-600/80 to-transparent z-[55] flex flex-col items-center justify-end pb-6 transition-opacity duration-300 animate-in fade-in zoom-in pointer-events-none ${isOverDismissZone ? 'opacity-100' : 'opacity-60'}`}
        >
          {/* EL REF AHORA ESTÁ SOLO EN EL BOTE CIRCULAR */}
          <div 
            ref={dismissZoneRef}
            className={`p-5 rounded-full bg-red-700 text-white shadow-2xl transition-transform ${isOverDismissZone ? 'scale-125 bg-red-800' : 'scale-100'}`}
          >
            <Trash2 className="w-10 h-10" strokeWidth={3} />
          </div>
          <p className="text-white font-bold text-sm mt-3 drop-shadow-md">
            {isOverDismissZone ? '¡Suelta para ocultar!' : 'Arrastra hacia el bote para ocultar'}
          </p>
        </div>
      )}

      {/* Botón flotante Estático para el Admin */}
      {isAdmin && (
        <button
          onClick={() => setCurrentView('roulette')}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 sm:w-20 sm:h-20 p-0 bg-white rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.4)] hover:scale-110 transition-all flex items-center justify-center border-4 border-white group overflow-hidden"
          title="Abrir Ruleta"
        >
          <img src={ruletaIcon} alt="Ruleta" className="w-full h-full object-cover relative z-10 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      <div className="max-w-md w-full relative z-10 flex-1 flex flex-col mt-2 sm:mt-4">
        <div className="absolute -top-2 right-0 z-20">
          {!isAdmin ? (
            <button onClick={() => setShowLogin(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#0661C6] hover:bg-gray-50 transition shadow-lg text-sm font-bold"><LogIn className="w-4 h-4" /> Admin</button>
          ) : (
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-red-600 hover:bg-gray-50 transition shadow-lg text-sm font-bold"><LogOut className="w-4 h-4" /> Salir</button>
          )}
        </div>

        <header className="text-center mb-6 mt-4">
          <img src={logoImg} alt="Pokémon GO GDL" className="w-full max-w-[280px] sm:max-w-[320px] mx-auto drop-shadow-xl relative z-10" />
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          
          <div className="w-full relative -mx-2 px-2 sm:mx-0 sm:px-0 mb-6">
            <TabsList className="w-full flex overflow-x-auto snap-x gap-3 bg-transparent h-auto py-2 px-1 justify-start sm:justify-center no-scrollbar">
              <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
              
              <TabsTrigger value="register" className="snap-center shrink-0 w-auto min-w-[90px] h-[85px] px-4 data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black data-[state=active]:shadow-lg bg-white text-gray-700 rounded-[20px] flex flex-col items-center justify-center gap-1.5 font-bold text-[11px] sm:text-xs shadow-sm border border-gray-100 transition-all">
                <Users className="w-6 h-6 shrink-0" /> <span className="whitespace-nowrap">Registro</span>
              </TabsTrigger>
              
              {(isAdmin || hasActiveTournaments) && (
                <TabsTrigger value="tournaments" className="snap-center shrink-0 w-auto min-w-[90px] h-[85px] px-4 data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black data-[state=active]:shadow-lg bg-white text-gray-700 rounded-[20px] flex flex-col items-center justify-center gap-1.5 font-bold text-[11px] sm:text-xs shadow-sm border border-gray-100 transition-all">
                  <Swords className="w-6 h-6 shrink-0 text-purple-600" /> <span className="whitespace-nowrap">Torneos</span>
                </TabsTrigger>
              )}

              {(isAdmin || hasActivePolls) && (
                <TabsTrigger value="polls" className="snap-center shrink-0 w-auto min-w-[90px] h-[85px] px-4 data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black data-[state=active]:shadow-lg bg-white text-gray-700 rounded-[20px] flex flex-col items-center justify-center gap-1.5 font-bold text-[11px] sm:text-xs shadow-sm border border-gray-100 transition-all">
                  <BarChart3 className="w-6 h-6 shrink-0 text-emerald-500" /> <span className="whitespace-nowrap">Votar</span>
                </TabsTrigger>
              )}

              <TabsTrigger value="friends" className="snap-center shrink-0 w-auto min-w-[90px] h-[85px] px-4 data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black data-[state=active]:shadow-lg bg-white text-gray-700 rounded-[20px] flex flex-col items-center justify-center gap-1.5 font-bold text-[11px] sm:text-xs shadow-sm border border-gray-100 transition-all">
                <Contact className="w-6 h-6 shrink-0 text-blue-500" /> <span className="whitespace-nowrap">Amigos</span>
              </TabsTrigger>

              <TabsTrigger value="sponsors" className="snap-center shrink-0 w-auto min-w-[90px] h-[85px] px-5 data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black data-[state=active]:shadow-lg bg-white text-gray-700 rounded-[20px] flex flex-col items-center justify-center gap-1.5 font-bold text-[11px] sm:text-xs shadow-sm border border-gray-100 transition-all">
                <Heart className="w-6 h-6 shrink-0 text-pink-500" /> <span className="whitespace-nowrap">Patrocinadores</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {isAdmin && (
            <TabsList className="w-full grid grid-cols-2 gap-3 bg-transparent h-auto p-0 mb-6">
              <TabsTrigger value="ruleta" className="data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black bg-white text-gray-800 rounded-2xl py-3.5 flex items-center justify-center gap-2 font-black text-sm shadow-md border-0 transition-all">
                <Trophy className="w-5 h-5" /> Ruleta
              </TabsTrigger>
              <TabsTrigger value="qr" className="data-[state=active]:bg-[#FFF35C] data-[state=active]:text-black bg-white text-gray-800 rounded-2xl py-3.5 flex items-center justify-center gap-2 font-black text-sm shadow-md border-0 transition-all">
                <QrCode className="w-5 h-5" /> QR
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="register" className="mt-0 outline-none"><RegistrationForm saveRegistration={addParticipant} isAdmin={isAdmin} /></TabsContent>
          <TabsContent value="tournaments" className="mt-0 outline-none"><TournamentBoard isAdmin={isAdmin} /></TabsContent>
          <TabsContent value="polls" className="mt-0 outline-none"><PollBoard isAdmin={isAdmin} /></TabsContent>
          <TabsContent value="friends" className="mt-0 outline-none"><FriendBoard isAdmin={isAdmin} /></TabsContent>

          <TabsContent value="sponsors" className="mt-0 outline-none">
             {isAdmin && (
               <div className="w-full bg-white rounded-[24px] shadow-2xl p-6 sm:p-8 mb-6">
                 <div className="mb-8">
                   <h3 className="font-bold text-[#6B21A8] text-xl flex items-center gap-2 mb-1"><ImageIcon className="w-6 h-6"/> Banners Promocionales</h3>
                   <p className="text-sm text-gray-500 mb-4">Imágenes que rotarán en la vista del público.</p>
                   <Button onClick={() => handleOpenBannerModal()} className="w-full bg-[#A855F7] hover:bg-[#9333EA] text-white rounded-xl py-6 font-bold shadow-md text-lg mb-4"><Plus className="w-5 h-5 mr-2" /> Añadir Banner</Button>
                   
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
                     <Button onClick={() => setShowSponsorModal(true)} className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white rounded-xl py-6 font-bold shadow-md text-lg"><Plus className="w-5 h-5 mr-2" /> Añadir Patrocinador</Button>
                     {selectedSponsorIds.size > 0 && <Button variant="destructive" className="w-full rounded-xl py-6 font-bold text-lg" onClick={() => { deleteMultipleSponsors(Array.from(selectedSponsorIds)); setSelectedSponsorIds(new Set()) }}><Trash2 className="w-5 h-5 mr-2" /> Borrar ({selectedSponsorIds.size})</Button>}
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
                       return ( <a key={banner.id} href={banner.link_url} target="_blank" rel="noopener noreferrer" className={commonClasses}><img src={banner.image_url} alt="Oferta" className="w-full h-full object-cover" /></a> )
                     }
                     return ( <div key={banner.id} className={commonClasses}><img src={banner.image_url} alt="Oferta" className="w-full h-full object-cover" /></div> )
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
                  participants={participants} bannedUsers={bannedUsers} recentWinners={recentWinners} 
                  onDelete={deleteParticipant} onDeleteMultiple={deleteMultiple} onClearAll={clearAll} 
                  onStartRoulette={handleStartRoulette} onBanUser={banUser} onUnbanUser={unbanUser} 
                  onRemoveWinner={removeRecentWinner} onRemoveMultipleWinners={removeMultipleRecentWinners}
                  penaltyMonths={penaltyMonths} setPenaltyMonths={setPenaltyMonths} 
                  penaltyPercent={penaltyPercent} setPenaltyPercent={setPenaltyPercent}
                />
              </TabsContent>
              <TabsContent value="qr" className="mt-0 outline-none bg-white p-4 rounded-2xl shadow-2xl"><QRCodeDisplay url={registrationUrl} /></TabsContent>
            </>
          )}
        </Tabs>
        
        <footer className="mt-10 pb-24 text-center z-10 text-white">
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

      {/* MODALES DE PATROCINADORES Y BANNERS */}
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