import { ReactNode, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Menu,
  X,
  CircleDot,
  Users,
  Contact,
  Swords,
  ShoppingBag,
  Share2,
  MapPin,
  CalendarDays,
  BarChart3,
  LogIn,
  LogOut,
  QrCode,
  Trophy,
  HelpCircle,
  Stamp,
} from 'lucide-react'
import { FaqPanel } from '@/app/components/FaqPanel'
import { StampRecoveryPanel } from '@/app/components/StampRecoveryPanel'
import fondoImg from '@/assets/FondoCD.png'
import logoImg from '@/assets/logos/Logo.png'
import pokebolaImg from '@/assets/iconos/Pokebola.png'
import ruletaIcon from '@/assets/iconos/ruleta.png'

export type NavTab =
  | 'register'
  | 'friends'
  | 'sponsors'
  | 'tournaments'
  | 'polls'
  | 'maps'
  | 'events'
  | 'social'
  | 'ruleta'
  | 'qr'

type BottomNavId = NavTab | 'roulette-action'

interface MobileShellProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
  onOpenRoulette: () => void
  children: ReactNode
  isAdmin?: boolean
  onAdminLogin?: () => void
  onAdminLogout?: () => void
  showTournaments?: boolean
  showPolls?: boolean
}

const menuItems: {
  id: NavTab | 'roulette-action'
  label: string
  icon: typeof CircleDot
}[] = [
  { id: 'roulette-action', label: 'Ruleta', icon: CircleDot },
  { id: 'social', label: 'Redes sociales', icon: Share2 },
  { id: 'sponsors', label: 'Patrocinadores', icon: ShoppingBag },
  { id: 'friends', label: 'Amigos', icon: Contact },
  { id: 'polls', label: 'Votación', icon: BarChart3 },
  { id: 'maps', label: 'Maps', icon: MapPin },
  { id: 'events', label: 'Eventos', icon: CalendarDays },
]

const NAV_META: Record<
  BottomNavId,
  { label: string; iconSrc?: string; Lucide?: LucideIcon }
> = {
  'roulette-action': { label: 'RULETA', iconSrc: ruletaIcon },
  friends: { label: 'AMIGOS', Lucide: Users },
  register: { label: 'REGISTRO', iconSrc: pokebolaImg },
  tournaments: { label: 'TORNEO', Lucide: Swords },
  sponsors: { label: 'PATROCIN.', Lucide: ShoppingBag },
  polls: { label: 'VOTACIÓN', Lucide: BarChart3 },
  maps: { label: 'MAPS', Lucide: MapPin },
  events: { label: 'EVENTOS', Lucide: CalendarDays },
  social: { label: 'REDES', Lucide: Share2 },
  ruleta: { label: 'RULETA', iconSrc: ruletaIcon },
  qr: { label: 'QR', Lucide: QrCode },
}

function navItems(showTournaments: boolean): BottomNavId[] {
  if (showTournaments) {
    return ['roulette-action', 'friends', 'register', 'tournaments', 'sponsors']
  }
  return ['roulette-action', 'friends', 'register', 'social', 'sponsors']
}

