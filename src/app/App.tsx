import { useState, useEffect, useRef } from 'react'
import { RegistrationForm } from '@/app/components/RegistrationForm'
import { AdminPanel } from '@/app/components/AdminPanel'
import { WinnerRoulette } from '@/app/components/WinnerRoulette'
import { QRCodeDisplay } from '@/app/components/QRCodeDisplay'
import { FriendBoard } from '@/app/components/FriendBoard'
import { TournamentBoard } from '@/app/components/TournamentBoard'
import { PollBoard } from '@/app/components/PollBoard'
import { MeetingMaps } from '@/app/components/MeetingMaps'
import { SocialLinks } from '@/app/components/SocialLinks'
import { MobileShell, type NavTab } from '@/app/components/layout/MobileShell'
import { Trophy, Eye, EyeOff, Instagram, Image as ImageIcon, Plus, Trash2, ChevronUp, ChevronDown, Pencil } from 'lucide-react'
import { useParticipants } from '@/hooks/useParticipants'
import { useTournaments } from '@/hooks/useTournaments'
import { usePolls } from '@/hooks/usePolls'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Checkbox } from '@/app/components/ui/checkbox'

import fondoImg from '@/assets/FondoMew.jpg'

type View = 'main' | 'roulette'

const validAdmins = ['pawmot', 'bidoof', 'ditto']
const validPassword = 'sellodex2026'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('main')
  const [activeTab, setActiveTab] = useState<NavTab>('register')
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
      setIsAdmin(true); setShowLogin(false); setActiveTab('ruleta' as NavTab); setLoginError(''); setUsernameInput(''); setPasswordInput('')
    } else {
      setLoginError('Usuario o contraseña incorrectos')
    }
  }

  const onLoginSubmit = (e: React.FormEvent) => { e.preventDefault(); handleLogin() }
  const handleUsernameKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); passwordRef.current?.focus() } }
  
  const handleLogout = () => { setIsAdmin(false); setActiveTab('register' as NavTab); broadcastView('main'); }
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

  const openRoulette = () => {
    setActiveTab('ruleta')
    if (isAdmin) handleStartRoulette()
    else setCurrentView('roulette')
  }

  const handleTabChange = (tab: NavTab) => {
    if (currentView === 'roulette') setCurrentView('main')
    setActiveTab(tab)
  }

  const renderMainContent = () => {
    if (currentView === 'roulette') {
      return (
        <WinnerRoulette 
          onBack={isAdmin ? handleExitRoulette : () => setCurrentView('main')} 
          participants={participants} recentWinners={recentWinners} updateStatus={updateStatus} onResetGame={resetGame} 
          isSpectator={!isAdmin} embedded incomingSpin={incomingSpin} broadcastSpin={broadcastSpin} 
          penaltyMonths={isAdmin ? penaltyMonths : rouletteConfig.penaltyMonths}
          penaltyPercent={isAdmin ? penaltyPercent : rouletteConfig.penaltyPercent}
        />
      )
    }
    switch (activeTab) {
      case 'register':
        return <RegistrationForm saveRegistration={addParticipant} isAdmin={isAdmin} />
      case 'friends':
        return <FriendBoard isAdmin={isAdmin} />
      case 'tournaments':
        return (isAdmin || hasActiveTournaments) ? (
          <TournamentBoard isAdmin={isAdmin} />
        ) : (
          <p className="text-center text-[#0d3b66]/60 py-8">No hay torneos activos en este momento.</p>
        )
      case 'polls':
        return (isAdmin || hasActivePolls) ? (
          <PollBoard isAdmin={isAdmin} />
        ) : (
          <p className="text-center text-[#0d3b66]/60 py-8">No hay votaciones activas.</p>
        )
      case 'maps':
        return <MeetingMaps />
      case 'social':
        return <SocialLinks installPrompt={installPrompt} onInstall={handleInstallApp} compact />
      case 'sponsors':
        return (
          <>
            {isAdmin && (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h3 className="font-bold text-[#6B21A8] text-lg flex items-center gap-2 mb-1">
                  <ImageIcon className="w-5 h-5" /> Banners
                </h3>
                <Button onClick={() => handleOpenBannerModal()} className="w-full bg-[#A855F7] hover:bg-[#9333EA] text-white rounded-xl py-4 font-bold mb-4">
                  <Plus className="w-4 h-4 mr-2" /> Añadir Banner
                </Button>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {banners.map((b) => (
                    <div key={b.id} className="relative w-32 h-20 flex-shrink-0 rounded-xl overflow-hidden group border border-gray-200">
                      <img src={b.image_url} alt="Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
                        <Button variant="secondary" size="icon" className="w-8 h-8 rounded-full" onClick={() => handleOpenBannerModal(b.id, b.image_url, b.link_url)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="icon" className="w-8 h-8 rounded-full" onClick={() => deleteBanner(b.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <h3 className="font-bold text-[#9D174D] text-lg flex items-center gap-2 mt-6 mb-3">
                  <Instagram className="w-5 h-5" /> Patrocinadores
                </h3>
                <Button onClick={() => setShowSponsorModal(true)} className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white rounded-xl py-4 font-bold mb-3">
                  <Plus className="w-4 h-4 mr-2" /> Añadir
                </Button>
                {selectedSponsorIds.size > 0 && (
                  <Button variant="destructive" className="w-full rounded-xl mb-3" onClick={() => { deleteMultipleSponsors(Array.from(selectedSponsorIds)); setSelectedSponsorIds(new Set()) }}>
                    Borrar ({selectedSponsorIds.size})
                  </Button>
                )}
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {sponsors.map((s, index) => (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border">
                      <div className="flex items-center gap-2 min-w-0">
                        <Checkbox checked={selectedSponsorIds.has(s.id)} onCheckedChange={() => toggleSponsorSelection(s.id)} />
                        <button onClick={() => moveSponsor(index, 'up')} disabled={index === 0}><ChevronUp className="w-4 h-4" /></button>
                        <button onClick={() => moveSponsor(index, 'down')} disabled={index === sponsors.length - 1}><ChevronDown className="w-4 h-4" /></button>
                        <img src={s.image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <span className="text-sm font-bold truncate">@{s.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditSponsor(s)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteSponsor(s.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <h2 className="text-xl font-black text-[#0d3b66] text-center mb-2">Nuestros Patrocinadores</h2>
            <p className="text-sm text-gray-500 text-center mb-6">Toca su foto para visitar su Instagram.</p>
            {banners.length > 0 && (
              <div className="relative w-full h-32 rounded-xl overflow-hidden mb-6 bg-gray-100">
                {banners.map((banner, i) => {
                  const isActive = i === currentBannerIndex
                  const cls = `absolute inset-0 w-full h-full transition-opacity duration-1000 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`
                  if (banner.link_url) {
                    return <a key={banner.id} href={banner.link_url} target="_blank" rel="noopener noreferrer" className={cls}><img src={banner.image_url} alt="" className="w-full h-full object-cover" /></a>
                  }
                  return <div key={banner.id} className={cls}><img src={banner.image_url} alt="" className="w-full h-full object-cover" /></div>
                })}
              </div>
            )}
            {sponsors.length === 0 ? (
              <p className="text-center py-8 text-gray-400">Reuniendo patrocinadores...</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {sponsors.map((sponsor) => (
                  <a key={sponsor.id} href={sponsor.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full p-[2px] bg-gray-200 hover:bg-[#D946EF] transition-all">
                      <img src={sponsor.image_url} alt={sponsor.name} className="w-full h-full rounded-full object-cover border-2 border-white" onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + sponsor.name }} />
                    </div>
                    <span className="mt-1 text-[10px] font-bold text-gray-600 truncate w-full text-center">@{sponsor.name}</span>
                  </a>
                ))}
              </div>
            )}
          </>
        )
      case 'ruleta':
        return isAdmin ? (
          <AdminPanel
            participants={participants}
            bannedUsers={bannedUsers}
            recentWinners={recentWinners}
            onDelete={deleteParticipant}
            onDeleteMultiple={deleteMultiple}
            onClearAll={clearAll}
            onStartRoulette={handleStartRoulette}
            onBanUser={banUser}
            onUnbanUser={unbanUser}
            onRemoveWinner={removeRecentWinner}
            onRemoveMultipleWinners={removeMultipleRecentWinners}
            penaltyMonths={penaltyMonths}
            setPenaltyMonths={setPenaltyMonths}
            penaltyPercent={penaltyPercent}
            setPenaltyPercent={setPenaltyPercent}
          />
        ) : null
      case 'qr':
        return isAdmin ? <QRCodeDisplay url={registrationUrl} /> : null
      default:
        return <RegistrationForm saveRegistration={addParticipant} isAdmin={isAdmin} />
    }
  }

  return (
    <>
      <MobileShell
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenRoulette={openRoulette}
        isAdmin={isAdmin}
        onAdminLogin={() => setShowLogin(true)}
        onAdminLogout={handleLogout}
        showTournaments={isAdmin || hasActiveTournaments}
        showPolls={isAdmin || hasActivePolls}
      >
        {renderMainContent()}
      </MobileShell>

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
    </>
  )
}