import { useState, useRef, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { RotateCcw, LogOut, Radio } from 'lucide-react'
import type { Participant } from '@/hooks/useParticipants'
import confetti from 'canvas-confetti'

import moltres from '@/assets/moltres.png'
import zapdos from '@/assets/zapdos.png'
import articuno from '@/assets/articuno.png'

interface WinnerRouletteProps {
  onBack: () => void
  participants: Participant[]
  recentWinners: any[]
  updateStatus: (id: string, status: string) => void
  onResetGame: () => void
  
  // NUEVAS PROPIEDADES PARA ESPECTADORES
  isSpectator?: boolean
  incomingSpin?: { rotation: number, winnerId: string } | null
  broadcastSpin?: (rotation: number, winnerId: string) => void
}

export function WinnerRoulette({ 
  onBack, participants, updateStatus, onResetGame, 
  isSpectator = false, incomingSpin, broadcastSpin 
}: WinnerRouletteProps) {
  
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<Participant | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activePlayers = participants.filter(p => p.status === 'active')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width
    const center = size / 2
    const radius = center - 10

    ctx.clearRect(0, 0, size, size)

    if (activePlayers.length === 0) {
      ctx.beginPath()
      ctx.arc(center, center, radius, 0, 2 * Math.PI)
      ctx.fillStyle = '#f3f4f6'
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#e5e7eb'
      ctx.stroke()
      ctx.fillStyle = '#9ca3af'
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Sin participantes', center, center)
      return
    }

    const sliceAngle = (2 * Math.PI) / activePlayers.length

    activePlayers.forEach((player, i) => {
      const startAngle = i * sliceAngle - Math.PI / 2
      const endAngle = startAngle + sliceAngle

      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.arc(center, center, radius, startAngle, endAngle)
      ctx.closePath()

      if (player.team === 'blue') ctx.fillStyle = '#3B82F6'
      else if (player.team === 'yellow') ctx.fillStyle = '#FACC15'
      else if (player.team === 'red') ctx.fillStyle = '#EF4444'

      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()

      ctx.save()
      ctx.translate(center, center)
      ctx.rotate(startAngle + sliceAngle / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = player.team === 'yellow' ? '#000000' : '#ffffff'
      
      const fontSize = activePlayers.length > 50 ? 10 : activePlayers.length > 20 ? 12 : 16
      ctx.font = `bold ${fontSize}px sans-serif`
      
      const displayName = player.username.length > 15 ? player.username.substring(0, 15) + '...' : player.username
      ctx.fillText(displayName, radius - 15, 4)
      ctx.restore()
    })

    ctx.beginPath()
    ctx.arc(center, center, radius * 0.15, 0, 2 * Math.PI)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
  }, [activePlayers])

  // NUEVO EFECTO: ESCUCHAR SI EL ADMIN GIRÓ LA RULETA (Solo Espectadores)
  useEffect(() => {
    if (isSpectator && incomingSpin) {
      setIsSpinning(true)
      setWinner(null)
      setRotation(incomingSpin.rotation)

      setTimeout(() => {
        setIsSpinning(false)
        const winningPlayer = activePlayers.find(p => p.id === incomingSpin.winnerId)
        if (winningPlayer) setWinner(winningPlayer)
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#3B82F6', '#FACC15', '#EF4444'] })
      }, 5000)
    }
  }, [incomingSpin, isSpectator])

  // GIRO ORIGINAL: Solo lo puede hacer el Admin
  const spinRoulette = () => {
    if (isSpinning || activePlayers.length === 0 || isSpectator) return
    setIsSpinning(true)
    setWinner(null)

    const extraSpins = 360 * 5
    const randomDegree = Math.floor(Math.random() * 360)
    const newRotation = rotation + extraSpins + randomDegree

    const sliceAngle = 360 / activePlayers.length
    const normalizedRotation = newRotation % 360
    const winningIndex = Math.floor(((360 - normalizedRotation) % 360) / sliceAngle)
    const winningPlayer = activePlayers[winningIndex]

    setRotation(newRotation)

    // ¡EL ADMIN AVISA A TODOS LOS CELULARES POR INTERNET QUE LA RULETA SE MOVIÓ!
    if (broadcastSpin) {
      broadcastSpin(newRotation, winningPlayer.id)
    }

    setTimeout(() => {
      setIsSpinning(false)
      setWinner(winningPlayer)
      updateStatus(winningPlayer.id, 'winner')
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#3B82F6', '#FACC15', '#EF4444'] })
    }, 5000)
  }

  const getTeamColors = (team: string) => {
    switch (team) {
      case 'blue': return { bg: '#EFF6FF', border: '#3B82F6', text: '#2563EB', name: 'Sabiduría', icon: articuno }
      case 'yellow': return { bg: '#FEFCE8', border: '#FACC15', text: '#CA8A04', name: 'Instinto', icon: zapdos }
      case 'red': return { bg: '#FEF2F2', border: '#EF4444', text: '#DC2626', name: 'Valor', icon: moltres }
      default: return { bg: '#FFFFFF', border: '#000000', text: '#000000', name: '', icon: '' }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full max-w-md mx-auto">
      <div className="w-full bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative z-10">
        
        <div className="p-4 sm:p-5 flex justify-between items-center bg-white gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 ml-2">Ruleta</h2>
          
          {/* SI NO ES ESPECTADOR (ES ADMIN), VE BOTONES NORMALES */}
          {!isSpectator ? (
            <div className="flex gap-2">
              <Button onClick={onResetGame} disabled={isSpinning} className="bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-bold rounded-xl border-2 border-[#F59E0B] px-3 sm:px-4 h-10 flex items-center gap-1.5 text-xs sm:text-sm">
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /><span>Reintegrar todos</span>
              </Button>
              <Button onClick={onBack} disabled={isSpinning} className="bg-[#FB7185] hover:bg-[#F43F5E] text-black font-bold rounded-xl border-2 border-[#F43F5E] px-3 sm:px-4 h-10 flex items-center gap-1.5 text-xs sm:text-sm">
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /><span>Salir</span>
              </Button>
            </div>
          ) : (
            // SI ES ESPECTADOR, VE UN INDICADOR DE TRANSMISIÓN EN VIVO
            <div className="flex gap-2 mr-2">
              <span className="bg-red-50 text-red-600 border border-red-200 px-4 py-1.5 rounded-full font-black text-sm animate-pulse flex items-center gap-2 shadow-inner">
                <Radio className="w-4 h-4" /> En Vivo
              </span>
            </div>
          )}
        </div>

        <hr className="border-gray-200 w-full m-0" />

        <div className="p-6 flex flex-col items-center relative flex-1">
          <div className="relative z-20 mb-[-10px]">
            <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[24px] border-l-transparent border-r-transparent border-t-black drop-shadow-md"></div>
          </div>

          <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] mb-8">
            <canvas
              ref={canvasRef}
              width={800}
              height={800}
              className="w-full h-full rounded-full drop-shadow-xl"
              style={{ transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none' }}
            />
          </div>

          {/* EL ADMIN VE BOTON MORADO, EL ESPECTADOR VE UN TEXTO GRIS */}
          {!isSpectator ? (
            <Button onClick={spinRoulette} disabled={isSpinning || activePlayers.length === 0} className="w-full h-16 sm:h-20 bg-[#A855F7] hover:bg-[#9333EA] text-white rounded-2xl text-2xl sm:text-3xl font-black shadow-lg shadow-purple-500/30 tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95">
              {isSpinning ? 'GIRANDO...' : 'GIRAR RULETA'}
            </Button>
          ) : (
            <div className="w-full h-16 sm:h-20 bg-gray-50 border-2 border-dashed border-gray-200 text-gray-400 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-inner">
              {isSpinning ? 'GIRANDO...' : 'ESPERANDO AL ADMIN...'}
            </div>
          )}
        </div>
      </div>

      {winner && !isSpinning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setWinner(null)}>
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl relative border-4 transition-all" style={{ borderColor: getTeamColors(winner.team).border }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-6">
              <div className="p-5 rounded-full shadow-inner border-[3px]" style={{ backgroundColor: getTeamColors(winner.team).bg, borderColor: getTeamColors(winner.team).border }}>
                <div className="w-16 h-16 drop-shadow-sm" style={{ backgroundColor: getTeamColors(winner.team).border, WebkitMask: `url(${getTeamColors(winner.team).icon}) center/contain no-repeat`, mask: `url(${getTeamColors(winner.team).icon}) center/contain no-repeat` }} title={`Equipo ${getTeamColors(winner.team).name}`} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-600 mb-1 uppercase tracking-widest">¡Ganador!</h3>
            <h4 className="text-xl font-black mb-2 uppercase tracking-widest" style={{ color: getTeamColors(winner.team).text }}>¡Equipo {getTeamColors(winner.team).name}!</h4>
            <p className="text-4xl font-black text-gray-900 mb-8 break-words leading-tight">{winner.username}</p>
            <Button onClick={() => setWinner(null)} className="w-full py-6 rounded-xl font-bold text-lg bg-gray-900 text-white hover:bg-gray-800">Aceptar</Button>
          </div>
        </div>
      )}
    </div>
  )
}