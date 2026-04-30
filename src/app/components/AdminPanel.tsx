import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Trash2, AlertTriangle, Search, Ban, CheckSquare, ShieldCheck } from 'lucide-react'
import { Input } from '@/app/components/ui/input'
import { Checkbox } from '@/app/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog'
import { Label } from '@/app/components/ui/label'
import type { Participant, BannedUser } from '@/hooks/useParticipants'

interface AdminPanelProps {
  participants: Participant[]; bannedUsers: BannedUser[];
  onDelete: (id: string) => void; onDeleteMultiple: (ids: string[]) => void; onClearAll: () => void; onStartRoulette: () => void
  onBanUser: (id: string, durationInDays: number) => void; onUnbanUser: (id: string) => void
}

export function AdminPanel({ participants, bannedUsers, onDelete, onDeleteMultiple, onClearAll, onStartRoulette, onBanUser, onUnbanUser }: AdminPanelProps) {
  const [filterTeam, setFilterTeam] = useState<'all' | 'blue' | 'yellow' | 'red'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  
  // Estados para el nuevo modal de Ban
  const [userToBan, setUserToBan] = useState<Participant | null>(null)
  const [banDuration, setBanDuration] = useState<number>(1)

  const activeCount = participants.filter(p => p.status === 'active').length
  const winnerCount = participants.filter(p => p.status === 'winner').length

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds)
    newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id)
    setSelectedIds(newSelection)
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto shadow-2xl border-0 rounded-[24px] bg-white overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-black text-center text-gray-800 mb-6">Datos de Participantes</h2>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button onClick={onStartRoulette} disabled={activeCount === 0} className="bg-[#5B4CFF] hover:bg-[#4a3dec] text-white rounded-xl px-6 py-6 sm:px-8 shadow-sm font-bold text-base sm:text-lg">
              Iniciar Ruleta
            </Button>
            <Button onClick={() => setConfirmClearAll(true)} disabled={participants.length === 0} className="bg-[#E9234B] hover:bg-[#d11a3e] text-white rounded-xl px-6 py-6 sm:px-8 shadow-sm font-bold text-base sm:text-lg">
              <Trash2 className="w-5 h-5 mr-2" /> Limpiar
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 max-w-xl mx-auto">
            <div className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center justify-center border border-gray-100">
              <span className="text-xs font-bold text-gray-500 tracking-wider mb-2">TOTAL</span>
              <span className="text-4xl font-black text-gray-900">{participants.length}</span>
            </div>
            <div className="bg-[#FFFDF0] p-6 rounded-2xl flex flex-col items-center justify-center border border-[#FDF2D3]">
              <span className="text-xs font-bold text-gray-500 tracking-wider mb-2">GANADORES</span>
              <span className="text-4xl font-black text-[#D49E1F]">{winnerCount}</span>
            </div>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="flex flex-wrap justify-center w-full mb-6 h-auto gap-2 bg-transparent p-1">
              <TabsTrigger value="active" className="flex-1 min-w-[100px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl py-3 border border-transparent data-[state=active]:border-gray-200 font-bold">Participantes</TabsTrigger>
              <TabsTrigger value="winner" className="flex-1 min-w-[100px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl py-3 border border-transparent data-[state=active]:border-gray-200 font-bold">Ganadores</TabsTrigger>
              <TabsTrigger value="banned" className="flex-1 min-w-[100px] text-orange-600 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl py-3 border border-transparent data-[state=active]:border-gray-200 font-bold">Baneados</TabsTrigger>
            </TabsList>

            {['active', 'winner'].map(status => {
              const list = participants.filter(p => p.status === status && (filterTeam === 'all' || p.team === filterTeam) && (!searchTerm || p.username.toLowerCase().includes(searchTerm.toLowerCase())))
              return (
              <TabsContent key={status} value={status} className="animate-in fade-in duration-300">
                <div className="flex flex-col gap-3 mb-6">
                  <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input placeholder="Buscar por nombre..." className="pl-12 bg-white border border-gray-200 rounded-xl py-6 text-base" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Button variant={filterTeam === 'all' ? 'secondary' : 'ghost'} className="rounded-lg font-bold" onClick={() => setFilterTeam('all')}>Todos</Button>
                    <Button variant={filterTeam === 'blue' ? 'default' : 'ghost'} className={`rounded-lg font-bold ${filterTeam === 'blue' ? 'bg-blue-600' : 'text-blue-600'}`} onClick={() => setFilterTeam('blue')}>Sabiduría</Button>
                    <Button variant={filterTeam === 'yellow' ? 'default' : 'ghost'} className={`rounded-lg font-bold ${filterTeam === 'yellow' ? 'bg-yellow-500 text-black' : 'text-yellow-600'}`} onClick={() => setFilterTeam('yellow')}>Instinto</Button>
                    <Button variant={filterTeam === 'red' ? 'default' : 'ghost'} className={`rounded-lg font-bold ${filterTeam === 'red' ? 'bg-red-600' : 'text-red-600'}`} onClick={() => setFilterTeam('red')}>Valor</Button>
                  </div>
                </div>
                
                {selectedIds.size > 0 && (
                  <div className="mb-4">
                    <Button variant="destructive" onClick={() => { onDeleteMultiple(Array.from(selectedIds)); setSelectedIds(new Set()) }} className="w-full rounded-xl py-6 font-bold">
                      <CheckSquare className="w-5 h-5 mr-2" /> Borrar Seleccionados ({selectedIds.size})
                    </Button>
                  </div>
                )}
                
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scroll-smooth">
                  {list.length === 0 ? <div className="text-center py-10 text-gray-400 border border-dashed rounded-xl">No hay resultados</div> : list.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm gap-3">
                      <div className="flex items-center gap-4">
                        <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelection(p.id)} className="w-6 h-6 rounded-md" />
                        <div className={`w-4 h-4 rounded-full ring-2 ring-white shadow-sm flex-shrink-0 ${p.team === 'blue' ? 'bg-blue-500' : p.team === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                        <span className="font-semibold text-gray-800 text-base truncate max-w-[150px] sm:max-w-[250px]">{p.username}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setUserToBan(p)} className="rounded-xl border border-orange-100 bg-orange-50/50 hover:bg-orange-100" title="Banear">
                          <Ban className="h-5 w-5 text-orange-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} className="rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-red-50 hover:text-red-600" title="Eliminar">
                          <Trash2 className="h-5 w-5 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )})}
            
            <TabsContent value="banned" className="animate-in fade-in duration-300">
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {bannedUsers.length === 0 ? <div className="text-center py-12 text-gray-400 border border-dashed rounded-xl">Nadie en la lista negra</div> : bannedUsers.map(user => (
                  <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-2xl shadow-sm gap-4">
                    <div>
                      <span className="font-bold text-gray-800 block text-lg">{user.username}</span>
                      <span className="text-sm font-medium text-orange-600 bg-orange-100 px-3 py-1 rounded-full mt-2 inline-block">Expira: {new Date(user.expires_at).toLocaleDateString()}</span>
                    </div>
                    <Button variant="outline" className="w-full sm:w-auto rounded-xl text-green-700 hover:bg-green-100 border-green-200 py-6 font-bold" onClick={() => onUnbanUser(user.id)}>
                      <ShieldCheck className="h-5 w-5 mr-2" /> Quitar Ban
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* NUEVO MODAL DE BANEO */}
      <AlertDialog open={userToBan !== null} onOpenChange={(open) => !open && setUserToBan(null)}>
        <AlertDialogContent className="rounded-3xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-center font-black">Banear Usuario</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base mt-2">
              Selecciona el tiempo de veto para <span className="font-bold text-gray-900">{userToBan?.username}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label className="text-sm font-bold text-gray-700">Duración del veto</Label>
            <select 
              className="w-full mt-2 p-4 rounded-xl border border-gray-200 bg-gray-50 text-base focus:ring-orange-500 focus:border-orange-500 outline-none" 
              value={banDuration} 
              onChange={e => setBanDuration(Number(e.target.value))}
            >
              <option value={1}>1 Día</option>
              <option value={7}>1 Semana</option>
              <option value={14}>2 Semanas</option>
              <option value={36500}>Permanente</option>
            </select>
          </div>
          <AlertDialogFooter className="flex-col gap-3 sm:flex-col">
            <AlertDialogAction 
              onClick={() => { if(userToBan) onBanUser(userToBan.id, banDuration); setUserToBan(null) }} 
              className="w-full rounded-xl py-6 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg"
            >
              Banear
            </AlertDialogAction>
            <AlertDialogCancel className="w-full rounded-xl py-6 border-0 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold mt-0">
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL DE BORRADO NORMAL */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl max-w-sm">
          <AlertDialogHeader><AlertDialogTitle className="text-xl text-center">¿Eliminar participante?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 mt-4">
            <AlertDialogAction onClick={() => { if(deleteId) onDelete(deleteId); setDeleteId(null) }} className="w-full rounded-xl py-6 bg-red-600 hover:bg-red-700 font-bold text-lg">Eliminar</AlertDialogAction>
            <AlertDialogCancel className="w-full rounded-xl py-6 border-0 bg-gray-100 hover:bg-gray-200 font-bold mt-0">Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL DE LIMPIEZA */}
      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <AlertDialogContent className="border-red-200 bg-[#fff5f5] rounded-3xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex flex-col items-center gap-3 text-red-700 text-2xl font-black">
              <AlertTriangle className="w-10 h-10" /> ¿Estás seguro?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-800/80 mt-2 text-center text-base">
              Se borrarán todos los participantes activos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-3 mt-6">
            <AlertDialogAction onClick={() => { onClearAll(); setConfirmClearAll(false) }} className="w-full rounded-xl py-6 bg-red-600 hover:bg-red-700 text-white font-black tracking-wide text-lg">SÍ, BORRAR TODO</AlertDialogAction>
            <AlertDialogCancel className="w-full rounded-xl py-6 bg-white text-red-900 border-red-200 hover:bg-red-50 font-bold mt-0">Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}