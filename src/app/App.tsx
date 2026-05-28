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
import { Eye, EyeOff, Instagram, Image as ImageIcon, Plus, Trash2, Pencil, Link as LinkIcon, GripVertical, MoreVertical, X } from 'lucide-react'
import { useParticipants } from '@/hooks/useParticipants'
import { useTournaments } from '@/hooks/useTournaments'
import { usePolls } from '@/hooks/usePolls'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Checkbox } from '@/app/components/ui/checkbox'
import { buildRouletteRegistrationUrl, DEFAULT_ROULETTE_CODE, sanitizeRouletteCode } from '@/app/utils/rouletteCode'

type View = 'main' | 'roulette'

const validAdmins = ['pawmot', 'bidoof', 'ditto']
const validPassword = 'sellodex2026'

export default function App() {
  const [activeRouletteCode, setActiveRouletteCode] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_ROULETTE_CODE
    const fromUrl = new URLSearchParams(window.location.search).get('r')
    return sanitizeRouletteCode(fromUrl ?? DEFAULT_ROULETTE_CODE)
  })
  const [rouletteCodes, setRouletteCodes] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [DEFAULT_ROULETTE_CODE]
    const raw = localStorage.getItem('rouletteCodes')
    if (!raw) return [DEFAULT_ROULETTE_CODE]
    try {
      const parsed = JSON.parse(raw) as string[]
      const sanitized = parsed.map((code) => sanitizeRouletteCode(code)).filter(Boolean)
      return Array.from(new Set([DEFAULT_ROULETTE_CODE, ...sanitized]))
    } catch {
      return [DEFAULT_ROULETTE_CODE]
    }
  })

  const [currentView, setCurrentView] = useState<View>('main')
  const [activeTab, setActiveTab] = useState<NavTab>('register')
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

  const [showSponsorModal, setShowSponsorModal] = useState(false)
  const [newSponsorName, setNewSponsorName] = useState('')
  const [newSponsorUrl, setNewSponsorUrl] = useState('')
  const [newSponsorImage, setNewSponsorImage] = useState('')
  const [newSponsorImageName, setNewSponsorImageName] = useState('')
  const [processingSponsorImage, setProcessingSponsorImage] = useState(false)
  const [addingSponsor, setAddingSponsor] = useState(false)
  const [selectedSponsorIds, setSelectedSponsorIds] = useState<Set<string>>(new Set())

  const [editingSponsor, setEditingSponsor] = useState<any>(null)
  const [editSponsorImgUrl, setEditSponsorImgUrl] = useState('')
  const [editSponsorDestUrl, setEditSponsorDestUrl] = useState('')
  const [editSponsorImageName, setEditSponsorImageName] = useState('')
  const [processingEditSponsorImage, setProcessingEditSponsorImage] = useState(false)
  const [isUpdatingSponsor, setIsUpdatingSponsor] = useState(false)
  const [draggingSponsorId, setDraggingSponsorId] = useState<string | null>(null)
  const [dragOverSponsorId, setDragOverSponsorId] = useState<string | null>(null)
  const [openSponsorActionsId, setOpenSponsorActionsId] = useState<string | null>(null)

  const [showBannerModal, setShowBannerModal] = useState(false)
  const [bannerImgInput, setBannerImgInput] = useState('')
  const [bannerLinkInput, setBannerLinkInput] = useState('')
  const [bannerImageName, setBannerImageName] = useState('')
  const [processingBannerImage, setProcessingBannerImage] = useState(false)
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
    deleteRouletteData, spectatorView, incomingSpin, broadcastView, broadcastSpin, rouletteConfig 
  } = useParticipants(activeRouletteCode)

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
  const registrationUrl = typeof window !== 'undefined' ? window.location.origin : ''

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
    if (!rouletteCodes.includes(activeRouletteCode)) {
      setRouletteCodes((prev) => Array.from(new Set([...prev, activeRouletteCode])))
    }
  }, [activeRouletteCode, rouletteCodes])

  useEffect(() => {
    localStorage.setItem('rouletteCodes', JSON.stringify(rouletteCodes))
  }, [rouletteCodes])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const nextUrl = buildRouletteRegistrationUrl(window.location.origin, activeRouletteCode)
    window.history.replaceState({}, '', nextUrl)
  }, [activeRouletteCode])

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => { setCurrentBannerIndex((prev) => (prev + 1) % banners.length) }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    if (!openSponsorActionsId) return
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-sponsor-actions-root="true"]')) return
      setOpenSponsorActionsId(null)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [openSponsorActionsId])

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
  const handleCreateRouletteCode = (rawCode: string) => {
    const nextCode = sanitizeRouletteCode(rawCode)
    setRouletteCodes((prev) => (prev.includes(nextCode) ? prev : [...prev, nextCode]))
    setActiveRouletteCode(nextCode)
  }

  const handleDeleteRouletteCode = async (rawCode: string) => {
    const code = sanitizeRouletteCode(rawCode)
    if (code === DEFAULT_ROULETTE_CODE) return
    await deleteRouletteData(code)
    setRouletteCodes((prev) => prev.filter((item) => item !== code))
    setActiveRouletteCode((prev) => (prev === code ? DEFAULT_ROULETTE_CODE : prev))
  }

  const handleStartRoulette = () => { setCurrentView('roulette'); broadcastView('roulette', { penaltyMonths, penaltyPercent }); }
  const handleExitRoulette = () => { setCurrentView('main'); broadcastView('main'); }

  const optimizeImageFile = (file: File, maxDimension = 1200, quality = 0.85): Promise<string> => {
    if (file.type === 'image/svg+xml') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('No se pudo leer la imagen'))
        reader.readAsDataURL(file)
      })
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const image = new Image()
        image.onload = () => {
          const ratio = Math.min(1, maxDimension / Math.max(image.width, image.height))
          const width = Math.max(1, Math.round(image.width * ratio))
          const height = Math.max(1, Math.round(image.height * ratio))
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('No se pudo preparar la imagen'))
            return
          }
          ctx.drawImage(image, 0, 0, width, height)
          const usePng = file.type === 'image/png' || file.type === 'image/webp'
          resolve(canvas.toDataURL(usePng ? 'image/png' : 'image/jpeg', quality))
        }
        image.onerror = () => reject(new Error('No se pudo procesar la imagen'))
        image.src = String(reader.result || '')
      }
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
      reader.readAsDataURL(file)
    })
  }

  const handleSponsorFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setProcessingSponsorImage(true)
    try {
      const dataUrl = await optimizeImageFile(file)
      setNewSponsorImage(dataUrl)
      setNewSponsorImageName(file.name)
    } finally {
      setProcessingSponsorImage(false)
      event.target.value = ''
    }
  }

  const handleEditSponsorFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setProcessingEditSponsorImage(true)
    try {
      const dataUrl = await optimizeImageFile(file)
      setEditSponsorImgUrl(dataUrl)
      setEditSponsorImageName(file.name)
    } finally {
      setProcessingEditSponsorImage(false)
      event.target.value = ''
    }
  }

  const handleBannerFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setProcessingBannerImage(true)
    try {
      const dataUrl = await optimizeImageFile(file)
      setBannerImgInput(dataUrl)
      setBannerImageName(file.name)
    } finally {
      setProcessingBannerImage(false)
      event.target.value = ''
    }
  }

  const closeSponsorModal = () => {
    setShowSponsorModal(false)
    setNewSponsorName('')
    setNewSponsorUrl('')
    setNewSponsorImage('')
    setNewSponsorImageName('')
  }

  const closeBannerModal = () => {
    setShowBannerModal(false)
    setBannerImgInput('')
    setBannerLinkInput('')
    setBannerImageName('')
    setEditingBannerId(null)
  }

  const submitSponsor = async () => {
    if (!newSponsorUrl.trim() && !newSponsorImage) return
    setAddingSponsor(true)
    await addSponsor(newSponsorUrl.trim(), newSponsorImage || undefined, newSponsorName.trim() || undefined)
    setAddingSponsor(false)
    closeSponsorModal()
  }

  const handleOpenEditSponsor = (s: any) => { setEditingSponsor(s); setEditSponsorImgUrl(s.image_url); setEditSponsorDestUrl(s.url); setEditSponsorImageName('') }
  const submitEditSponsor = async () => {
    if (!editingSponsor) return
    setIsUpdatingSponsor(true); await updateSponsorDetails(editingSponsor.id, editSponsorImgUrl.trim(), editSponsorDestUrl.trim()); setIsUpdatingSponsor(false); setEditingSponsor(null)
  }

  const handleSponsorDragStart = (sponsorId: string) => {
    setDraggingSponsorId(sponsorId)
  }

  const handleSponsorDragEnd = () => {
    setDraggingSponsorId(null)
    setDragOverSponsorId(null)
  }

  const handleSponsorDrop = async (targetSponsorId: string) => {
    if (!draggingSponsorId || draggingSponsorId === targetSponsorId) {
      setDragOverSponsorId(null)
      return
    }

    const fromIndex = sponsors.findIndex((s) => s.id === draggingSponsorId)
    const toIndex = sponsors.findIndex((s) => s.id === targetSponsorId)
    if (fromIndex === -1 || toIndex === -1) {
      setDragOverSponsorId(null)
      return
    }

    const reordered = [...sponsors]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    await updateSponsorsOrder(reordered)
    setDragOverSponsorId(null)
  }

  const toggleSponsorSelection = (id: string) => {
    const newSelection = new Set(selectedSponsorIds)
    newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id)
    setSelectedSponsorIds(newSelection)
  }

  const handleOpenBannerModal = (id: string = '', img: string = '', link: string = '') => {
    setEditingBannerId(id ? id : null); setBannerImgInput(img); setBannerLinkInput(link); setBannerImageName(''); setShowBannerModal(true)
  }

  const submitBanner = async () => {
    if (!bannerImgInput.trim()) return
    setAddingBanner(true)
    if (editingBannerId) { await updateBanner(editingBannerId, bannerImgInput.trim(), bannerLinkInput.trim()) } 
    else { await addBanner(bannerImgInput.trim(), bannerLinkInput.trim()) }
    setBannerImgInput(''); setBannerLinkInput(''); setBannerImageName(''); setEditingBannerId(null); setAddingBanner(false); setShowBannerModal(false)
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
          rouletteCodes={rouletteCodes}
          activeRouletteCode={activeRouletteCode}
          onChangeRouletteCode={isAdmin ? setActiveRouletteCode : undefined}
          onCreateRouletteCode={isAdmin ? handleCreateRouletteCode : undefined}
          onDeleteRouletteCode={isAdmin ? handleDeleteRouletteCode : undefined}
          registrationBaseUrl={registrationUrl}
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
                  <ImageIcon className="w-5 h-5" /> Banner de anuncio
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
                <div className="rounded-2xl border border-[#f5d0fe] bg-gradient-to-b from-[#fdf4ff] via-white to-white p-4 space-y-3">
                  <Button onClick={() => setShowSponsorModal(true)} className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white rounded-xl py-4 font-bold">
                    <Plus className="w-4 h-4 mr-2" /> Agregar patrocinador
                  </Button>

                  {selectedSponsorIds.size > 0 && (
                    <Button
                      variant="destructive"
                      className="w-full rounded-xl"
                      onClick={() => {
                        deleteMultipleSponsors(Array.from(selectedSponsorIds))
                        setSelectedSponsorIds(new Set())
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar seleccionados ({selectedSponsorIds.size})
                    </Button>
                  )}

                  {sponsors.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#e9d5ff] bg-white px-4 py-6 text-center">
                      <p className="font-bold text-[#7E22CE] mb-1">Aun no hay patrocinadores</p>
                      <p className="text-xs text-[#6b7280]">Presiona "Agregar patrocinador" y pega su Instagram o enlace.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {sponsors.map((s) => (
                        <div
                          key={s.id}
                          className={`rounded-xl border bg-white p-2.5 transition-colors ${
                            dragOverSponsorId === s.id ? 'border-[#d946ef] bg-[#fdf4ff]' : 'border-[#f3e8ff]'
                          }`}
                          onDragOver={(e) => {
                            e.preventDefault()
                            if (dragOverSponsorId !== s.id) setDragOverSponsorId(s.id)
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            void handleSponsorDrop(s.id)
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <button
                                type="button"
                                draggable
                                onDragStart={() => handleSponsorDragStart(s.id)}
                                onDragEnd={handleSponsorDragEnd}
                                className={`h-9 w-6 rounded-md border border-dashed ${
                                  draggingSponsorId === s.id
                                    ? 'border-[#d946ef] bg-[#fdf4ff] text-[#a21caf]'
                                    : 'border-[#e4d5f8] bg-[#faf5ff] text-[#7e22ce]'
                                } inline-flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing`}
                                aria-label={`Mover @${s.name}`}
                                title="Mantén pulsado y arrastra para reordenar"
                              >
                                <GripVertical className="w-4 h-4" />
                              </button>
                              <Checkbox checked={selectedSponsorIds.has(s.id)} onCheckedChange={() => toggleSponsorSelection(s.id)} />
                              <img src={s.image_url} alt={s.name} className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#3f3f46] break-all leading-tight">@{s.name}</p>
                                <p className="text-[11px] text-gray-500 break-all leading-tight flex items-center gap-1">
                                  <LinkIcon className="w-3 h-3 shrink-0" />
                                  {s.url}
                                </p>
                              </div>
                            </div>

                            <div data-sponsor-actions-root="true" className="relative flex items-center shrink-0 pl-1 border-l border-[#f3e8ff]">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 rounded-lg text-[#7c3aed]"
                                aria-label={`Opciones de @${s.name}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenSponsorActionsId((prev) => (prev === s.id ? null : s.id))
                                }}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>

                              {openSponsorActionsId === s.id && (
                                <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-[#ead5ff] bg-white shadow-lg z-30 overflow-hidden">
                                  <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm font-medium text-[#4c1d95] hover:bg-[#faf5ff] flex items-center gap-2"
                                    onClick={() => {
                                      handleOpenEditSponsor(s)
                                      setOpenSponsorActionsId(null)
                                    }}
                                  >
                                    <Pencil className="w-4 h-4" />
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    onClick={() => {
                                      deleteSponsor(s.id)
                                      setOpenSponsorActionsId(null)
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
              <div className="grid grid-cols-3 gap-3">
                {sponsors.map((sponsor) => (
                  <a
                    key={sponsor.id}
                    href={sponsor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-2xl border border-[#f2e8ff] bg-white/90 px-2 py-3 shadow-[0_2px_10px_rgba(168,85,247,0.08)] hover:shadow-[0_6px_18px_rgba(168,85,247,0.16)] transition-all flex flex-col items-center justify-start text-center"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full p-[2px] bg-gray-200 hover:bg-[#D946EF] transition-all">
                      <img src={sponsor.image_url} alt={sponsor.name} className="w-full h-full rounded-full object-cover border-2 border-white" onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + sponsor.name }} />
                    </div>
                    <span className="mt-2 text-[11px] font-bold text-[#5b3b89] leading-tight break-words w-full text-center">
                      {sponsor.name}
                    </span>
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
            rouletteCodes={rouletteCodes}
            activeRouletteCode={activeRouletteCode}
            onChangeRouletteCode={setActiveRouletteCode}
          />
        ) : null
      case 'qr':
        return isAdmin ? (
          <QRCodeDisplay
            baseUrl={registrationUrl}
            rouletteCodes={rouletteCodes}
            activeCode={activeRouletteCode}
            onSelectCode={setActiveRouletteCode}
            onCreateCode={handleCreateRouletteCode}
            onDeleteCode={handleDeleteRouletteCode}
          />
        ) : null
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeSponsorModal}>
          <div className="bg-white rounded-[24px] shadow-2xl p-6 sm:p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-5"><div className="bg-pink-50 p-4 rounded-full text-[#D946EF] shadow-inner"><Instagram className="w-8 h-8" /></div></div>
            <h2 className="text-2xl font-black mb-2 text-center text-gray-800">Añadir Patrocinador</h2>
            <p className="text-sm text-gray-500 mb-4 text-center leading-relaxed">Pega el Instagram; si la imagen no es visible, puedes subir una.</p>
            <div className="space-y-3 mb-6">
              <Input placeholder="Nombre visible (opcional)" value={newSponsorName} onChange={(e) => setNewSponsorName(e.target.value)} className="border-gray-200 focus-visible:ring-[#D946EF] rounded-xl px-4 py-6 bg-gray-50 text-base" />
              <Input autoFocus placeholder="Ej: https://instagram.com/michiblue2299" value={newSponsorUrl} onChange={(e) => setNewSponsorUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitSponsor()} className="border-gray-200 focus-visible:ring-[#D946EF] rounded-xl px-4 py-6 bg-gray-50 text-base" />
              <div className="rounded-xl border border-dashed border-[#f5d0fe] bg-[#fdf4ff] p-3">
                <label htmlFor="sponsor-image-upload" className="w-full h-10 rounded-lg bg-white border border-[#e9d5ff] text-[#9D174D] font-bold inline-flex items-center justify-center cursor-pointer">
                  Subir imagen desde dispositivo
                </label>
                <input id="sponsor-image-upload" type="file" accept="image/*" className="hidden" onChange={handleSponsorFileChange} />
                {processingSponsorImage && <p className="text-xs text-[#9D174D] mt-2">Procesando imagen...</p>}
                {newSponsorImage && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={newSponsorImage} alt="Vista previa patrocinador" className="w-14 h-14 rounded-full object-cover border border-[#e9d5ff]" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#9D174D] truncate">{newSponsorImageName || 'Imagen seleccionada'}</p>
                      <button
                        type="button"
                        onClick={() => { setNewSponsorImage(''); setNewSponsorImageName('') }}
                        className="text-[11px] font-bold text-red-600 mt-1"
                      >
                        Quitar imagen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={submitSponsor} disabled={addingSponsor || (!newSponsorUrl.trim() && !newSponsorImage)} className="w-full rounded-xl py-6 bg-[#D946EF] hover:bg-[#C026D3] text-white font-bold text-lg">{addingSponsor ? 'Guardando...' : 'Guardar'}</Button>
              <Button variant="outline" className="w-full rounded-xl py-6 font-bold text-gray-600 border-0 bg-gray-100 hover:bg-gray-200 text-lg" onClick={closeSponsorModal}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {editingSponsor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingSponsor(null)}>
          <div className="bg-white rounded-[24px] shadow-2xl p-5 sm:p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9" />
              <h2 className="text-2xl font-black text-center text-gray-800">Editar Patrocinador</h2>
              <button
                type="button"
                onClick={() => setEditingSponsor(null)}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 inline-flex items-center justify-center"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6 text-center leading-relaxed">Actualiza la foto o el enlace para <span className="font-bold text-gray-900">@{editingSponsor.name}</span>.</p>
            <div className="space-y-4 mb-6">
              <div className="rounded-xl border border-dashed border-[#f5d0fe] bg-[#fdf4ff] p-3">
                <label htmlFor="edit-sponsor-image-upload" className="w-full h-10 rounded-lg bg-white border border-[#e9d5ff] text-[#9D174D] font-bold inline-flex items-center justify-center cursor-pointer">
                  Subir nueva imagen
                </label>
                <input id="edit-sponsor-image-upload" type="file" accept="image/*" className="hidden" onChange={handleEditSponsorFileChange} />
                {processingEditSponsorImage && <p className="text-xs text-[#9D174D] mt-2">Procesando imagen...</p>}
                {editSponsorImgUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={editSponsorImgUrl} alt="Vista previa patrocinador" className="w-14 h-14 rounded-full object-cover border border-[#e9d5ff]" />
                    <p className="text-xs font-semibold text-[#9D174D] truncate">{editSponsorImageName || 'Imagen actual'}</p>
                  </div>
                )}
              </div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeBannerModal}>
          <div className="bg-white rounded-[24px] shadow-2xl p-6 sm:p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9" />
              <h2 className="text-2xl font-black text-center text-gray-800">{editingBannerId ? 'Editar Banner' : 'Añadir Banner'}</h2>
              <button
                type="button"
                onClick={closeBannerModal}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 inline-flex items-center justify-center"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6 text-center leading-relaxed">Sube la imagen desde tu dispositivo o pega el enlace. Tambien puedes definir el enlace de destino.</p>
            <div className="space-y-4 mb-6">
              <div className="rounded-xl border border-dashed border-[#e9d5ff] bg-[#f5f3ff] p-3">
                <label htmlFor="banner-image-upload" className="w-full h-10 rounded-lg bg-white border border-[#ddd6fe] text-[#6D28D9] font-bold inline-flex items-center justify-center cursor-pointer">
                  Subir imagen desde dispositivo
                </label>
                <input id="banner-image-upload" type="file" accept="image/*" className="hidden" onChange={handleBannerFileChange} />
                {processingBannerImage && <p className="text-xs text-[#6D28D9] mt-2">Procesando imagen...</p>}
                {bannerImgInput && (
                  <div className="mt-3">
                    <img src={bannerImgInput} alt="Vista previa banner" className="w-full h-24 rounded-lg object-cover border border-[#ddd6fe]" />
                    <p className="text-xs font-semibold text-[#6D28D9] mt-1 truncate">{bannerImageName || 'Imagen seleccionada'}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Enlace al dar click</label>
                <Input autoFocus placeholder="Link" value={bannerLinkInput} onChange={(e) => setBannerLinkInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitBanner()} className="border-gray-200 focus-visible:ring-[#A855F7] rounded-xl px-4 py-5 bg-gray-50 text-base" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={submitBanner} disabled={addingBanner || !bannerImgInput} className="w-full rounded-xl py-6 bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold text-lg">{addingBanner ? 'Guardando...' : 'Guardar Banner'}</Button>
              <Button variant="outline" className="w-full rounded-xl py-6 font-bold text-gray-600 border-0 bg-gray-100 hover:bg-gray-200 text-lg" onClick={closeBannerModal}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}