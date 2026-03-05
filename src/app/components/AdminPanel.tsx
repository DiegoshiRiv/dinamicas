import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Trash2, AlertTriangle, Search, Ban, CheckSquare, ShieldCheck } from 'lucide-react'
import { Input } from '@/app/components/ui/input'
import { Checkbox } from '@/app/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog'
import type { Participant, BannedUser } from '@/hooks/useParticipants'

interface AdminPanelProps {
  participants: Participant[]
  bannedUsers: BannedUser[]
  onDelete: (id: string) => void
  onDeleteMultiple: (ids: string[]) => void
  onClearAll: () => void
  onStartRoulette: () => void
  onBanUser: (id: string, durationInDays: number) => void
  onUnbanUser: (id: string) => void
}

export function AdminPanel({ participants, bannedUsers, onDelete, onDeleteMultiple, onClearAll, onStartRoulette, onBanUser, onUnbanUser }: AdminPanelProps) {
  const [filterTeam, setFilterTeam] = useState<'all' | 'blue' | 'yellow' | 'red'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const [banDuration, setBanDuration] = useState<Record<string, number>>({})

  const filteredParticipants = (status: Participant['status']) =>
    participants.filter(p => {
      if (p.status !== status) return false
      if (filterTeam !== 'all' && p.team !== filterTeam) return false
      if (searchTerm && !p.username.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })

  const activeCount = participants.filter(p => p.status === 'active').length
  const winnerCount = participants.filter(p => p.status === 'winner').length

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) newSelection.delete(id)
    else newSelection.add(id)
    setSelectedIds(newSelection)
  }

  const handleBulkDelete = () => {
    onDeleteMultiple(Array.from(selectedIds))
    setSelectedIds(new Set())
  }

  const handleBanDurationChange = (id: string, days: number) => {
    setBanDuration(prev => ({ ...prev, [id]: days }))
  }

  const ParticipantList = ({ status }: { status: Participant['status'] }) => {
    const list = filteredParticipants(status)
    if (list.length === 0) return <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed">No hay resultados</div>

    return (
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        {list.map(p => (
          <div key={p.id} className="flex flex-wrap items-center justify-between p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition gap-2">
            <div className="flex items-center gap-3">
              <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelection(p.id)} />
              <div className={`w-4 h-4 rounded-full ring-2 ring-white shadow-sm ${p.team === 'blue' ? 'bg-blue-500' : p.team === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'}`} />
              <span className="font-semibold text-gray-700">{p.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <select 
                className="text-xs border rounded p-1.5"
                value={banDuration[p.id] || 1}
                onChange={(e) => handleBanDurationChange(p.id, Number(e.target.value))}
              >
                <option value={1}>1 Día</option>
                <option value={7}>1 Sem</option>
                <option value={14}>2 Sem</option>
                <option value={30}>1 Mes</option>
                <option value={36500}>Siempre</option>
              </select>
              <Button variant="outline" size="icon" onClick={() => onBanUser(p.id, banDuration[p.id] || 1)} title="Banear">
                <Ban className="h-4 w-4 text-orange-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto shadow-md">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Panel de Control</CardTitle>
            <div className="flex gap-2">
              <Button onClick={onStartRoulette} disabled={activeCount === 0} className="bg-indigo-600 hover:bg-indigo-700">
                Iniciar Ruleta
              </Button>
              <Button variant="destructive" onClick={() => setConfirmClearAll(true)} disabled={participants.length === 0}>
                <Trash2 className="w-4 h-4 mr-2" /> Limpiar Todo
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Stat label="Total Registros" value={participants.length} />
            <Stat label="En Juego" value={activeCount} color="text-green-600" bg="bg-green-50" />
            <Stat label="Ganadores" value={winnerCount} color="text-yellow-600" bg="bg-yellow-50" />
            <Stat label="Baneados" value={bannedUsers.length} color="text-orange-600" bg="bg-orange-50" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="Buscar por nombre..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            
            <div className="flex flex-wrap gap-2 p-1 bg-gray-100/50 rounded-lg">
               <Button variant={filterTeam === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterTeam('all')}>Todos</Button>
               <Button variant={filterTeam === 'blue' ? 'default' : 'ghost'} size="sm" className={filterTeam === 'blue' ? 'bg-blue-600' : 'text-blue-600 hover:bg-blue-50'} onClick={() => setFilterTeam('blue')}>Sabiduría</Button>
               <Button variant={filterTeam === 'yellow' ? 'default' : 'ghost'} size="sm" className={filterTeam === 'yellow' ? 'bg-yellow-500 text-black' : 'text-yellow-600 hover:bg-yellow-50'} onClick={() => setFilterTeam('yellow')}>Instinto</Button>
               <Button variant={filterTeam === 'red' ? 'default' : 'ghost'} size="sm" className={filterTeam === 'red' ? 'bg-red-600' : 'text-red-600 hover:bg-red-50'} onClick={() => setFilterTeam('red')}>Valor</Button>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="mb-4">
              <Button variant="destructive" onClick={handleBulkDelete}>
                <CheckSquare className="w-4 h-4 mr-2" /> Borrar Seleccionados ({selectedIds.size})
              </Button>
            </div>
          )}

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="active">Activos ({filteredParticipants('active').length})</TabsTrigger>
              <TabsTrigger value="winner">Ganadores ({filteredParticipants('winner').length})</TabsTrigger>
              <TabsTrigger value="discarded">Descartados ({filteredParticipants('discarded').length})</TabsTrigger>
              <TabsTrigger value="banned" className="text-orange-600">Baneados ({bannedUsers.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active"><ParticipantList status="active" /></TabsContent>
            <TabsContent value="winner"><ParticipantList status="winner" /></TabsContent>
            <TabsContent value="discarded"><ParticipantList status="discarded" /></TabsContent>
            
            <TabsContent value="banned">
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {bannedUsers.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed">Nadie en la lista negra</div>
                ) : (
                  bannedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                      <div>
                        <span className="font-semibold text-gray-700 block">{user.username}</span>
                        <span className="text-xs text-gray-500">Expira: {new Date(user.expires_at).toLocaleDateString()}</span>
                      </div>
                      <Button variant="outline" className="text-green-600 hover:bg-green-50 border-green-200" onClick={() => onUnbanUser(user.id)}>
                        <ShieldCheck className="h-4 w-4 mr-2" /> Quitar Ban
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar participante?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if(deleteId) onDelete(deleteId); setDeleteId(null) }} className="bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <AlertDialogContent className="border-red-200 bg-red-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-6 h-6" /> ¿Estas seguro?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-800">
              Estás a punto de borrar todos los registros. Las IPs volverán a estar permitidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white text-red-900 border-red-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onClearAll(); setConfirmClearAll(false) }} className="bg-red-600 text-white">SÍ, BORRAR TODO</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function Stat({ label, value, color = 'text-gray-800', bg = 'bg-gray-50' }: { label: string; value: number; color?: string; bg?: string }) {
  return (
    <div className={`p-4 rounded-lg border ${bg}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}