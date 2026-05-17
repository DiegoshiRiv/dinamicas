import { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/app/components/ui/button'
import { RotateCcw, LogOut, Radio } from 'lucide-react'
import type { Participant, RecentWinner } from '@/hooks/useParticipants'
import confetti from 'canvas-confetti'

import moltres from '@/assets/moltres.png'
import zapdos from '@/assets/zapdos.png'
import articuno from '@/assets/articuno.png'

interface WinnerRouletteProps {
  onBack: () => void
  participants: Participant[]
  recentWinners: RecentWinner[]
  updateStatus: (id: string, status: string) => void
  onResetGame: () => void
  isSpectator?: boolean
  incomingSpin?: { rotation: number, winnerId: string, localReceivedAt: number } | null
  broadcastSpin?: (rotation: number, winnerId: string) => void
  penaltyMonths: number
  penaltyPercent: number
}

export function WinnerRoulette({ 
  onBack, participants, recentWinners, updateStatus, onResetGame, 
  isSpectator = false, incomingSpin, broadcastSpin,
  penaltyMonths, penaltyPercent
}: WinnerRouletteProps) {
  
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<Participant | null>(null)
  const [clientIp, setClientIp] = useState<string>('')
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activePlayers = participants.filter(p => p.status === 'active')

  useEffect(() => {
    fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => setClientIp(data.ip)).catch(() => {});
  }, [])

  const playersWithWeight = useMemo(() => {
    const now = new Date();
    return activePlayers.map(p => {
      let weight = 100;
      const recent = recentWinners.find(rw => rw.username === p.username);
      if (recent) {
        const wonAt = new Date(recent.won_at);
        const monthsDiff = (now.getTime() - wonAt.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        if (monthsDiff <= penaltyMonths) {
          weight = Math.max(1, 100 - penaltyPercent);
        }
      }
      return { ...p, weight };
    });
  }, [activePlayers, recentWinners, penaltyMonths, penaltyPercent]);

  const totalWeight = playersWithWeight.reduce((acc, p) => acc + p.weight, 0);

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width; const center = size / 2; const radius = center - 10
    ctx.clearRect(0, 0, size, size)

    if (playersWithWeight.length === 0) {
      ctx.beginPath(); ctx.arc(center, center, radius, 0, 2 * Math.PI); ctx.fillStyle = '#f3f4f6'; ctx.fill()
      ctx.lineWidth = 2; ctx.strokeStyle = '#e5e7eb'; ctx.stroke()
      ctx.fillStyle = '#9ca3af'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('Sin participantes', center, center)
      return
    }

    let currentAngle = -Math.PI / 2; 

    playersWithWeight.forEach((player) => {
      const sliceAngle = totalWeight > 0 ? (player.weight / totalWeight) * (2 * Math.PI) : 0;
      if (sliceAngle === 0) return;
      const endAngle = currentAngle + sliceAngle;

      ctx.beginPath(); ctx.moveTo(center, center); ctx.arc(center, center, radius, currentAngle, endAngle); ctx.closePath()
      ctx.fillStyle = player.team === 'blue' ? '#3B82F6' : player.team === 'yellow' ? '#FACC15' : '#EF4444'
      ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffffff'; ctx.stroke()

      const textAngle = currentAngle + sliceAngle / 2;
      ctx.save(); ctx.translate(center, center); ctx.rotate(textAngle)
      ctx.textAlign = 'right'; ctx.fillStyle = player.team === 'yellow' ? '#000000' : '#ffffff'
      const fontSize = playersWithWeight.length > 50 ? 10 : playersWithWeight.length > 20 ? 12 : 16
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.fillText(player.username.length > 15 ? player.username.substring(0, 15) + '...' : player.username, radius - 15, 4)
      ctx.restore()

      currentAngle = endAngle;
    })

    ctx.beginPath(); ctx.arc(center, center, radius * 0.15, 0, 2 * Math.PI); ctx.fillStyle = '#ffffff'; ctx.fill()
  }, [playersWithWeight, totalWeight])

  // Lógica del Espectador corregida (Ya no desaparece el cartel)
  useEffect(() => {
    if (isSpectator && incomingSpin) {
      const isOldSpin = Date.now() - incomingSpin.localReceivedAt > 2000;
      if (isOldSpin) { 
        setRotation(incomingSpin.rotation); 
        return; 
      }

      setIsSpinning(true); 
      setWinner(null); 
      setRotation(incomingSpin.rotation)
      
      setTimeout(() => {
        setIsSpinning(false)
        // Usamos la lista global "participants" para asegurar que encontramos al ganador, 
        // incluso si el Admin ya actualizó su estado en la DB a "winner".
        const winningPlayer = participants.find(p => p.id === incomingSpin.winnerId)
        if (winningPlayer) setWinner(winningPlayer)
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#3B82F6', '#FACC15', '#EF4444'] })
      }, 5000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingSpin, isSpectator]) // Quitamos playersWithWeight para que la sincronización DB no borre el modal

  const spinRoulette = () => {
    if (isSpinning || playersWithWeight.length === 0 || isSpectator) return
    setIsSpinning(true); setWinner(null)

    const newRotation = rotation + (360 * 5) + Math.floor(Math.random() * 360)
    setRotation(newRotation)

    const pointerAngleDeg = (360 - (newRotation % 360)) % 360;
    let currentDeg = 0;
    let winningPlayer = playersWithWeight[0];

    for (let p of playersWithWeight) {
       const sliceDeg = (p.weight / totalWeight) * 360;
       if (pointerAngleDeg >= currentDeg && pointerAngleDeg < currentDeg + sliceDeg) {
          winningPlayer = p;
          break;
       }
       currentDeg += sliceDeg;
    }

    if (broadcastSpin) broadcastSpin(newRotation, winningPlayer.id)

    setTimeout(() => {
      setIsSpinning(false); setWinner(winningPlayer); updateStatus(winningPlayer.id, 'winner')
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

  const isMe = winner && clientIp && winner.ip_address === clientIp;

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full max-w-md mx-auto relative">
      <div className="w-full bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative z-10">
        
        <div className="p-4 sm:p-5 flex justify-between items-center bg-white gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 ml-2">Ruleta</h2>
          {!isSpectator ? (
            <div className="flex gap-2">
              <Button onClick={onResetGame} disabled={isSpinning} className="bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-bold rounded-xl border-2 border-[#F59E0B] px-3 h-10 flex items-center gap-1.5 text-xs sm:text-sm"><RotateCcw className="w-4 h-4 shrink-0" /><span className="hidden sm:inline">Reintegrar</span></Button>
              <Button onClick={onBack} disabled={isSpinning} className="bg-[#FB7185] hover:bg-[#F43F5E] text-black font-bold rounded-xl border-2 border-[#F43F5E] px-3 h-10 flex items-center gap-1.5 text-xs sm:text-sm"><LogOut className="w-4 h-4 shrink-0" /><span className="hidden sm:inline">Salir</span></Button>
            </div>
          ) : (
            <div className="flex gap-2 mr-2">
              <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm animate-pulse flex items-center gap-1.5 shadow-inner"><Radio className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">En Vivo</span></span>
              <Button onClick={onBack} className="bg-white hover:bg-gray-50 text-gray-500 font-bold rounded-xl border-2 border-gray-200 px-3 h-10 flex items-center gap-1.5 text-xs sm:text-sm" title="Volver al registro"><LogOut className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">Cerrar</span></Button>
            </div>
          )}
        </div>

        <hr className="border-gray-200 w-full m-0" />

        <div className="p-6 flex flex-col items-center justify-center relative flex-1 w-full mt-4 sm:mt-6">
          
          <div className="relative z-20 -mb-2">
             <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[24px] border-l-transparent border-r-transparent border-t-gray-900 drop-shadow-md"></div>
          </div>

          <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square mb-8 mx-auto flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={800} 
              className="w-full h-full rounded-full bg-white shadow-[0_0_20px_rgba(0,0,0,0.1)] border-4 border-white" 
              style={{ transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none' }} 
            />
          </div>

          {!isSpectator && (
            <Button 
              onClick={spinRoulette} 
              disabled={isSpinning || playersWithWeight.length === 0} 
              className="w-[90%] sm:w-full h-16 sm:h-20 bg-gradient-to-tr from-[#A855F7] to-[#D946EF] hover:opacity-90 text-white rounded-[20px] text-xl sm:text-2xl font-black shadow-lg shadow-purple-500/40 tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 mx-auto"
            >
              {isSpinning ? 'GIRANDO...' : 'GIRAR RULETA'}
            </Button>
          )}
        </div>
      </div>

      {winner && !isSpinning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-300" onClick={() => setWinner(null)}>
          <div className={`bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl relative border-4 transition-all ${isMe ? 'animate-bounce' : ''}`} style={{ borderColor: getTeamColors(winner.team).border }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-6">
              <div className="p-5 rounded-full shadow-inner border-[3px]" style={{ backgroundColor: getTeamColors(winner.team).bg, borderColor: getTeamColors(winner.team).border }}>
                <div className="w-16 h-16 drop-shadow-sm" style={{ backgroundColor: getTeamColors(winner.team).border, WebkitMask: `url(${getTeamColors(winner.team).icon}) center/contain no-repeat`, mask: `url(${getTeamColors(winner.team).icon}) center/contain no-repeat` }} title={`Equipo ${getTeamColors(winner.team).name}`} />
              </div>
            </div>
            <h3 className={`text-xl font-black mb-1 uppercase tracking-widest ${isMe ? 'text-green-500 text-2xl drop-shadow-sm' : 'text-gray-600'}`}>{isMe ? '¡TÚ GANASTE!' : '¡Ganador!'}</h3>
            <h4 className="text-xl font-black mb-2 uppercase tracking-widest" style={{ color: getTeamColors(winner.team).text }}>¡Equipo {getTeamColors(winner.team).name}!</h4>
            <p className="text-4xl font-black text-gray-900 mb-8 break-words leading-tight">{winner.username}</p>
            {!isSpectator && <Button onClick={() => setWinner(null)} className="w-full py-6 rounded-xl font-bold text-lg bg-gray-900 text-white hover:bg-gray-800">Aceptar</Button>}
          </div>
        </div>
      )}
    </div>
  )
}