import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Trash2, AlertTriangle, Search, Ban, CheckSquare, ShieldCheck, Plus, Instagram, GripVertical, Pencil } from 'lucide-react'
import { Input } from '@/app/components/ui/input'
import { Checkbox } from '@/app/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog'
import type { Participant, BannedUser, Sponsor } from '@/hooks/useParticipants'

interface AdminPanelProps {
  participants: Participant[]; bannedUsers: BannedUser[]; sponsors: Sponsor[]
  onDelete: (id: string) => void; onDeleteMultiple: (ids: string[]) => void; onClearAll: () => void; onStartRoulette: () => void
  onBanUser: (id: string, durationInDays: number) => void; onUnbanUser: (id: string) => void
  onAddSponsor: (url: string) => Promise<void>; onDeleteSponsor: (id: string) => Promise<void>
  onDeleteMultipleSponsors: (ids: string[]) => Promise<void>; onUpdateSponsorsOrder: (list: Sponsor[]) => Promise<void>
  onUpdateSponsorImage: (id: string, url: string) => Promise<void>
}

export function AdminPanel({ participants, bannedUsers, sponsors, onDelete, onDeleteMultiple, onClearAll, onStartRoulette, onBanUser, onUnbanUser, onAddSponsor, onDeleteSponsor, onDeleteMultipleSponsors, onUpdateSponsorsOrder, onUpdateSponsorImage }: AdminPanelProps) {
  const [filterTeam, setFilterTeam] = useState<'all' | 'blue' | 'yellow' | 'red'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedSponsorIds, setSelectedSponsorIds] = useState<Set<string>>(new Set())
  
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const [banDuration, setBanDuration] = useState<Record<string, number>>({})
  
  const [showSponsorModal, setShowSponsorModal] = useState(false)
  const [newSponsorUrl, setNewSponsorUrl] = useState('')
  const [addingSponsor, setAddingSponsor] = useState(false)

  const activeCount = participants.filter(p => p.status === 'active').length
  const winnerCount = participants.filter(p => p.status === 'winner').length

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds)
    newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id)
    setSelectedIds(newSelection)
  }

  const toggleSponsorSelection = (id: string) => {
    const newSelection = new Set(selectedSponsorIds)
    newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id)
    setSelectedSponsorIds(newSelection)
  }

  const submitSponsor = async () => {
    if (!newSponsorUrl.trim()) return
    setAddingSponsor(true)
    await onAddSponsor(newSponsorUrl.trim())
    setNewSponsorUrl('')
    setAddingSponsor(false)
    setShowSponsorModal(false)
  }

  const handleEditImage = (s: Sponsor) => {
    const newUrl = window.prompt(`Pega el link directo de la foto para @${s.name} (Ej: link de imgur o postimages):`, s.image_url)
    if (newUrl && newUrl !== s.image_url) {
      onUpdateSponsorImage(s.id, newUrl.trim())
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => e.dataTransfer.setData('sponsorId', id)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('sponsorId')
    if (draggedId === targetId) return
    const oldIndex = sponsors.findIndex(s => s.id === draggedId)
    const newIndex = sponsors.findIndex(s => s.id === targetId)
    const newSponsors = [...sponsors]
    const [moved] = newSponsors.splice(oldIndex, 1)
    newSponsors.splice(newIndex, 0, moved)
    onUpdateSponsorsOrder(newSponsors)
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto shadow-md">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Panel de Control</CardTitle>
            <div className="flex gap-2">
              <Button onClick={onStartRoulette} disabled={activeCount === 0} className="bg-indigo-600 hover:bg-indigo-700">Iniciar Ruleta</Button>
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
            <Stat label="Patrocinadores" value={sponsors.length} color="text-pink-600" bg="bg-pink-50" />
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-4 overflow-x-auto h-auto min-h-10">
              <TabsTrigger value="active">Activos</TabsTrigger>
              <TabsTrigger value="winner">Ganadores</TabsTrigger>
              <TabsTrigger value="discarded">Descartados</TabsTrigger>
              <TabsTrigger value="banned" className="text-orange-600">Baneados</TabsTrigger>
              <TabsTrigger value="sponsors" className="text-pink-600">Patrocinadores</TabsTrigger>
            </TabsList>

            {/* Pestaña Activos / Ganadores / Descartados */}
            {['active', 'winner', 'discarded'].map(status => {
              const list = participants.filter(p => p.status === status && (filterTeam === 'all' || p.team === filterTeam) && (!searchTerm || p.username.toLowerCase().includes(searchTerm.toLowerCase())))
              return (
              <TabsContent key={status} value={status}>
                <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-between items-center">
                  <div className="relative flex-1 w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input placeholder="Buscar por nombre..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex flex-wrap gap-2 p-1 bg-gray-100/50 rounded-lg">
                    <Button variant={filterTeam === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterTeam('all')}>Todos</Button>
                    <Button variant={filterTeam === 'blue' ? 'default' : 'ghost'} size="sm" className={filterTeam === 'blue' ? 'bg-blue-600' : 'text-blue-600'} onClick={() => setFilterTeam('blue')}>Sabiduría</Button>
                    <Button variant={filterTeam === 'yellow' ? 'default' : 'ghost'} size="sm" className={filterTeam === 'yellow' ? 'bg-yellow-500 text-black' : 'text-yellow-600'} onClick={() => setFilterTeam('yellow')}>Instinto</Button>
                    <Button variant={filterTeam === 'red' ? 'default' : 'ghost'} size="sm" className={filterTeam === 'red' ? 'bg-red-600' : 'text-red-600'} onClick={() => setFilterTeam('red')}>Valor</Button>
                  </div>
                </div>
                {selectedIds.size > 0 && (
                  <div className="mb-4">
                    <Button variant="destructive" onClick={() => { onDeleteMultiple(Array.from(selectedIds)); setSelectedIds(new Set()) }}>
                      <CheckSquare className="w-4 h-4 mr-2" /> Borrar Seleccionados ({selectedIds.size})
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {list.length === 0 ? <div className="text-center py-12 text-gray-400">No hay resultados</div> : list.map(p => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition gap-2">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelection(p.id)} />
                        <div className={`w-4 h-4 rounded-full ring-2 ring-white shadow-sm ${p.team === 'blue' ? 'bg-blue-500' : p.team === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                        <span className="font-semibold text-gray-700">{p.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select className="text-xs border rounded p-1.5" value={banDuration[p.id] || 1} onChange={(e) => setBanDuration(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}>
                          <option value={1}>1 Día</option><option value={7}>1 Sem</option><option value={14}>2 Sem</option><option value={36500}>Siempre</option>
                        </select>
                        <Button variant="outline" size="icon" onClick={() => onBanUser(p.id, banDuration[p.id] || 1)}><Ban className="h-4 w-4 text-orange-500" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )})}
            
            {/* Pestaña Patrocinadores */}
            <TabsContent value="sponsors">
              <div className="flex justify-between items-center mb-4 bg-pink-50/50 p-2 rounded-lg border border-pink-100">
                <Button onClick={() => setShowSponsorModal(true)} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-md">
                  <Plus className="w-4 h-4 mr-2" /> Añadir Patrocinador
                </Button>
                
                {selectedSponsorIds.size > 0 && (
                  <Button variant="destructive" onClick={() => { onDeleteMultipleSponsors(Array.from(selectedSponsorIds)); setSelectedSponsorIds(new Set()) }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Borrar Seleccionados ({selectedSponsorIds.size})
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-4 ml-1">💡 Si Instagram bloqueó la foto (sale una letra), da clic en el <b>Lápiz</b> para poner un link de imagen manual.</p>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {sponsors.length === 0 ? <div className="text-center py-8 text-gray-400 border border-dashed rounded-lg">No hay patrocinadores.</div> : sponsors.map(s => (
                  <div 
                    key={s.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, s.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, s.id)}
                    className="flex justify-between items-center p-3 bg-white border rounded-xl shadow-sm hover:shadow-md hover:border-pink-200 transition cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Checkbox checked={selectedSponsorIds.has(s.id)} onCheckedChange={() => toggleSponsorSelection(s.id)} />
                      <GripVertical className="text-gray-300 w-5 h-5 flex-shrink-0" />
                      <img src={s.image_url} alt={s.name} className="w-10 h-10 rounded-full border border-gray-200 object-cover bg-gray-50" onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + s.name + '&background=random' }} />
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-700 hover:text-pink-600 truncate flex items-center gap-1">
                        <Instagram className="w-3 h-3" /> @{s.name}
                      </a>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Botón de Editar Foto */}
                      <Button variant="ghost" size="icon" onClick={() => handleEditImage(s)} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Cambiar foto">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDeleteSponsor(s.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>

      {/* MODAL PARA AÑADIR PATROCINADOR DE INSTAGRAM */}
      {showSponsorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSponsorModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border-t-4 border-pink-500" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="bg-pink-100 p-3 rounded-full text-pink-600"><Instagram className="w-8 h-8" /></div>
            </div>
            <h2 className="text-xl font-bold mb-2 text-center text-gray-800">Añadir Patrocinador</h2>
            <p className="text-sm text-gray-500 mb-6 text-center">Pega el link de su perfil de Instagram o su usuario.</p>
            
            <Input 
              autoFocus
              placeholder="Ej: https://instagram.com/michiblue2299" 
              value={newSponsorUrl} 
              onChange={(e) => setNewSponsorUrl(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && submitSponsor()}
              className="mb-6 border-pink-200 focus-visible:ring-pink-500"
            />
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSponsorModal(false)}>Cancelar</Button>
              <Button onClick={submitSponsor} disabled={addingSponsor || !newSponsorUrl} className="bg-pink-600 hover:bg-pink-700 text-white">
                {addingSponsor ? 'Buscando...' : 'Guardar Patrocinador'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Otros modales */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Eliminar participante?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if(deleteId) onDelete(deleteId); setDeleteId(null) }} className="bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <AlertDialogContent className="border-red-200 bg-red-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700"><AlertTriangle className="w-6 h-6" /> ¿Estas seguro?</AlertDialogTitle>
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
function Stat({ label, value, color = 'text-gray-800', bg = 'bg-gray-50' }: { label: string; value: number; color?: string; bg?: string }) { return <div className={`p-4 rounded-lg border ${bg}`}><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p><p className={`text-3xl font-bold ${color}`}>{value}</p></div> }