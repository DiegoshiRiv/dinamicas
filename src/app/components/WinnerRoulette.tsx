import { useState, useEffect, useRef } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { motion, animate } from 'motion/react'
import { Trophy, RotateCw, Check, X, RefreshCw, AlertCircle } from 'lucide-react'
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
import type { Participant } from '@/hooks/useParticipants'

interface WinnerRouletteProps {
  onBack: () => void
  participants: Participant[]
  updateStatus: (id: string, status: string) => void
  onResetGame: () => Promise<void>
}

const teamColors = { yellow: '#facc15', red: '#ef4444', blue: '#3b82f6' }
const teamNames = { yellow: 'Instinto', red: 'Valor', blue: 'Sabiduría' }

export function WinnerRoulette({ onBack, participants, updateStatus, onResetGame }: WinnerRouletteProps) {
  const [activeList, setActiveList] = useState<Participant[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<Participant | null>(null)
  const [rotation, setRotation] = useState(0)
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set())
  const [isResetting, setIsResetting] = useState(false)
  
  // Estado para controlar el modal de confirmación
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!isSpinning && !winner) {
      const cleanList = participants
        .filter(p => p.status === 'active')
        .filter(p => !processedIds.has(p.id))
      setActiveList(cleanList)
    }
  }, [participants, isSpinning, winner, processedIds])

  useEffect(() => {
    if (activeList.length > 0) drawRoulette()
  }, [activeList, rotation])

  const drawRoulette = () => {
    const canvas = canvasRef.current
    if (!canvas || activeList.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 20
    const anglePerSegment = (2 * Math.PI) / activeList.length

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    activeList.forEach((p, index) => {
      const start = index * anglePerSegment + (rotation * Math.PI) / 180
      const end = start + anglePerSegment

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, start, end)
      ctx.closePath()
      
      // @ts-ignore
      ctx.fillStyle = teamColors[p.team] ?? '#999999'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(start + anglePerSegment / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText(p.username, radius - 20, 5)
      ctx.restore()
    })

    ctx.beginPath()
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(centerX - 14, centerY - radius - 18)
    ctx.lineTo(centerX + 14, centerY - radius - 18)
    ctx.lineTo(centerX, centerY - radius + 6)
    ctx.closePath()
    ctx.fillStyle = '#000000'
    ctx.fill()
  }

  const spinRoulette = () => {
    if (isSpinning || activeList.length === 0) return
    setIsSpinning(true)
    setWinner(null)

    const totalRotation = 360 * 5 + Math.random() * 360
    
    animate(rotation, rotation + totalRotation, {
      duration: 5,
      ease: [0.32, 0.72, 0, 1],
      onUpdate: (latest) => setRotation(latest),
      onComplete: () => {
        const normalizedRotation = (rotation + totalRotation + 90) % 360
        const segmentAngle = 360 / activeList.length
        const index = Math.floor((360 - normalizedRotation) / segmentAngle) % activeList.length
        setWinner(activeList[index])
        setIsSpinning(false)
      },
    })
  }

  const handleDecision = async (status: 'winner' | 'discarded') => {
    if (!winner) return
    const winnerId = winner.id
    setProcessedIds(prev => new Set(prev).add(winnerId))
    setActiveList(prev => prev.filter(p => p.id !== winnerId))
    setWinner(null)
    await updateStatus(winnerId, status)
  }

  // Esta función ahora solo abre el modal
  const handleResetClick = () => {
    setShowResetConfirm(true)
  }

  // Esta función ejecuta la acción real al confirmar en el modal
  const executeReset = async () => {
    setIsResetting(true)
    setRotation(0)
    setProcessedIds(new Set())
    await onResetGame()
    setIsResetting(false)
    setShowResetConfirm(false)
  }

  // UI cuando la ruleta está vacía
  if (activeList.length === 0 && !winner) {
    return (
      <>
        <Card className="w-full max-w-lg mx-auto text-center p-10 shadow-lg border-2">
          <h2 className="text-2xl font-bold text-gray-400 mb-4">¡Ruleta vacía!</h2>
          <p className="text-gray-500 mb-6">Todos los participantes han pasado.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={onBack} variant="outline">Volver</Button>
            <Button onClick={handleResetClick} disabled={isResetting}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
              Reiniciar Todo
            </Button>
          </div>
        </Card>
        
        {/* Renderizamos el modal también aquí por si acaso */}
        <ResetAlertDialog 
          open={showResetConfirm} 
          onOpenChange={setShowResetConfirm} 
          onConfirm={executeReset} 
        />
      </>
    )
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto shadow-2xl border-2 border-indigo-100">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Ruleta de la Suerte</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack} disabled={isSpinning}>Volver</Button>
            <Button variant="ghost" onClick={handleResetClick} disabled={isSpinning || isResetting} title="Reiniciar ronda completa">
              <RotateCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
          
          <div className="flex justify-center relative">
            <canvas ref={canvasRef} width={500} height={500} className="max-w-full h-auto drop-shadow-xl" />
          </div>

          {winner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-8 rounded-xl border-4 shadow-2xl bg-white relative overflow-hidden max-w-md w-full"
                // @ts-ignore
                style={{ borderColor: teamColors[winner.team] }}
              >
                {/* @ts-ignore */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundColor: teamColors[winner.team] }}></div>
                <div className="relative z-10">
                  <Trophy className="mx-auto h-20 w-20 mb-4 text-yellow-500 drop-shadow-md" />
                  <h3 className="text-4xl font-black mb-2 text-gray-800 break-words">{winner.username}</h3>
                  {/* @ts-ignore */}
                  <p className="text-lg font-medium mb-8" style={{ color: teamColors[winner.team] }}>Equipo {teamNames[winner.team]}</p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button size="lg" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleDecision('discarded')}>
                      <X className="w-5 h-5 mr-2" /> Descartar
                    </Button>
                    <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleDecision('winner')}>
                      <Check className="w-5 h-5 mr-2" /> Confirmar
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {!winner && (
            <div className="flex justify-center pb-4">
              <Button size="lg" className="px-12 py-6 text-xl rounded-full shadow-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:scale-105 transition" onClick={spinRoulette} disabled={isSpinning}>
                {isSpinning ? '¡Girando...!' : 'GIRAR RULETA'}
              </Button>
            </div>
          )}
          <p className="text-center text-sm text-gray-400">Participantes en juego: {activeList.length}</p>
        </CardContent>
      </Card>

      {/* MODAL DE CONFIRMACIÓN DE REINICIO */}
      <ResetAlertDialog 
        open={showResetConfirm} 
        onOpenChange={setShowResetConfirm} 
        onConfirm={executeReset} 
      />
    </>
  )
}

// Componente separado para el Modal (para no repetir código)
function ResetAlertDialog({ open, onOpenChange, onConfirm }: { open: boolean, onOpenChange: (open: boolean) => void, onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-amber-200 bg-amber-50">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-6 h-6" /> 
            ¿Reiniciar la ronda?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-amber-900/80">
            Esto devolverá a <b>todos los participantes</b> (incluyendo ganadores y descartados) a la ruleta para jugar de nuevo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-white hover:bg-amber-100 border-amber-200 text-amber-900">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-amber-600 hover:bg-amber-700 text-white border-none">
            Sí, reiniciar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}