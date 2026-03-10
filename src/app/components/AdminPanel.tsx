import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Trash2, AlertTriangle, Search, Ban, CheckSquare, ShieldCheck, Plus, Instagram, ChevronUp, ChevronDown, Pencil, Image as ImageIcon } from 'lucide-react'
import { Input } from '@/app/components/ui/input'
import { Checkbox } from '@/app/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog'
import type { Participant, BannedUser, Sponsor, Banner } from '@/hooks/useParticipants'

interface AdminPanelProps {
  participants: Participant[]; bannedUsers: BannedUser[]; sponsors: Sponsor[]; banners: Banner[]
  onDelete: (id: string) => void; onDeleteMultiple: (ids: string[]) => void; onClearAll: () => void; onStartRoulette: () => void
  onBanUser: (id: string, durationInDays: number) => void; onUnbanUser: (id: string) => void
  onAddSponsor: (url: string) => Promise<void>; onDeleteSponsor: (id: string) => Promise<void>
  onDeleteMultipleSponsors: (ids: string[]) => Promise<void>; onUpdateSponsorsOrder: (list: Sponsor[]) => Promise<void>
  onUpdateSponsorImage: (id: string, url: string) => Promise<void>
  onAddBanner: (url: string) => Promise<void>; onDeleteBanner: (id: string) => Promise<void>
}