export function MobileShell({
  activeTab,
  onTabChange,
  onOpenRoulette,
  children,
  isAdmin = false,
  onAdminLogin,
  onAdminLogout,
  showTournaments = true,
  showPolls = true,
}: MobileShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(false)
  const [stampRecoveryOpen, setStampRecoveryOpen] = useState(false)

  const handleMenuSelect = (id: NavTab | 'roulette-action') => {
    setMenuOpen(false)
    if (id === 'roulette-action') {
      onOpenRoulette()
      return
    }
    onTabChange(id)
  }

  const handleNavPress = (id: BottomNavId) => {
    if (id === 'roulette-action') {
      onOpenRoulette()
      return
    }
    onTabChange(id)
  }

  const items = navItems(showTournaments)
  const normalizedActiveId: BottomNavId =
    activeTab === 'ruleta'
      ? 'roulette-action'
      : items.includes(activeTab as BottomNavId)
        ? (activeTab as BottomNavId)
        : 'register'
  const activeId: BottomNavId = normalizedActiveId
  const activeIndex = items.indexOf(activeId)
  const orderedForDisplay = Array.from({ length: 5 }, (_, pos) => {
    const idx = (activeIndex + (pos - 2) + items.length) % items.length
    return items[idx]
  })

  const renderIcon = (id: BottomNavId, isCenter: boolean, isActive: boolean) => {
    const meta = NAV_META[id]
    if (meta.iconSrc) {
      return (
        <div
          className={`transition-all ${isCenter ? 'w-8 h-8' : 'w-6 h-6'} ${isActive ? '' : 'opacity-70'}`}
          style={{
            backgroundColor: 'currentColor',
            WebkitMask: `url(${meta.iconSrc}) center / contain no-repeat`,
            mask: `url(${meta.iconSrc}) center / contain no-repeat`,
          }}
          aria-hidden
        />
      )
    }
    const Icon = meta.Lucide!
    return <Icon className={`${isCenter ? 'w-8 h-8 text-[#2dd4bf] stroke-[2.5]' : `w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`}`} />
  }

  const renderSlotButton = (id: BottomNavId, isCenter: boolean) => {
    const meta = NAV_META[id]
    const isActive = id === activeId

    return (
      <button
        key={id}
        type="button"
        onClick={() => handleNavPress(id)}
        className={`flex flex-col items-center justify-center min-w-0 transition-colors ${
          isCenter ? '-mt-7 z-50 flex-1' : 'gap-0.5 py-1 flex-1'
        } ${
          isCenter ? 'text-[#2dd4bf]' : isActive ? 'text-[#2dd4bf]' : 'text-[#94a3b8] hover:text-[#0d3b66]'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        {isCenter ? (
          <div className="w-[3.65rem] h-[3.65rem] rounded-full flex items-center justify-center border-[3px] bg-white border-[#2dd4bf] shadow-[0_6px_20px_rgba(45,212,191,0.45)]">
            {renderIcon(id, true, true)}
          </div>
        ) : (
          renderIcon(id, false, isActive)
        )}
        <span className={`text-[9px] font-bold tracking-wide text-center leading-tight truncate max-w-[56px] ${isCenter ? 'mt-1 font-black uppercase' : ''}`}>
          {meta.label}
        </span>
      </button>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#e8f4fc] flex flex-col max-w-md mx-auto relative shadow-xl overflow-x-hidden">
      <header className="relative shrink-0 z-0">
        <div
          className="h-[200px] sm:h-[256px] bg-cover bg-top bg-no-repeat"
          style={{
            backgroundImage: `url(${fondoImg})`,
            backgroundSize: '100% auto',
            backgroundPosition: 'center -210px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-cyan-100/50 pointer-events-none" />

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="absolute top-3 left-4 z-20 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-7 h-7" strokeWidth={2.5} />
        </button>

        <div className="absolute inset-x-0 top-[56%] sm:top-[44%] -translate-y-1/2 flex flex-col items-center z-10 px-6 pointer-events-none">
          <img
            src={logoImg}
            alt="Pokémon GO Community"
            className="max-h-[108px] sm:max-h-[145px] w-auto max-w-[min(280px,88%)] object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)]"
          />
        </div>
      </header>

      <main className="flex-1 registration-dome overflow-y-auto pb-shell">
        <div className="relative px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4">{children}</div>
      </main>

      {/* Bottom nav — active tab always centered */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bottom-nav-shell z-40 safe-area-pb">
        <div className="bottom-nav-notch" aria-hidden />

        <div className="flex items-end pt-2 pb-1.5 px-1 min-h-[4.25rem]">
          {orderedForDisplay.map((id, index) => renderSlotButton(id, index === 2))}
        </div>
      </nav>

      {/* Menú lateral */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
          />
          <aside className="relative w-[min(300px,85vw)] h-full max-h-[100dvh] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 safe-area-pb">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-black text-[#0d3b66] text-lg">Menú</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-2">
              {menuItems
                .filter((item) => item.id !== 'polls' || showPolls || isAdmin)
                .map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleMenuSelect(item.id)}
                    className={`w-full flex items-center gap-4 px-5 py-4 text-left font-bold transition-colors ${
                      activeTab === item.id
                        ? 'bg-[#e8f4fc] text-[#2dd4bf] border-r-4 border-[#2dd4bf]'
                        : 'text-[#0d3b66] hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </button>
                )
              })}

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setStampRecoveryOpen(true)
                }}
                className="w-full flex items-center gap-4 px-5 py-4 text-left font-bold text-[#0d3b66] hover:bg-gray-50"
              >
                <Stamp className="w-5 h-5 shrink-0" />
                Recuperar sellos
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setFaqOpen(true)
                }}
                className="w-full flex items-center gap-4 px-5 py-4 text-left font-bold text-[#0d3b66] hover:bg-gray-50"
              >
                <HelpCircle className="w-5 h-5 shrink-0" />
                Preguntas frecuentes
              </button>

              <div className="my-2 border-t border-gray-100" />

              {!isAdmin && onAdminLogin && (
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onAdminLogin() }}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left font-bold text-[#0d3b66] hover:bg-gray-50"
                >
                  <LogIn className="w-5 h-5" />
                  Iniciar sesión
                </button>
              )}

              {isAdmin && onAdminLogout && (
                <>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onTabChange('ruleta') }}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left font-bold text-[#0d3b66] hover:bg-gray-50"
                  >
                    <Trophy className="w-5 h-5" />
                    Panel Ruleta
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onTabChange('qr') }}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left font-bold text-[#0d3b66] hover:bg-gray-50"
                  >
                    <QrCode className="w-5 h-5" />
                    Código QR
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onAdminLogout() }}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left font-bold text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5" />
                    Cerrar sesión
                  </button>
                </>
              )}
            </nav>

            <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
              Pokémon GO GDL
            </div>
          </aside>
        </div>
      )}

      <StampRecoveryPanel open={stampRecoveryOpen} onClose={() => setStampRecoveryOpen(false)} />
      <FaqPanel open={faqOpen} onClose={() => setFaqOpen(false)} />
    </div>
  )
}
