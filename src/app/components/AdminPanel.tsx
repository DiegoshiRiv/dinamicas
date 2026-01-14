import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog'

interface Participant {
  id: string
  username: string
  team: 'blue' | 'yellow' | 'red'
  status: 'active' | 'winner' | 'discarded'
  registeredAt: string
}

interface AdminPanelProps {
  onStartRoulette: () => void
}

export function AdminPanel({ onStartRoulette }: AdminPanelProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [filterTeam, setFilterTeam] =
    useState<'all' | 'blue' | 'yellow' | 'red'>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [confirmClearAll, setConfirmClearAll] = useState(false)

  useEffect(() => {
    loadParticipants()
  }, [])

  const loadParticipants = () => {
    const data = JSON.parse(localStorage.getItem('participants') || '[]')
    setParticipants(data)
  }

  const handleDelete = (id: string) => {
    const updated = participants.filter(p => p.id !== id)
    localStorage.setItem('participants', JSON.stringify(updated))
    setParticipants(updated)
    setDeleteId(null)
  }

  const filteredParticipants = (status: Participant['status']) =>
    participants.filter(p => {
      if (p.status !== status) return false
      if (filterTeam === 'all') return true
      return p.team === filterTeam
    })

  const activeCount = participants.filter(p => p.status === 'active').length
  const winnerCount = participants.filter(p => p.status === 'winner').length
  const discardedCount = participants.filter(p => p.status === 'discarded').length

  const ParticipantList = ({ status }: { status: Participant['status'] }) => {
    const list = filteredParticipants(status)

    if (list.length === 0) {
      return (
        <p className="text-center text-gray-500 py-8">
          No hay participantes en esta categoría
        </p>
      )
    }

    return (
      <div className="space-y-2">
        {list.map(p => (
          <div
            key={p.id}
            className="flex items-center justify-between p-3 bg-white border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  p.team === 'blue'
                    ? 'bg-blue-500'
                    : p.team === 'yellow'
                    ? 'bg-yellow-400'
                    : 'bg-red-500'
                }`}
              />
              <span className="font-medium">{p.username}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(p.id)}
              className="text-red-600 hover:bg-red-50"
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
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Panel de Administración</CardTitle>

            <div className="flex gap-2">
              <Button onClick={onStartRoulette} disabled={activeCount === 0}>
                Girar Ruleta
              </Button>

              <Button
                variant="destructive"
                onClick={() => setConfirmClearAll(true)}
                disabled={participants.length === 0}
              >
                Limpiar todos
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Stat label="Total" value={participants.length} />
            <Stat label="Activos" value={activeCount} color="text-green-600" />
            <Stat label="Ganadores" value={winnerCount} color="text-yellow-500" />
            <Stat label="Descartados" value={discardedCount} color="text-red-600" />
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Filtrar por equipo</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={filterTeam === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterTeam('all')}
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={filterTeam === 'blue' ? 'default' : 'outline'}
                className={filterTeam === 'blue' ? 'bg-blue-500 text-white' : ''}
                onClick={() => setFilterTeam('blue')}
              >
                Sabiduría
              </Button>
              <Button
                size="sm"
                variant={filterTeam === 'yellow' ? 'default' : 'outline'}
                className={
                  filterTeam === 'yellow' ? 'bg-yellow-400 text-black' : ''
                }
                onClick={() => setFilterTeam('yellow')}
              >
                Instinto
              </Button>
              <Button
                size="sm"
                variant={filterTeam === 'red' ? 'default' : 'outline'}
                className={filterTeam === 'red' ? 'bg-red-500 text-white' : ''}
                onClick={() => setFilterTeam('red')}
              >
                Valor
              </Button>
            </div>
          </div>

          <Tabs defaultValue="active">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Activos</TabsTrigger>
              <TabsTrigger value="winner">Ganadores</TabsTrigger>
              <TabsTrigger value="discarded">Descartados</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              <ParticipantList status="active" />
            </TabsContent>
            <TabsContent value="winner" className="mt-4">
              <ParticipantList status="winner" />
            </TabsContent>
            <TabsContent value="discarded" className="mt-4">
              <ParticipantList status="discarded" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Eliminar uno */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar participante?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Limpiar todos */}
      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar todos los participantes?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará todos los registros y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                localStorage.removeItem('participants')
                setParticipants([])
                setConfirmClearAll(false)
              }}
            >
              Eliminar todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function Stat({
  label,
  value,
  color = 'text-gray-800',
}: {
  label: string
  value: number
  color?: string
}) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