export function AdminPanel({ participants, bannedUsers, sponsors, banners, onDelete, onDeleteMultiple, onClearAll, onStartRoulette, onBanUser, onUnbanUser, onAddSponsor, onDeleteSponsor, onDeleteMultipleSponsors, onUpdateSponsorsOrder, onUpdateSponsorImage, onAddBanner, onDeleteBanner }: AdminPanelProps) {
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
    if (newUrl && newUrl !== s.image_url) onUpdateSponsorImage(s.id, newUrl.trim())
  }

  const handleAddBanner = () => {
    const url = window.prompt('Pega el enlace directo de la imagen para el banner (Imgur, etc):')
    if (url) onAddBanner(url.trim())
  }

  const moveSponsor = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sponsors.length - 1) return;
    const newSponsors = [...sponsors];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newSponsors[index];
    newSponsors[index] = newSponsors[swapIndex];
    newSponsors[swapIndex] = temp;
    onUpdateSponsorsOrder(newSponsors);
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto shadow-xl border-0 sm:border border-gray-100 rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-gray-50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800">Panel de Control</CardTitle>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={onStartRoulette} disabled={activeCount === 0} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm rounded-xl">Iniciar Ruleta</Button>
              <Button variant="destructive" onClick={() => setConfirmClearAll(true)} disabled={participants.length === 0} className="shadow-sm rounded-xl">
                <Trash2 className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Limpiar Todo</span><span className="sm:hidden">Limpiar</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Stat label="Total Registros" value={participants.length} />
            <Stat label="En Juego" value={activeCount} color="text-green-600" bg="bg-green-50" />
            <Stat label="Ganadores" value={winnerCount} color="text-yellow-600" bg="bg-yellow-50" />
            <Stat label="Patrocinadores" value={sponsors.length} color="text-pink-600" bg="bg-pink-50" />
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="flex flex-wrap justify-center w-full mb-6 h-auto gap-2 bg-transparent p-1">
              <TabsTrigger value="active" className="flex-1 min-w-[100px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg border border-transparent data-[state=active]:border-gray-200">Activos</TabsTrigger>
              <TabsTrigger value="winner" className="flex-1 min-w-[100px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg border border-transparent data-[state=active]:border-gray-200">Ganadores</TabsTrigger>
              <TabsTrigger value="discarded" className="flex-1 min-w-[100px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg border border-transparent data-[state=active]:border-gray-200">Descartados</TabsTrigger>
              <TabsTrigger value="banned" className="flex-1 min-w-[100px] text-orange-600 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg border border-transparent data-[state=active]:border-gray-200">Baneados</TabsTrigger>
              <TabsTrigger value="sponsors" className="flex-1 min-w-[100px] text-pink-600 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg border border-transparent data-[state=active]:border-gray-200">Sponsors</TabsTrigger>
            </TabsList>

            {/* Pestañas de participantes... (Igual que antes) */}
            {['active', 'winner', 'discarded'].map(status => {
              const list = participants.filter(p => p.status === status && (filterTeam === 'all' || p.team === filterTeam) && (!searchTerm || p.username.toLowerCase().includes(searchTerm.toLowerCase())))
              return (
              <TabsContent key={status} value={status} className="animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-4 justify-between items-center bg-gray-50/50 p-2 sm:p-3 rounded-xl border border-gray-100">
                  <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Buscar por nombre..." className="pl-9 bg-white border-gray-200 rounded-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex flex-wrap justify-center gap-1.5 p-1 bg-white rounded-lg shadow-sm border border-gray-100 w-full md:w-auto">
                    <Button variant={filterTeam === 'all' ? 'secondary' : 'ghost'} size="sm" className="rounded-md" onClick={() => setFilterTeam('all')}>Todos</Button>
                    <Button variant={filterTeam === 'blue' ? 'default' : 'ghost'} size="sm" className={`rounded-md ${filterTeam === 'blue' ? 'bg-blue-600' : 'text-blue-600'}`} onClick={() => setFilterTeam('blue')}>Sabiduría</Button>
                    <Button variant={filterTeam === 'yellow' ? 'default' : 'ghost'} size="sm" className={`rounded-md ${filterTeam === 'yellow' ? 'bg-yellow-500 text-black' : 'text-yellow-600'}`} onClick={() => setFilterTeam('yellow')}>Instinto</Button>
                    <Button variant={filterTeam === 'red' ? 'default' : 'ghost'} size="sm" className={`rounded-md ${filterTeam === 'red' ? 'bg-red-600' : 'text-red-600'}`} onClick={() => setFilterTeam('red')}>Valor</Button>
                  </div>
                </div>
                {selectedIds.size > 0 && (
                  <div className="mb-4">
                    <Button variant="destructive" onClick={() => { onDeleteMultiple(Array.from(selectedIds)); setSelectedIds(new Set()) }} className="w-full sm:w-auto rounded-xl">
                      <CheckSquare className="w-4 h-4 mr-2" /> Borrar Seleccionados ({selectedIds.size})
                    </Button>
                  </div>
                )}
                <div className="space-y-2 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2 scroll-smooth">
                  {list.length === 0 ? <div className="text-center py-10 sm:py-16 text-gray-400 border border-dashed rounded-xl">No hay resultados</div> : list.map(p => (
                    <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition gap-3">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelection(p.id)} className="w-5 h-5 rounded" />
                        <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ring-2 ring-white shadow-sm flex-shrink-0 ${p.team === 'blue' ? 'bg-blue-500' : p.team === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                        <span className="font-semibold text-gray-700 text-sm sm:text-base truncate max-w-[180px] sm:max-w-[250px]">{p.username}</span>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end">
                        <select className="text-xs sm:text-sm border-gray-200 rounded-lg p-1.5 sm:p-2 bg-gray-50 focus:ring-orange-500 focus:border-orange-500" value={banDuration[p.id] || 1} onChange={(e) => setBanDuration(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}>
                          <option value={1}>1 Día</option><option value={7}>1 Sem</option><option value={14}>2 Sem</option><option value={36500}>Siempre</option>
                        </select>
                        <Button variant="outline" size="icon" onClick={() => onBanUser(p.id, banDuration[p.id] || 1)} className="rounded-lg border-orange-200 hover:bg-orange-50 hover:text-orange-600" title="Banear"><Ban className="h-4 w-4 text-orange-500" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} className="rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )})}
            
            {/* Pestaña Baneados */}
            <TabsContent value="banned" className="animate-in fade-in duration-300">
              <div className="space-y-2 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2">
                {bannedUsers.length === 0 ? <div className="text-center py-12 text-gray-400 border border-dashed rounded-xl">Nadie en la lista negra</div> : bannedUsers.map(user => (
                  <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-orange-50/50 border border-orange-100 rounded-xl shadow-sm gap-3">
                    <div>
                      <span className="font-bold text-gray-800 block text-base">{user.username}</span>
                      <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full mt-1 inline-block">Expira: {new Date(user.expires_at).toLocaleDateString()}</span>
                    </div>
                    <Button variant="outline" className="w-full sm:w-auto rounded-xl text-green-700 hover:bg-green-100 border-green-200 shadow-sm" onClick={() => onUnbanUser(user.id)}><ShieldCheck className="h-4 w-4 mr-2" /> Quitar Ban</Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Pestaña Patrocinadores + Banners */}
            <TabsContent value="sponsors" className="animate-in fade-in duration-300">
              
              {/* SECCIÓN DE BANNERS */}
              <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-xl mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <div>
                    <h3 className="font-bold text-purple-900 text-lg flex items-center gap-2"><ImageIcon className="w-5 h-5"/> Banners Promocionales</h3>
                    <p className="text-xs text-purple-600">Imágenes que rotarán en la vista del público.</p>
                  </div>
                  <Button onClick={handleAddBanner} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md">
                    <Plus className="w-4 h-4 mr-2" /> Añadir Banner
                  </Button>
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {banners.length === 0 ? <p className="text-sm text-purple-400 italic">No hay banners activos.</p> : banners.map(b => (
                    <div key={b.id} className="relative w-32 h-20 sm:w-40 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden group shadow-sm border border-purple-200">
                      <img src={b.image_url} alt="Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="destructive" size="icon" className="w-8 h-8 rounded-full" onClick={() => onDeleteBanner(b.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECCIÓN DE CUENTAS */}
              <h3 className="font-bold text-pink-900 text-lg mb-3 flex items-center gap-2"><Instagram className="w-5 h-5"/> Cuentas Patrocinadoras</h3>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 bg-pink-50/80 p-3 sm:p-4 rounded-xl border border-pink-100 gap-3">
                <Button onClick={() => setShowSponsorModal(true)} className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-md">
                  <Plus className="w-4 h-4 mr-2" /> Añadir Patrocinador
                </Button>
                {selectedSponsorIds.size > 0 && (
                  <Button variant="destructive" className="w-full sm:w-auto rounded-xl" onClick={() => { onDeleteMultipleSponsors(Array.from(selectedSponsorIds)); setSelectedSponsorIds(new Set()) }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Borrar ({selectedSponsorIds.size})
                  </Button>
                )}
              </div>

              <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto pr-1 sm:pr-2 scroll-smooth">
                {sponsors.length === 0 ? <div className="text-center py-10 text-gray-400 border border-dashed rounded-xl">No hay patrocinadores.</div> : sponsors.map((s, index) => (
                  <div key={s.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-pink-200 transition gap-3 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-3 overflow-hidden w-full sm:w-auto">
                      <Checkbox checked={selectedSponsorIds.has(s.id)} onCheckedChange={() => toggleSponsorSelection(s.id)} className="w-5 h-5 rounded ml-1 mr-1" />
                      <div className="flex flex-col bg-gray-50 rounded-lg p-0.5 border border-gray-100 mr-1">
                        <button onClick={() => moveSponsor(index, 'up')} disabled={index === 0} className="p-0.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors" title="Subir"><ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                        <button onClick={() => moveSponsor(index, 'down')} disabled={index === sponsors.length - 1} className="p-0.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors" title="Bajar"><ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                      </div>
                      <img src={s.image_url} alt={s.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-200 object-cover bg-white shadow-sm flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + s.name + '&background=random' }} />
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-700 hover:text-pink-600 truncate flex items-center gap-1.5 text-sm sm:text-base max-w-[150px] sm:max-w-xs ml-1"><Instagram className="w-3.5 h-3.5 flex-shrink-0" /> @{s.name}</a>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end border-t sm:border-0 border-gray-50 pt-2 sm:pt-0">
                      <Button variant="ghost" size="sm" onClick={() => handleEditImage(s)} className="rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50" title="Cambiar foto"><Pencil className="h-4 w-4 sm:mr-2" /> <span className="text-xs font-medium sm:hidden">Foto</span></Button>
                      <Button variant="ghost" size="sm" onClick={() => onDeleteSponsor(s.id)} className="rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50" title="Eliminar"><Trash2 className="h-4 w-4 sm:mr-2" /> <span className="text-xs font-medium sm:hidden">Borrar</span></Button>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSponsorModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full border-t-4 border-pink-500" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-5"><div className="bg-pink-50 p-4 rounded-full text-pink-500 shadow-inner"><Instagram className="w-8 h-8" /></div></div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center text-gray-800">Añadir Patrocinador</h2>
            <p className="text-sm text-gray-500 mb-6 text-center leading-relaxed">Pega el link de su perfil de Instagram o su usuario directo.</p>
            <Input autoFocus placeholder="Ej: https://instagram.com/michiblue2299" value={newSponsorUrl} onChange={(e) => setNewSponsorUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitSponsor()} className="mb-6 border-gray-200 focus-visible:ring-pink-500 rounded-xl px-4 py-3 bg-gray-50 text-base" />
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="rounded-xl font-medium" onClick={() => setShowSponsorModal(false)}>Cancelar</Button>
              <Button onClick={submitSponsor} disabled={addingSponsor || !newSponsorUrl} className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-medium shadow-md shadow-pink-500/20">{addingSponsor ? 'Buscando...' : 'Guardar'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modales de Borrado */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader><AlertDialogTitle className="text-xl">¿Eliminar participante?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto rounded-xl border-gray-200 mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if(deleteId) onDelete(deleteId); setDeleteId(null) }} className="w-full sm:w-auto rounded-xl bg-red-600 shadow-md shadow-red-500/20">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <AlertDialogContent className="border-red-200 bg-[#fff5f5] rounded-2xl max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-red-700 text-xl"><AlertTriangle className="w-7 h-7" /> ¿Estas seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-red-800/80 mt-2 text-base">Vas a borrar el registro de todos los participantes activos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <AlertDialogCancel className="w-full sm:w-auto rounded-xl bg-white text-red-900 border-red-200 hover:bg-red-50 mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onClearAll(); setConfirmClearAll(false) }} className="w-full sm:w-auto rounded-xl bg-red-600 text-white shadow-md shadow-red-500/20 font-bold tracking-wide">SÍ, BORRAR TODO</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function Stat({ label, value, color = 'text-gray-800', bg = 'bg-gray-50' }: { label: string; value: number; color?: string; bg?: string }) { 
  return (
    <div className={`p-3 sm:p-5 rounded-xl border border-gray-100/50 shadow-sm flex flex-col items-center justify-center text-center h-full ${bg}`}>
      <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 opacity-80">{label}</p>
      <p className={`text-2xl sm:text-4xl font-black ${color} tracking-tight`}>{value}</p>
    </div>
  )
}