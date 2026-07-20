import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Button } from '@/app/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Trash2, AlertTriangle, Search, Ban, CheckSquare, ShieldCheck, Trophy, Settings2, RotateCcw, Check, MoreVertical, Users } from 'lucide-react'
import { Input } from '@/app/components/ui/input'
import { Checkbox } from '@/app/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog'
import { Label } from '@/app/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu'
import type { Participant, BannedUser, RecentWinner } from '@/hooks/useParticipants'
import pokebolaImg from '@/assets/iconos/Pokebola.png'

const PARTICIPANT_ROW_HEIGHT = 56
const PARTICIPANT_LIST_HEIGHT = 430
const VIRTUAL_OVERSCAN = 6

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

interface AdminPanelProps {
  participants: Participant[]; 
  bannedUsers: BannedUser[];
  recentWinners: RecentWinner[];
  onDelete: (id: string) => void; 
  onDeleteMultiple: (ids: string[]) => void; 
  onClearAll: () => void; 
  onStartRoulette: () => void
  onBanUser: (id: string, durationInDays: number) => void; 
  onUnbanUser: (id: string) => void
  onRemoveWinner: (id: string) => void; 
  onRemoveMultipleWinners: (ids: string[]) => void;
  penaltyMonths: number;
  setPenaltyMonths: (m: number) => void;
  penaltyPercent: number;
  setPenaltyPercent: (p: number) => void;
  rouletteCodes: string[];
  activeRouletteCode: string;
  onChangeRouletteCode: (code: string) => void;
  isSuperAdmin?: boolean;
  adminUsername?: string;
}

