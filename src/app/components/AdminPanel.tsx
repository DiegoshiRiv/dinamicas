import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Trash2, AlertTriangle } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog'
import type { Participant } from '@/hooks/useParticipants'

interface AdminPanelProps {
  participants: Participant[]
  onDelete: (id: string) => void
  onClearAll: () => void
  onStartRoulette: () => void
}

export function AdminPanel({ participants, onDelete, onClearAll, onStartRoulette }: AdminPanelProps) {
  const [filterTeam, setFilterTeam] = useState<'all' | 'blue' | 'yellow' | 'red'>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [confirmClearAll, setConfirmClearAll] = useState(false)

  // Lógica de filtrado
  const filteredParticipants = (status: Participant['status']) =>
    participants.filter(p => {
      if (p.status !== status) return false
      if (filterTeam === 'all') return true
      return p.team === filterTeam
    })

  // Contadores
  const activeCount = participants.filter(p => p.status === 'active').length
  const winnerCount = participants.filter(p => p.status === 'winner').length
  const discardedCount = participants.filter(p => p.status === 'discarded').length

  // Sub-componente de lista
  const ParticipantList = ({ status }: { status: Participant['status'] }) => {
    const list = filteredParticipants(status)
    
    if (list.length === 0) return (
      <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
        No hay participantes en esta categoría
      </div>
    )

    return (
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        {list.map(p => (
          <div key={p.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className={`
                w-4 h-4 rounded-full ring-2 ring-white shadow-sm
                ${p.team === 'blue' ? 'bg-blue-500' : p.team === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'}
              `} />
              <span className="font-semibold text-gray-700">{p.username}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setDeleteId(p.id)} 
              className="text-gray-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Stat label="Total Registros" value={participants.length} />
            <Stat label="En Juego" value={activeCount} color="text-green-600" bg="bg-green-50" />
            <Stat label="Ganadores" value={winnerCount} color="text-yellow-600" bg="bg-yellow-50" />
            <Stat label="Descartados" value={discardedCount} color="text-red-600" bg="bg-red-50" />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-100/50 rounded-lg w-fit">
             <Button variant={filterTeam === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterTeam('all')}>Todos</Button>
             <Button variant={filterTeam === 'blue' ? 'default' : 'ghost'} size="sm" className={filterTeam === 'blue' ? 'bg-blue-600' : 'text-blue-600 hover:bg-blue-50'} onClick={() => setFilterTeam('blue')}>Sabiduría</Button>
             <Button variant={filterTeam === 'yellow' ? 'default' : 'ghost'} size="sm" className={filterTeam === 'yellow' ? 'bg-yellow-500 text-black hover:bg-yellow-600' : 'text-yellow-600 hover:bg-yellow-50'} onClick={() => setFilterTeam('yellow')}>Instinto</Button>
             <Button variant={filterTeam === 'red' ? 'default' : 'ghost'} size="sm" className={filterTeam === 'red' ? 'bg-red-600' : 'text-red-600 hover:bg-red-50'} onClick={() => setFilterTeam('red')}>Valor</Button>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="active">Activos ({filteredParticipants('active').length})</TabsTrigger>
              <TabsTrigger value="winner">Ganadores ({filteredParticipants('winner').length})</TabsTrigger>
              <TabsTrigger value="discarded">Descartados ({filteredParticipants('discarded').length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active"><ParticipantList status="active" /></TabsContent>
            <TabsContent value="winner"><ParticipantList status="winner" /></TabsContent>
            <TabsContent value="discarded"><ParticipantList status="discarded" /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Alertas de Confirmación */}
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
              <AlertTriangle className="w-6 h-6" /> 
              ¿Estas seguro?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-800">
              Estás a punto de borrar todo. <br/>
              
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white hover:bg-gray-100 border-red-200 text-red-900">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onClearAll(); setConfirmClearAll(false) }} className="bg-red-600 hover:bg-red-700 text-white">
              SÍ, BORRAR TODO
            </AlertDialogAction>
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
