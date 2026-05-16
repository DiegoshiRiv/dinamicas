import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Plus, Trash2, CheckCircle2, AlertTriangle, Lock, BarChart2 } from 'lucide-react'
import { usePolls } from '@/hooks/usePolls'

export function PollBoard({ isAdmin }: { isAdmin: boolean }) {
  const { polls, votes, createPoll, closePoll, deletePoll, castVote } = usePolls()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [clientIp, setClientIp] = useState<string>('')

  // Estado para la opción seleccionada antes de confirmar (por cada ID de encuesta)
  const [selectedOption, setSelectedOption] = useState<Record<string, number>>({})
  const [isVoting, setIsVoting] = useState<Record<string, boolean>>({})

  // Estados para los modales de confirmación del Admin
  const [confirmClose, setConfirmClose] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Obtenemos la IP para el bloqueo de votos
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setClientIp(data.ip))
      .catch(() => {})
  }, [])

  const handleAddOption = () => setOptions([...options, ''])
  const handleOptionChange = (index: number, val: string) => { const newOps = [...options]; newOps[index] = val; setOptions(newOps) }
  
  const handleCreate = async () => {
    const validOptions = options.filter(o => o.trim() !== '')
    if (!question.trim() || validOptions.length < 2) return
    await createPoll(question, validOptions)
    setQuestion(''); setOptions(['', ''])
  }

  const handleConfirmVote = async (pollId: string) => {
    const optIndex = selectedOption[pollId];
    if (optIndex === undefined || !clientIp) return;
    
    setIsVoting(prev => ({...prev, [pollId]: true}));
    try {
      await castVote(pollId, optIndex, clientIp);
    } catch (error) {
      alert("Tu dispositivo ya registró un voto en esta encuesta.");
    } finally {
      setIsVoting(prev => ({...prev, [pollId]: false}));
    }
  }

  const activePolls = isAdmin ? polls : polls.filter(p => p.is_active)

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      
      {/* CREADOR DE ENCUESTAS (SOLO ADMIN) */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-[24px] shadow-xl space-y-4 border border-gray-100">
          <h3 className="font-black text-gray-800 text-lg flex items-center gap-2"><BarChart2 className="w-5 h-5 text-emerald-500" /> Crear Nueva Encuesta</h3>
          <Input placeholder="Escribe la pregunta de la encuesta..." value={question} onChange={e => setQuestion(e.target.value)} className="font-black text-xl py-6 bg-gray-50 border-0" />
          <div className="space-y-3">
            {options.map((opt, i) => (
              <Input key={i} placeholder={`Opción ${i + 1}`} value={opt} onChange={e => handleOptionChange(i, e.target.value)} className="bg-white border-2" />
            ))}
          </div>
          <Button variant="outline" onClick={handleAddOption} className="w-full font-bold border-2 border-dashed border-gray-300 text-gray-500 hover:border-emerald-400 hover:text-emerald-500 py-6">
            <Plus className="w-5 h-5 mr-2" /> Añadir Opción
          </Button>
          <Button onClick={handleCreate} disabled={!question || options.filter(o => o.trim()).length < 2} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-6 text-lg shadow-lg">
            Publicar Encuesta
          </Button>
        </div>
      )}

      {/* LISTA DE ENCUESTAS */}
      <div className="space-y-6">
        {activePolls.length === 0 ? (
          <p className="text-center text-white/80 font-medium py-10 bg-black/10 rounded-2xl">No hay encuestas activas en este momento.</p>
        ) : activePolls.map(poll => {
          
          const pollVotes = votes.filter(v => v.poll_id === poll.id)
          const totalVotes = pollVotes.length
          const hasVoted = pollVotes.some(v => v.ip_address === clientIp)
          const showResults = hasVoted || isAdmin || !poll.is_active

          return (
            <div key={poll.id} className="bg-white p-6 sm:p-8 rounded-[24px] shadow-2xl border border-gray-100 transition-all">
              
              <div className="flex justify-between items-start mb-2 gap-4">
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">{poll.question}</h3>
                
                {/* BOTONES DE ADMINISTRACIÓN */}
                {isAdmin && (
                  <div className="flex gap-2 shrink-0">
                    {poll.is_active ? 
                      <Button variant="outline" size="sm" onClick={() => setConfirmClose(poll.id)} className="text-orange-600 border-orange-200 hover:bg-orange-50 font-bold"><Lock className="w-4 h-4 mr-1"/> Cerrar</Button> :
                      <span className="text-xs font-black text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg flex items-center">Cerrada</span>
                    }
                    <Button variant="destructive" size="icon" onClick={() => setConfirmDelete(poll.id)} className="h-9 w-9 rounded-lg"><Trash2 className="w-4 h-4"/></Button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 font-medium mb-6">Selecciona una opción.</p>

              {/* RENDERIZADO DE RESULTADOS O FORMULARIO DE VOTO */}
              {showResults ? (
                // ------------------ VISTA DE RESULTADOS (DISEÑO BONITO) ------------------
                <div className="space-y-4 mt-6">
                  {poll.options.map((opt, idx) => {
                    const optVotes = pollVotes.filter(v => v.option_index === idx).length
                    const percentage = totalVotes === 0 ? 0 : Math.round((optVotes / totalVotes) * 100)
                    const didIVoteForThis = pollVotes.some(v => v.ip_address === clientIp && v.option_index === idx)

                    return (
                      <div key={idx} className="relative w-full bg-gray-100 rounded-2xl h-14 flex items-center px-4 overflow-hidden border border-gray-200 shadow-inner">
                        {/* Barra Animada de Progreso */}
                        <div 
                          className={`absolute left-0 top-0 bottom-0 transition-all duration-1000 ease-out ${didIVoteForThis ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gray-300'}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                        
                        {/* Textos y Porcentajes */}
                        <div className="relative z-10 flex justify-between w-full items-center">
                          <span className={`font-bold flex items-center gap-2 ${didIVoteForThis ? 'text-white drop-shadow-md' : 'text-gray-700'}`}>
                            {didIVoteForThis && <CheckCircle2 className="w-5 h-5 text-white" />}
                            {opt}
                          </span>
                          <span className={`font-black tracking-wide ${didIVoteForThis ? 'text-white drop-shadow-md' : 'text-gray-600'}`}>
                            {percentage}% <span className="text-xs font-semibold opacity-80 ml-1">({optVotes})</span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                // ------------------ VISTA PARA VOTAR (RADIO BUTTONS) ------------------
                <div className="space-y-3 mt-6">
                  {poll.options.map((opt, idx) => {
                    const isSelected = selectedOption[poll.id] === idx;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedOption({...selectedOption, [poll.id]: idx})}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md transform scale-[1.02]' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-blue-500' : 'border-gray-300'}`}>
                          {isSelected && <div className="w-3 h-3 bg-blue-500 rounded-full" />}
                        </div>
                        <span className={`font-bold text-lg ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{opt}</span>
                      </div>
                    )
                  })}

                  <Button 
                    disabled={selectedOption[poll.id] === undefined || !clientIp || isVoting[poll.id]} 
                    onClick={() => handleConfirmVote(poll.id)}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-black py-6 text-lg rounded-xl shadow-lg transition-transform active:scale-95"
                  >
                    {isVoting[poll.id] ? 'Registrando...' : 'Votar'}
                  </Button>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-5 text-right font-bold uppercase tracking-widest">{totalVotes} {totalVotes === 1 ? 'voto emitido' : 'votos emitidos'}</p>
            </div>
          )
        })}
      </div>

      {/* MODAL DE CONFIRMACIÓN: CERRAR ENCUESTA */}
      {confirmClose && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-orange-400">
             <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="w-10 h-10 text-orange-500" /></div>
             <h3 className="text-2xl font-black mb-2 text-gray-900">¿Cerrar Encuesta?</h3>
             <p className="text-gray-600 mb-8">Ya no se aceptarán más votos, pero los resultados finales seguirán visibles para todos.</p>
             <div className="flex gap-3">
               <Button onClick={() => setConfirmClose(null)} variant="outline" className="flex-1 py-6 font-bold text-gray-500 border-2">Cancelar</Button>
               <Button onClick={() => { closePoll(confirmClose); setConfirmClose(null); }} className="flex-1 py-6 font-black bg-orange-500 text-white hover:bg-orange-600 shadow-lg">Cerrar</Button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN: BORRAR ENCUESTA */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-red-400">
             <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-10 h-10 text-red-500" /></div>
             <h3 className="text-2xl font-black mb-2 text-gray-900">¿Borrar Encuesta?</h3>
             <p className="text-gray-600 mb-8">Esta acción es irreversible y eliminará todos los votos registrados permanentemente.</p>
             <div className="flex gap-3">
               <Button onClick={() => setConfirmDelete(null)} variant="outline" className="flex-1 py-6 font-bold text-gray-500 border-2">Cancelar</Button>
               <Button onClick={() => { deletePoll(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-6 font-black bg-red-500 text-white hover:bg-red-600 shadow-lg">Sí, Borrar</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}