import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { usePolls } from '@/hooks/usePolls'

export function PollBoard({ isAdmin }: { isAdmin: boolean }) {
  const { polls, votes, createPoll, closePoll, deletePoll, castVote } = usePolls()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [clientIp, setClientIp] = useState<string>('')

  useEffect(() => {
    fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => setClientIp(data.ip)).catch(() => {})
  }, [])

  const handleAddOption = () => setOptions([...options, ''])
  const handleOptionChange = (index: number, val: string) => { const newOps = [...options]; newOps[index] = val; setOptions(newOps) }
  
  const handleCreate = async () => {
    const validOptions = options.filter(o => o.trim() !== '')
    if (!question.trim() || validOptions.length < 2) return
    await createPoll(question, validOptions)
    setQuestion(''); setOptions(['', ''])
  }

  const handleVote = async (pollId: string, optIndex: number) => {
    if (!clientIp) return;
    try { await castVote(pollId, optIndex, clientIp) } 
    catch (e) { alert("Tu dispositivo ya registró un voto en esta encuesta.") }
  }

  const activePolls = isAdmin ? polls : polls.filter(p => p.is_active)

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {isAdmin && (
        <div className="bg-white p-6 rounded-[24px] shadow-xl space-y-4 border border-gray-100">
          <h3 className="font-black text-gray-800 text-lg">Crear Nueva Encuesta</h3>
          <Input placeholder="Escribe la pregunta..." value={question} onChange={e => setQuestion(e.target.value)} className="font-black text-xl py-6 bg-gray-50 border-0" />
          <div className="space-y-3">
            {options.map((opt, i) => (
              <Input key={i} placeholder={`Opción ${i + 1}`} value={opt} onChange={e => handleOptionChange(i, e.target.value)} className="bg-white border-2" />
            ))}
          </div>
          <Button variant="outline" onClick={handleAddOption} className="w-full font-bold border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500 py-6">
            <Plus className="w-5 h-5 mr-2" /> Añadir Opción
          </Button>
          <Button onClick={handleCreate} disabled={!question || options.filter(o => o.trim()).length < 2} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 text-lg shadow-lg">
            Publicar Encuesta
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {activePolls.length === 0 ? (
          <p className="text-center text-white/80 font-medium py-10 bg-black/10 rounded-2xl">No hay encuestas activas en este momento.</p>
        ) : activePolls.map(poll => {
          const pollVotes = votes.filter(v => v.poll_id === poll.id)
          const totalVotes = pollVotes.length
          const hasVoted = pollVotes.some(v => v.ip_address === clientIp) || (!poll.is_active && !isAdmin)

          return (
            <div key={poll.id} className="bg-white p-6 sm:p-8 rounded-[24px] shadow-xl border border-gray-100">
              <div className="flex justify-between items-start mb-6 gap-4">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">{poll.question}</h3>
                {isAdmin && (
                  <div className="flex gap-2 shrink-0">
                    {poll.is_active ? 
                      <Button variant="outline" size="sm" onClick={() => closePoll(poll.id)} className="text-orange-600 border-orange-200 hover:bg-orange-50 font-bold">Cerrar</Button> :
                      <span className="text-xs font-black text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg flex items-center">Cerrada</span>
                    }
                    <Button variant="destructive" size="icon" onClick={() => deletePoll(poll.id)} className="h-9 w-9 rounded-lg"><Trash2 className="w-4 h-4"/></Button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {poll.options.map((opt, idx) => {
                  const optVotes = pollVotes.filter(v => v.option_index === idx).length
                  const percentage = totalVotes === 0 ? 0 : Math.round((optVotes / totalVotes) * 100)
                  const didIVoteForThis = pollVotes.some(v => v.ip_address === clientIp && v.option_index === idx)

                  if (hasVoted || isAdmin) {
                    return (
                      <div key={idx} className="relative w-full bg-gray-50 rounded-xl h-14 flex items-center px-4 overflow-hidden border border-gray-100 shadow-sm">
                        <div className={`absolute left-0 top-0 bottom-0 transition-all duration-1000 ease-out ${didIVoteForThis ? 'bg-blue-200' : 'bg-gray-200'}`} style={{ width: `${percentage}%` }}></div>
                        <div className="relative z-10 flex justify-between w-full items-center">
                          <span className={`font-bold truncate pr-4 ${didIVoteForThis ? 'text-blue-900' : 'text-gray-700'}`}>
                            {opt} {didIVoteForThis && <CheckCircle2 className="inline w-5 h-5 ml-1.5 mb-0.5 text-blue-600 drop-shadow-sm"/>}
                          </span>
                          <span className={`font-black shrink-0 ${didIVoteForThis ? 'text-blue-900' : 'text-gray-600'}`}>{percentage}% <span className="text-xs font-bold opacity-60 ml-1">({optVotes})</span></span>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <Button key={idx} variant="outline" onClick={() => handleVote(poll.id, idx)} disabled={!clientIp} className="w-full justify-start h-auto py-4 px-5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 font-bold text-gray-700 text-left whitespace-normal text-base shadow-sm hover:shadow-md transition-all">
                      {opt}
                    </Button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-5 text-right font-bold uppercase tracking-widest">{totalVotes} votos emitidos</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}