export function AdminPanel({ 
  participants, bannedUsers, recentWinners, onDelete, onDeleteMultiple, onClearAll, onStartRoulette, onBanUser, onUnbanUser,
  onRemoveWinner, onRemoveMultipleWinners, penaltyMonths, setPenaltyMonths, penaltyPercent, setPenaltyPercent,
  rouletteCodes, activeRouletteCode, onChangeRouletteCode,
  isSuperAdmin = false, adminUsername = '',
}: AdminPanelProps) {
  
  // Estados para Participantes
  const [filterTeam, setFilterTeam] = useState<'all' | 'blue' | 'yellow' | 'red'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebouncedValue(searchTerm, 200)
  const [listScrollTop, setListScrollTop] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const [showBanModal, setShowBanModal] = useState<string | null>(null)
  const [banDuration, setBanDuration] = useState('7')

  // Estados para Ganadores
  const [searchWinnerTerm, setSearchWinnerTerm] = useState('')
  const [selectedWinnerIds, setSelectedWinnerIds] = useState<Set<string>>(new Set())
  const [localPercent, setLocalPercent] = useState(penaltyPercent.toString())
  const [applySuccess, setApplySuccess] = useState(false)

  // Sincronizar porcentaje local si cambia externamente
  useEffect(() => { setLocalPercent(penaltyPercent.toString()) }, [penaltyPercent])

  // Filtrado
  const filteredParticipants = useMemo(() => {
    const term = debouncedSearch.toLowerCase()
    return participants.filter((p) => {
      if (p.status !== 'active') return false
      const matchesTeam = filterTeam === 'all' || p.team === filterTeam
      const matchesSearch = !term || p.username.toLowerCase().includes(term)
      return matchesTeam && matchesSearch
    })
  }, [participants, filterTeam, debouncedSearch])

  const virtualRange = useMemo(() => {
    const visibleCount = Math.ceil(PARTICIPANT_LIST_HEIGHT / PARTICIPANT_ROW_HEIGHT) + VIRTUAL_OVERSCAN
    const start = Math.max(0, Math.floor(listScrollTop / PARTICIPANT_ROW_HEIGHT) - Math.floor(VIRTUAL_OVERSCAN / 2))
    const end = Math.min(filteredParticipants.length, start + visibleCount)
    return { start, end, offsetY: start * PARTICIPANT_ROW_HEIGHT }
  }, [filteredParticipants.length, listScrollTop])

  const visibleParticipants = useMemo(
    () => filteredParticipants.slice(virtualRange.start, virtualRange.end),
    [filteredParticipants, virtualRange.start, virtualRange.end],
  )

  const handleListScroll = useCallback(() => {
    if (listRef.current) setListScrollTop(listRef.current.scrollTop)
  }, [])

  const filteredWinners = useMemo(
    () => recentWinners.filter((w) =>
      w.username.toLowerCase().includes(searchWinnerTerm.toLowerCase()),
    ),
    [recentWinners, searchWinnerTerm],
  )

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id)
    setSelectedIds(newSelected)
  }

  const toggleSelectWinner = (id: string) => {
    const newSelected = new Set(selectedWinnerIds)
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id)
    setSelectedWinnerIds(newSelected)
  }

  const toggleSelectAllWinners = () => {
    if (selectedWinnerIds.size === filteredWinners.length && filteredWinners.length > 0) {
      setSelectedWinnerIds(new Set())
    } else {
      setSelectedWinnerIds(new Set(filteredWinners.map(w => w.id)))
    }
  }

  const handleBanSubmit = () => {
    if (showBanModal) {
      onBanUser(showBanModal, parseInt(banDuration) || 7)
      setShowBanModal(null)
    }
  }

  const handlePercentBlur = () => {
    if (!isSuperAdmin) return
    let val = parseInt(localPercent)
    if (isNaN(val) || val < 1) val = 1
    if (val > 100) val = 100
    setLocalPercent(val.toString())
    setPenaltyPercent(val)
  }

  const handleApplySettings = () => {
    if (!isSuperAdmin) return
    handlePercentBlur()
    setApplySuccess(true)
    setTimeout(() => setApplySuccess(false), 3000)
  }

  return (
    <div className="w-full mx-auto space-y-6">
      
      {/* CABECERA RESPONSIVA */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#e8ecf5]">
        <div className="text-center">
          <h2 className="text-[1.75rem] leading-tight font-black text-[#1b2140] tracking-tight">Panel de Control</h2>
          <p className="mt-1 text-sm text-[#727a9a] font-semibold">Administra los participantes.</p>
        </div>
        <Button onClick={onStartRoulette} className="mt-4 w-full h-14 rounded-xl bg-[#23c8b6] hover:bg-[#1fb7a7] text-white font-bold text-lg shadow-sm active:scale-[0.99] transition-transform">
          <Trophy className="w-5 h-5 mr-2" /> Iniciar Ruleta
        </Button>
      </div>

      {rouletteCodes.length > 1 && (
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#e8ecf5]">
          <p className="text-xs font-bold text-[#667091] mb-2 text-center">Monitorear ruleta</p>
          <div className="grid grid-cols-4 gap-2">
            {rouletteCodes.map((code, index) => (
              <button
                key={code}
                type="button"
                onClick={() => onChangeRouletteCode(code)}
                title={code}
                className={`h-9 rounded-lg border text-sm font-black transition-colors ${
                  code === activeRouletteCode
                    ? 'bg-[#23c8b6] border-[#1fb7a7] text-white'
                    : 'bg-white border-[#d7ddea] text-[#4f5674] hover:bg-[#f7f9ff]'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="w-full grid grid-cols-3 gap-1 bg-[#f6f7fb] border border-[#e5e9f4] rounded-xl h-auto p-1 mb-4">
          <TabsTrigger value="participants" className="min-w-0 gap-0 rounded-lg py-1.5 px-0 text-[9px] font-bold text-[#69708d] data-[state=active]:bg-white data-[state=active]:text-[#0d3b66] data-[state=active]:shadow-sm">
            <Users className="w-3 h-3 mr-0.5 shrink-0 hidden sm:inline-block" />
            <span className="sm:hidden">Partic.</span>
            <span className="hidden sm:inline">Participantes</span>
          </TabsTrigger>
          <TabsTrigger value="banned" className="min-w-0 gap-0 rounded-lg py-1.5 px-0 text-[9px] font-bold text-[#69708d] data-[state=active]:bg-white data-[state=active]:text-[#0d3b66] data-[state=active]:shadow-sm">
            <Ban className="w-3 h-3 mr-0.5 shrink-0 hidden sm:inline-block" />
            <span className="sm:hidden">Banead.</span>
            <span className="hidden sm:inline">Baneados</span>
          </TabsTrigger>
          <TabsTrigger value="winners" className="min-w-0 gap-0 rounded-lg py-1.5 px-0 text-[9px] font-bold text-[#69708d] data-[state=active]:bg-white data-[state=active]:text-[#0d3b66] data-[state=active]:shadow-sm">
            <Trophy className="w-3 h-3 mr-0.5 shrink-0 hidden sm:inline-block" />
            <span className="sm:hidden">Ganad.</span>
            <span className="hidden sm:inline">Ganadores</span>
          </TabsTrigger>
        </TabsList>

        {/* PESTAÑA PARTICIPANTES */}
        <TabsContent value="participants" className="mt-0 space-y-4 outline-none">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#e8ecf5] space-y-4">
            <div className="rounded-xl bg-[#f8faff] border border-[#e7ebf5] p-4">
              <h3 className="text-xl font-black text-[#1f2a44]">Filtrar por equipo</h3>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterTeam('blue')}
                  className={`h-9 min-w-0 rounded-full border px-0.5 text-[9px] font-bold flex items-center justify-center gap-0.5 tracking-tight transition-colors ${
                    filterTeam === 'blue'
                      ? 'bg-[#eff5ff] border-[#bdd1ff] text-[#2c5ec0]'
                      : 'bg-white border-[#d7ddea] text-[#4f5674]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 shrink-0"
                    style={{
                      backgroundColor: '#3b82f6',
                      WebkitMask: `url(${pokebolaImg}) center / contain no-repeat`,
                      mask: `url(${pokebolaImg}) center / contain no-repeat`,
                    }}
                    aria-hidden
                  />
                  Azul
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTeam('yellow')}
                  className={`h-9 min-w-0 rounded-full border px-0.5 text-[9px] font-bold flex items-center justify-center gap-0.5 tracking-tight transition-colors ${
                    filterTeam === 'yellow'
                      ? 'bg-[#fff9ec] border-[#f6deac] text-[#8f6a08]'
                      : 'bg-white border-[#d7ddea] text-[#4f5674]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 shrink-0"
                    style={{
                      backgroundColor: '#f6c229',
                      WebkitMask: `url(${pokebolaImg}) center / contain no-repeat`,
                      mask: `url(${pokebolaImg}) center / contain no-repeat`,
                    }}
                    aria-hidden
                  />
                  <span className="min-[360px]:hidden">Amar.</span>
                  <span className="hidden min-[360px]:inline">Amarillo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTeam('red')}
                  className={`h-9 min-w-0 rounded-full border px-0.5 text-[9px] font-bold flex items-center justify-center gap-0.5 tracking-tight transition-colors ${
                    filterTeam === 'red'
                      ? 'bg-[#fff0f2] border-[#ffc9cf] text-[#bb2e3a]'
                      : 'bg-white border-[#d7ddea] text-[#4f5674]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 shrink-0"
                    style={{
                      backgroundColor: '#ff4757',
                      WebkitMask: `url(${pokebolaImg}) center / contain no-repeat`,
                      mask: `url(${pokebolaImg}) center / contain no-repeat`,
                    }}
                    aria-hidden
                  />
                  Rojo
                </button>
              </div>
              <button
                type="button"
                onClick={() => setFilterTeam('all')}
                className={`mt-3 w-full h-10 rounded-full border font-bold text-sm transition-colors ${
                  filterTeam === 'all'
                    ? 'bg-[#24324e] border-[#24324e] text-white'
                    : 'bg-white border-[#d7ddea] text-[#4f5674]'
                }`}
              >
                Ver todos
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white border border-[#dde3ef] p-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a819c] w-5 h-5" />
                <Input
                  placeholder="Buscar participante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 rounded-lg border border-[#e6eaf4] bg-[#fbfcff] text-[#2a3350] font-semibold placeholder:text-[#8b93ab]"
                />
              </div>
              <button
                type="button"
                className="h-11 w-11 rounded-lg border border-[#e0e5f0] bg-white text-[#5d6787] inline-flex items-center justify-center"
                aria-label="Opciones de filtro"
              >
                <Settings2 className="w-5 h-5" />
              </button>
            </div>

            {selectedIds.size > 0 && (
              <div className="bg-red-50 p-3 rounded-2xl border border-red-100 flex items-center justify-between gap-2">
                <span className="text-red-800 font-bold flex items-center gap-2 text-sm"><CheckSquare className="w-4 h-4" /> {selectedIds.size} seleccionados</span>
                <Button variant="destructive" size="sm" onClick={() => { onDeleteMultiple(Array.from(selectedIds)); setSelectedIds(new Set()) }} className="font-bold rounded-xl">
                  <Trash2 className="w-4 h-4 mr-2" /> Borrar
                </Button>
              </div>
            )}

            <div
              ref={listRef}
              onScroll={handleListScroll}
              className="bg-[#fafbff] rounded-xl border border-[#e5e9f3] p-3 max-h-[430px] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h4 className="text-lg font-black text-[#1f2a44]">Participantes ({filteredParticipants.length})</h4>
                <span className="text-sm font-semibold text-[#7f879f]">Más recientes</span>
              </div>
              {filteredParticipants.length === 0 ? (
                <div className="p-8 text-center text-[#7f879f] font-semibold">No hay participantes registrados.</div>
              ) : (
                <div className="relative" style={{ height: filteredParticipants.length * PARTICIPANT_ROW_HEIGHT }}>
                  <div
                    className="absolute left-0 right-0 space-y-2"
                    style={{ transform: `translateY(${virtualRange.offsetY}px)` }}
                  >
                  {visibleParticipants.map((p) => (
                    <div key={p.id} className="rounded-xl bg-white border border-[#e7ebf4] p-3 flex items-center justify-between gap-2" style={{ minHeight: PARTICIPANT_ROW_HEIGHT - 8 }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          checked={selectedIds.has(p.id)}
                          onCheckedChange={() => toggleSelect(p.id)}
                          className="w-5 h-5 rounded-md border-[#cfd5ee] data-[state=checked]:bg-[#20b7ab] data-[state=checked]:border-[#20b7ab]"
                        />
                        <div
                          className="w-7 h-7 shrink-0"
                          style={{
                            backgroundColor:
                              p.team === 'blue'
                                ? '#4f88f8'
                                : p.team === 'yellow'
                                  ? '#f2bd2f'
                                  : '#ef5666',
                            WebkitMask: `url(${pokebolaImg}) center / contain no-repeat`,
                            mask: `url(${pokebolaImg}) center / contain no-repeat`,
                          }}
                          aria-hidden
                        >
                        </div>
                        <span className="font-bold text-[#1f2a44] text-sm leading-tight whitespace-nowrap truncate">{p.username}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="h-9 w-9 rounded-xl border border-[#e0e4f5] text-[#66709f] inline-flex items-center justify-center hover:bg-[#f7f9ff]">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => setShowBanModal(p.id)} className="font-medium">
                            <Ban className="w-4 h-4" />
                            Banear
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(p.id)} variant="destructive" className="font-medium">
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-1 flex justify-end">
              <Button variant="destructive" onClick={() => setConfirmClearAll(true)} className="bg-red-50 text-red-600 hover:bg-red-100 border-0 font-bold w-full rounded-2xl">
                <AlertTriangle className="w-4 h-4 mr-2" /> Limpiar toda la lista
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* PESTAÑA BANEADOS */}
        <TabsContent value="banned" className="mt-0 outline-none">
          <div className="bg-white p-5 sm:p-6 rounded-[24px] shadow-xl border border-gray-100">
            <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-red-500" />
              {isSuperAdmin ? 'Todos los baneados' : 'Usuarios baneados'}
            </h3>
            <p className="text-xs text-gray-500 font-semibold mb-4">
              {isSuperAdmin
                ? 'Vista global: puedes ver y desbanear a todos los usuarios bloqueados.'
                : `Los baneos serán registrados a nombre de ${adminUsername || 'tu cuenta'}.`}
            </p>
            <div className="bg-gray-50 rounded-xl border border-gray-200 max-h-[400px] overflow-y-auto">
              {bannedUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-medium">
                  {isSuperAdmin
                    ? 'No hay usuarios bloqueados actualmente.'
                    : 'No hay baneos actualmente.'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {bannedUsers.map(b => (
                    <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white gap-3">
                      <div>
                        <span className="font-black text-gray-800 text-base sm:text-lg block">{b.username}</span>
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md mt-1 inline-block">
                          Expira: {new Date(b.expires_at).toLocaleDateString()}
                        </span>
                        {isSuperAdmin && b.banned_by && (
                          <span className="block text-[11px] font-bold text-[#5b6483] mt-1">
                            Baneado por: {b.banned_by}
                          </span>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => onUnbanUser(b.id)} className="text-green-600 border-green-200 hover:bg-green-50 font-bold w-full sm:w-auto">Desbanear</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* PESTAÑA GANADORES */}
        <TabsContent value="winners" className="mt-0 outline-none">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#e8ecf5] space-y-4">
            {isSuperAdmin && (
              <div className="rounded-xl bg-[#f8faff] border border-[#e7ebf5] p-4">
                <h3 className="font-black text-[#1f2a44] text-base mb-1 flex items-center gap-2"><Settings2 className="w-4 h-4" /> Ajuste real de probabilidades</h3>
                <p className="text-xs text-[#6d7696] mb-3">Solo Fuecoco ve y modifica esta reducción. La ruleta pública conserva segmentos visualmente iguales.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-bold text-[#2c3a5d] block mb-1">Meses con reducción</label>
                    <select
                      value={penaltyMonths}
                      onChange={e => setPenaltyMonths(Number(e.target.value))}
                      className="w-full bg-white border border-[#dfe5f2] rounded-lg px-3 font-semibold text-[#2d3552] outline-none focus:ring-2 focus:ring-[#8ab6ff]/40 h-11"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                        <option key={m} value={m}>{m} {m === 1 ? 'mes' : 'meses'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#2c3a5d] block mb-1">Reducción real (%)</label>
                    <Input
                      type="number"
                      min="1" max="100"
                      value={localPercent}
                      onChange={e => setLocalPercent(e.target.value)}
                      onBlur={handlePercentBlur}
                      className="bg-white border-[#dfe5f2] font-semibold h-11 text-base w-full"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleApplySettings}
                  className={`w-full h-11 font-bold text-sm transition-all ${applySuccess ? 'bg-[#25b87c] hover:bg-[#20a96f] text-white' : 'bg-[#3d76e5] hover:bg-[#3467c8] text-white'}`}
                >
                  {applySuccess ? <><Check className="w-5 h-5 mr-2" /> Ajustes Aplicados</> : "Aplicar porcentaje"}
                </Button>
              </div>
            )}

            <div>
              <h3 className="text-lg font-black text-[#1f2a44] mb-1 flex items-center gap-2"><Trophy className="w-5 h-5 text-[#f2b62f]" /> Historial de Ganadores</h3>
              <p className="text-xs text-[#6d7696]">
                {isSuperAdmin
                  ? 'Aquí puedes revisar y restablecer probabilidades cuando sea necesario.'
                  : 'Consulta de personas que ya resultaron ganadoras.'}
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="relative w-full rounded-xl border border-[#dde3ef] p-2">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7a819c] w-5 h-5" />
                <Input placeholder="Buscar ganador..." value={searchWinnerTerm} onChange={(e) => setSearchWinnerTerm(e.target.value)} className="pl-10 h-10 border border-[#e6eaf4] bg-[#fbfcff]" />
              </div>

              {isSuperAdmin && filteredWinners.length > 0 && (
                <div className="flex items-center gap-2 px-1">
                  <Checkbox 
                    checked={selectedWinnerIds.size === filteredWinners.length && filteredWinners.length > 0} 
                    onCheckedChange={toggleSelectAllWinners} 
                    className="w-5 h-5 rounded-md border-[#cfd5ee] data-[state=checked]:bg-[#3d76e5] data-[state=checked]:text-white shrink-0"
                  />
                  <span className="font-semibold text-[#4f5674] text-sm cursor-pointer" onClick={toggleSelectAllWinners}>Seleccionar todos ({filteredWinners.length})</span>
                </div>
              )}
            </div>

            {isSuperAdmin && selectedWinnerIds.size > 0 && (
              <div className="bg-[#edf4ff] p-3 rounded-xl border border-[#d6e4fb] flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-[#2e5ab6] font-bold flex items-center gap-2 text-sm"><CheckSquare className="w-4 h-4" /> {selectedWinnerIds.size} seleccionados</span>
                <Button variant="outline" size="sm" onClick={() => { onRemoveMultipleWinners(Array.from(selectedWinnerIds)); setSelectedWinnerIds(new Set()) }} className="font-bold text-blue-700 border-blue-300 hover:bg-blue-100 w-full sm:w-auto">
                  <RotateCcw className="w-4 h-4 mr-2" /> Restablecer Seleccionados
                </Button>
              </div>
            )}

            <div className="bg-[#fafbff] rounded-xl border border-[#e5e9f3] max-h-[400px] overflow-y-auto">
              {filteredWinners.length === 0 ? (
                <div className="p-8 text-center text-[#7f879f] font-medium">No se encontraron ganadores.</div>
              ) : (
                <div className="divide-y divide-[#e7ebf4]">
                  {filteredWinners.map(w => (
                    <div key={w.id} className="p-3 sm:p-4 bg-white flex items-center justify-between hover:bg-gray-50 transition-colors gap-2">
                      <div className="flex items-center gap-3 sm:gap-4 overflow-hidden flex-1">
                        {isSuperAdmin && (
                          <Checkbox checked={selectedWinnerIds.has(w.id)} onCheckedChange={() => toggleSelectWinner(w.id)} className="w-5 h-5 rounded-md border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className="font-black text-gray-800 text-sm sm:text-lg block truncate">{w.username}</span>
                          <span className="text-xs sm:text-sm font-bold text-gray-500">{new Date(w.won_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {isSuperAdmin && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => onRemoveWinner(w.id)} className="text-blue-600 border-blue-200 hover:bg-blue-50 font-bold shrink-0 hidden sm:flex" title="Eliminar del historial para restablecer su probabilidad">
                            <RotateCcw className="w-4 h-4 mr-1" /> Restablecer
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => onRemoveWinner(w.id)} className="text-blue-600 border-blue-200 hover:bg-blue-50 font-bold shrink-0 sm:hidden h-8 w-8 rounded-lg" title="Restablecer">
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODALES DE CONFIRMACIÓN */}
      <AlertDialog open={showBanModal !== null} onOpenChange={(open) => !open && setShowBanModal(null)}>
        <AlertDialogContent className="rounded-3xl max-w-sm">
          <AlertDialogHeader>
             <AlertDialogTitle className="text-xl sm:text-2xl font-black mb-2 text-gray-900">Bloquear Usuario</AlertDialogTitle>
             <AlertDialogDescription className="text-sm sm:text-base text-gray-600 mb-2">Bloqueará su dispositivo por completo.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
             <Label className="font-bold text-gray-700">Duración del bloqueo (Días)</Label>
             <Input type="number" value={banDuration} onChange={e => setBanDuration(e.target.value)} className="mt-2 mb-2 bg-gray-50 border-gray-200 font-bold py-6 text-lg w-full" />
          </div>
          <AlertDialogFooter className="flex-col gap-3 sm:flex-col">
             <AlertDialogAction onClick={handleBanSubmit} className="w-full py-6 font-black bg-orange-500 hover:bg-orange-600 text-white rounded-xl">Banear</AlertDialogAction>
             <AlertDialogCancel className="w-full py-6 font-bold rounded-xl mt-0">Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <AlertDialogContent className="border-red-200 bg-[#fff5f5] rounded-3xl max-w-sm">
          <AlertDialogHeader>
             <AlertDialogTitle className="flex flex-col items-center gap-3 text-red-700 text-xl sm:text-2xl font-black">
               <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10" /> ¿Borrar Lista?
             </AlertDialogTitle>
             <AlertDialogDescription className="text-red-800/80 mt-2 text-center text-sm sm:text-base">
               Se eliminarán todos los participantes activos actuales.
             </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-3 mt-6 sm:flex-col">
             <AlertDialogAction onClick={() => { onClearAll(); setConfirmClearAll(false) }} className="w-full rounded-xl py-6 bg-red-600 hover:bg-red-700 text-white font-black tracking-wide text-lg">SÍ, BORRAR TODO</AlertDialogAction>
             <AlertDialogCancel className="w-full rounded-xl py-6 bg-white text-red-900 border-red-200 hover:bg-red-50 font-bold mt-0">Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}