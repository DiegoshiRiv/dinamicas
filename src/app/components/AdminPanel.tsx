import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Trash2, AlertTriangle, Search, Ban, CheckSquare, ShieldCheck, Trophy, Settings2, RotateCcw, Check } from 'lucide-react'
import { Input } from '@/app/components/ui/input'
import { Checkbox } from '@/app/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog'
import { Label } from '@/app/components/ui/label'
import type { Participant, BannedUser, RecentWinner } from '@/hooks/useParticipants'

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
}

export function AdminPanel({ 
  participants, bannedUsers, recentWinners, onDelete, onDeleteMultiple, onClearAll, onStartRoulette, onBanUser, onUnbanUser,
  onRemoveWinner, onRemoveMultipleWinners, penaltyMonths, setPenaltyMonths, penaltyPercent, setPenaltyPercent
}: AdminPanelProps) {
  
  // Estados para Participantes
  const [filterTeam, setFilterTeam] = useState<'all' | 'blue' | 'yellow' | 'red'>('all')
  const [searchTerm, setSearchTerm] = useState('')
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
  const filteredParticipants = participants.filter(p => {
    if (p.status !== 'active') return false
    const matchesTeam = filterTeam === 'all' || p.team === filterTeam
    const matchesSearch = p.username.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesTeam && matchesSearch
  })

  const filteredWinners = recentWinners.filter(w => 
    w.username.toLowerCase().includes(searchWinnerTerm.toLowerCase())
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
    let val = parseInt(localPercent)
    if (isNaN(val) || val < 1) val = 1
    if (val > 100) val = 100
    setLocalPercent(val.toString())
    setPenaltyPercent(val)
  }

  const handleApplySettings = () => {
    handlePercentBlur()
    setApplySuccess(true)
    setTimeout(() => setApplySuccess(false), 3000)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* CABECERA RESPONSIVA */}
      <div className="bg-white p-5 sm:p-6 rounded-[24px] shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="w-full md:w-auto">
          <h2 className="text-2xl font-black text-gray-900">Panel de Control</h2>
          <p className="text-sm sm:text-base text-gray-500 font-medium">Gestionar personas y ruleta.</p>
        </div>
        <Button onClick={onStartRoulette} className="w-full md:w-auto bg-[#A855F7] hover:bg-[#9333EA] text-white font-black py-6 px-8 rounded-xl shadow-lg shadow-purple-500/30 text-lg active:scale-95 transition-transform">
          <Trophy className="w-6 h-6 mr-2" /> Iniciar Ruleta
        </Button>
      </div>

      <Tabs defaultValue="participants" className="w-full">
        {/* PESTAÑAS RESPONSIVAS CON CUADRÍCULA ESTRICTA */}
        <TabsList className="w-full grid grid-cols-3 gap-2 bg-transparent h-auto p-1 mb-6">
          <TabsTrigger value="participants" className="bg-white text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold py-3 text-[11px] sm:text-sm rounded-xl shadow-sm border border-gray-100 transition-all">Participantes</TabsTrigger>
          <TabsTrigger value="banned" className="bg-white text-gray-700 data-[state=active]:bg-red-600 data-[state=active]:text-white font-bold py-3 text-[11px] sm:text-sm rounded-xl shadow-sm border border-gray-100 transition-all">Baneados</TabsTrigger>
          <TabsTrigger value="winners" className="bg-white text-gray-700 data-[state=active]:bg-yellow-500 data-[state=active]:text-yellow-950 font-bold py-3 text-[11px] sm:text-sm rounded-xl shadow-sm border border-gray-100 transition-all">Ganadores</TabsTrigger>
        </TabsList>

        {/* PESTAÑA PARTICIPANTES */}
        <TabsContent value="participants" className="mt-0 space-y-4 outline-none">
          <div className="bg-white p-5 sm:p-6 rounded-[24px] shadow-xl border border-gray-100">
            <div className="flex flex-col gap-4 mb-6">
              
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input placeholder="Buscar participante..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-gray-50 border-gray-200 w-full" />
              </div>
              
              {/* FILTROS REORGANIZADOS: 3 Arriba y el "Todos" grande abajo */}
              <div className="grid grid-cols-3 gap-2 w-full">
                <Button variant={filterTeam === 'blue' ? 'default' : 'outline'} onClick={() => setFilterTeam('blue')} className={`py-4 text-xs sm:text-sm font-bold rounded-xl shadow-sm ${filterTeam === 'blue' ? 'bg-blue-600 text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}>Azul</Button>
                <Button variant={filterTeam === 'yellow' ? 'default' : 'outline'} onClick={() => setFilterTeam('yellow')} className={`py-4 text-xs sm:text-sm font-bold rounded-xl shadow-sm ${filterTeam === 'yellow' ? 'bg-yellow-400 text-yellow-900 border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}>Amarillo</Button>
                <Button variant={filterTeam === 'red' ? 'default' : 'outline'} onClick={() => setFilterTeam('red')} className={`py-4 text-xs sm:text-sm font-bold rounded-xl shadow-sm ${filterTeam === 'red' ? 'bg-red-500 text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}>Rojo</Button>
                
                <Button variant={filterTeam === 'all' ? 'default' : 'outline'} onClick={() => setFilterTeam('all')} className={`col-span-3 py-5 text-sm sm:text-base font-black rounded-xl shadow-sm ${filterTeam === 'all' ? 'bg-gray-900 text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}>
                  Todos los participantes
                </Button>
              </div>

            </div>

            {selectedIds.size > 0 && (
              <div className="bg-red-50 p-3 sm:p-4 rounded-xl border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
                <span className="text-red-800 font-bold flex items-center gap-2 text-sm sm:text-base"><CheckSquare className="w-5 h-5"/> {selectedIds.size} seleccionados</span>
                <Button variant="destructive" size="sm" onClick={() => { onDeleteMultiple(Array.from(selectedIds)); setSelectedIds(new Set()) }} className="font-bold w-full sm:w-auto"><Trash2 className="w-4 h-4 mr-2" /> Borrar Múltiples</Button>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl border border-gray-200 max-h-[400px] overflow-y-auto">
              {filteredParticipants.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-medium">No hay participantes registrados.</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredParticipants.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 sm:p-4 bg-white hover:bg-gray-50 transition-colors gap-2">
                      <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                        <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} className="w-5 h-5 rounded-md shrink-0" />
                        <div className={`w-3 h-3 rounded-full shrink-0 ${p.team === 'blue' ? 'bg-blue-500' : p.team === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                        <span className="font-black text-gray-800 text-sm sm:text-lg truncate">{p.username}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        {/* Botones de acción responsivos */}
                        <Button variant="outline" size="sm" onClick={() => setShowBanModal(p.id)} className="text-orange-600 border-orange-200 hover:bg-orange-50 font-bold hidden sm:flex"><Ban className="w-4 h-4 mr-1" /> Banear</Button>
                        <Button variant="outline" size="icon" onClick={() => setShowBanModal(p.id)} className="text-orange-600 border-orange-200 hover:bg-orange-50 font-bold sm:hidden h-8 w-8 rounded-lg"><Ban className="w-4 h-4" /></Button>
                        
                        <Button variant="destructive" size="icon" onClick={() => onDelete(p.id)} className="rounded-lg h-8 w-8 sm:h-9 sm:w-9"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
              <Button variant="destructive" onClick={() => setConfirmClearAll(true)} className="bg-red-50 text-red-600 hover:bg-red-100 border-0 font-bold w-full sm:w-auto"><AlertTriangle className="w-4 h-4 mr-2" /> Limpiar Toda la Lista</Button>
            </div>
          </div>
        </TabsContent>

        {/* PESTAÑA BANEADOS */}
        <TabsContent value="banned" className="mt-0 outline-none">
          <div className="bg-white p-5 sm:p-6 rounded-[24px] shadow-xl border border-gray-100">
            <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-red-500" /> Lista de Bloqueos (Por IP)</h3>
            <div className="bg-gray-50 rounded-xl border border-gray-200 max-h-[400px] overflow-y-auto">
              {bannedUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-medium">No hay usuarios bloqueados actualmente.</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {bannedUsers.map(b => (
                    <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white gap-3">
                      <div>
                        <span className="font-black text-gray-800 text-base sm:text-lg block">{b.username}</span>
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md mt-1 inline-block">Expira: {new Date(b.expires_at).toLocaleDateString()}</span>
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
          <div className="bg-white p-5 sm:p-6 rounded-[24px] shadow-xl border border-gray-100">
            
            <div className="bg-blue-50 p-5 sm:p-6 rounded-2xl border-2 border-blue-100 mb-8">
              <h3 className="font-black text-blue-900 text-base sm:text-lg mb-2 flex items-center gap-2"><Settings2 className="w-5 h-5"/> Ajuste de Probabilidades</h3>
              <p className="text-xs sm:text-sm text-blue-700 mb-4">Las personas que hayan ganado tendrán menos probabilidades de salir para darle oportunidad a otros.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs sm:text-sm font-bold text-blue-900 block mb-1">Meses con reducción de probabilidad</label>
                  <select 
                    value={penaltyMonths} 
                    onChange={e => setPenaltyMonths(Number(e.target.value))} 
                    className="w-full bg-white border border-blue-200 rounded-xl px-4 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 h-[52px]"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={m}>{m} {m === 1 ? 'mes' : 'meses'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-bold text-blue-900 block mb-1">Reducción de probabilidad (%)</label>
                  <Input 
                    type="number" 
                    min="1" max="100" 
                    value={localPercent} 
                    onChange={e => setLocalPercent(e.target.value)} 
                    onBlur={handlePercentBlur}
                    className="bg-white border-blue-200 font-bold h-[52px] text-lg w-full" 
                  />
                </div>
              </div>

              <Button 
                onClick={handleApplySettings} 
                className={`w-full font-black py-6 text-sm sm:text-base transition-all ${applySuccess ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'}`}
              >
                {applySuccess ? <><Check className="w-5 h-5 mr-2" /> Ajustes Aplicados a Todos</> : "Aplicar Ajustes a Todos"}
              </Button>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-1 flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-500" /> Historial de Ganadores</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-6">Aquí puedes checar y reiniciar las probabilidades de los ganadores.</p>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input placeholder="Buscar ganador..." value={searchWinnerTerm} onChange={(e) => setSearchWinnerTerm(e.target.value)} className="pl-10 bg-gray-50 border-gray-200 w-full" />
              </div>

              {filteredWinners.length > 0 && (
                <div className="flex items-center gap-3 px-2 mt-2">
                  <Checkbox 
                    checked={selectedWinnerIds.size === filteredWinners.length && filteredWinners.length > 0} 
                    onCheckedChange={toggleSelectAllWinners} 
                    className="w-6 h-6 rounded-md border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white shrink-0"
                  />
                  <span className="font-bold text-gray-700 text-sm sm:text-base cursor-pointer" onClick={toggleSelectAllWinners}>Seleccionar todos ({filteredWinners.length})</span>
                </div>
              )}
            </div>

            {selectedWinnerIds.size > 0 && (
              <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
                <span className="text-blue-800 font-bold flex items-center gap-2 text-sm sm:text-base"><CheckSquare className="w-5 h-5"/> {selectedWinnerIds.size} seleccionados</span>
                <Button variant="outline" size="sm" onClick={() => { onRemoveMultipleWinners(Array.from(selectedWinnerIds)); setSelectedWinnerIds(new Set()) }} className="font-bold text-blue-700 border-blue-300 hover:bg-blue-100 w-full sm:w-auto">
                  <RotateCcw className="w-4 h-4 mr-2" /> Restablecer Seleccionados
                </Button>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl border border-gray-200 max-h-[400px] overflow-y-auto">
              {filteredWinners.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-medium">No se encontraron ganadores.</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredWinners.map(w => (
                    <div key={w.id} className="p-3 sm:p-4 bg-white flex items-center justify-between hover:bg-gray-50 transition-colors gap-2">
                      <div className="flex items-center gap-3 sm:gap-4 overflow-hidden flex-1">
                        <Checkbox checked={selectedWinnerIds.has(w.id)} onCheckedChange={() => toggleSelectWinner(w.id)} className="w-5 h-5 rounded-md border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white shrink-0" />
                        <div className="min-w-0">
                          <span className="font-black text-gray-800 text-sm sm:text-lg block truncate">{w.username}</span>
                          <span className="text-xs sm:text-sm font-bold text-gray-500">{new Date(w.won_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" onClick={() => onRemoveWinner(w.id)} className="text-blue-600 border-blue-200 hover:bg-blue-50 font-bold shrink-0 hidden sm:flex" title="Eliminar del historial para restablecer su probabilidad">
                        <RotateCcw className="w-4 h-4 mr-1" /> Restablecer
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => onRemoveWinner(w.id)} className="text-blue-600 border-blue-200 hover:bg-blue-50 font-bold shrink-0 sm:hidden h-8 w-8 rounded-lg" title="Restablecer">
                        <RotateCcw className="w-4 h-4" />
                      </Button>
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