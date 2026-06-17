import { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/app/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog'
import { Input } from '@/app/components/ui/input'
import type { Participant, RecentWinner } from '@/hooks/useParticipants'
import confetti from 'canvas-confetti'
import { QRCodeCanvas } from 'qrcode.react'
import { buildRouletteRegistrationUrl, sanitizeRouletteCode } from '@/app/utils/rouletteCode'

import moltres from '@/assets/iconos/moltres.png'
import zapdos from '@/assets/iconos/zapdos.png'
import articuno from '@/assets/iconos/articuno.png'

// Normaliza texto reemplazando números/caracteres visualmente similares por letras base
function normalizeUsername(username: string): string {
  return username
    .toLowerCase()
    .trim()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b');
}

// Lista negra para el bloqueo total
function isBlacklisted(username: string): boolean {
  const normalized = normalizeUsername(username);
  return normalized.includes('venaderos');
}

// Lista de baja probabilidad (1%)
function isNerfed(username: string): boolean {
  const normalized = normalizeUsername(username);
  const targets = ['hozz0501', 'tugfameam', 'TuGfaMeAm4xD ','yardrat', 'crackbandoo', 'alessandrasama'];
  return targets.some(target => normalized.includes(normalizeUsername(target)));
}

interface WinnerRouletteProps {
  onBack: () => void
  participants: Participant[]
  recentWinners: RecentWinner[]
  updateStatus: (id: string, status: string) => void
  onResetGame: () => void
  isSpectator?: boolean
  embedded?: boolean
  incomingSpin?: { rotation: number, winnerId: string, localReceivedAt: number } | null
  broadcastSpin?: (rotation: number, winnerId: string) => void
  penaltyMonths: number
  penaltyPercent: number
  rouletteCodes?: string[]
  activeRouletteCode?: string
  onChangeRouletteCode?: (code: string) => void
  onCreateRouletteCode?: (code: string) => void
  onDeleteRouletteCode?: (code: string) => void
  registrationBaseUrl?: string
}

type WheelPlayer = Participant & { weight: number }

/** Ruleta con segmentos iguales (espectador): ángulo para que el puntero caiga en el ganador */
function rotationForEqualWheel(
  players: Participant[],
  winnerId: string,
  currentRotation: number
): number {
  const n = players.length
  if (n === 0) return currentRotation

  const index = players.findIndex((p) => p.id === winnerId)
  const idx = index >= 0 ? index : 0
  const sliceDeg = 360 / n
  const sliceCenter = idx * sliceDeg + sliceDeg / 2
  const targetMod = (360 - sliceCenter + 360) % 360
  const currentMod = ((currentRotation % 360) + 360) % 360
  const delta = (targetMod - currentMod + 360) % 360
  return currentRotation + 5 * 360 + delta
}

export function WinnerRoulette({ 
  onBack: _onBack, participants, recentWinners, updateStatus, onResetGame, 
  isSpectator = false, embedded = false, incomingSpin, broadcastSpin,
  penaltyMonths, penaltyPercent,
  rouletteCodes = [], activeRouletteCode = 'general', onChangeRouletteCode,
  onCreateRouletteCode, onDeleteRouletteCode, registrationBaseUrl = ''
}: WinnerRouletteProps) {
  
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<Participant | null>(null)
  const [clientIp, setClientIp] = useState<string>('')
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [confirmDeleteRouletteOpen, setConfirmDeleteRouletteOpen] = useState(false)
  const [createRouletteFormOpen, setCreateRouletteFormOpen] = useState(false)
  const [newRouletteName, setNewRouletteName] = useState('')
  const [createRouletteOpen, setCreateRouletteOpen] = useState(false)
  const [createdRouletteCode, setCreatedRouletteCode] = useState<string | null>(null)
  
  const qrCreateRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Referencias ocultas pre-cargadas con las IPs objetivo
  const blacklistedIpsRef = useRef<Set<string>>(new Set(['200.68.182.129'])); 
  const nerfedIpsRef = useRef<Set<string>>(new Set(['202.5.98.55', '201.162.167.42']));

  const activePlayers = participants.filter(p => p.status === 'active')

  useEffect(() => {
    fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => setClientIp(data.ip)).catch(() => {});
  }, [])

  const playersWithWeight = useMemo((): WheelPlayer[] => {
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

  /** Espectador: todos los segmentos del mismo tamaño */
  const playersForWheel = useMemo((): WheelPlayer[] => {
    if (!isSpectator) return playersWithWeight
    return activePlayers.map((p) => ({ ...p, weight: 1 }))
  }, [isSpectator, playersWithWeight, activePlayers])

  const totalWeight = playersForWheel.reduce((acc, p) => acc + p.weight, 0);

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width; const center = size / 2; const radius = center - 10
    ctx.clearRect(0, 0, size, size)

    if (playersForWheel.length === 0) {
      ctx.beginPath(); ctx.arc(center, center, radius, 0, 2 * Math.PI); ctx.fillStyle = '#f3f4f6'; ctx.fill()
      ctx.lineWidth = 2; ctx.strokeStyle = '#e5e7eb'; ctx.stroke()
      ctx.fillStyle = '#9ca3af'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('Sin participantes', center, center)
      return
    }

    let currentAngle = -Math.PI / 2; 

    playersForWheel.forEach((player) => {
      const sliceAngle = totalWeight > 0 ? (player.weight / totalWeight) * (2 * Math.PI) : 0;
      if (sliceAngle === 0) return;
      const endAngle = currentAngle + sliceAngle;

      ctx.beginPath(); ctx.moveTo(center, center); ctx.arc(center, center, radius, currentAngle, endAngle); ctx.closePath()
      ctx.fillStyle = player.team === 'blue' ? '#3B82F6' : player.team === 'yellow' ? '#FACC15' : '#EF4444'
      ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffffff'; ctx.stroke()

      const textAngle = currentAngle + sliceAngle / 2;
      ctx.save(); ctx.translate(center, center); ctx.rotate(textAngle)
      ctx.textAlign = 'right'; ctx.fillStyle = player.team === 'yellow' ? '#000000' : '#ffffff'
      const fontSize = playersForWheel.length > 50 ? 10 : playersForWheel.length > 20 ? 12 : 16
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.fillText(player.username.length > 15 ? player.username.substring(0, 15) + '...' : player.username, radius - 15, 4)
      ctx.restore()

      currentAngle = endAngle;
    })

    ctx.beginPath(); ctx.arc(center, center, radius * 0.15, 0, 2 * Math.PI); ctx.fillStyle = '#ffffff'; ctx.fill()
  }, [playersForWheel, totalWeight])

  useEffect(() => {
    if (!isSpectator || !incomingSpin) return

    const isOldSpin = Date.now() - incomingSpin.localReceivedAt > 2000;

    if (isOldSpin) {
      const finalRotation = rotationForEqualWheel(
        activePlayers,
        incomingSpin.winnerId,
        0
      )
      setRotation(finalRotation)
      const winningPlayer = participants.find(p => p.id === incomingSpin.winnerId)
      if (winningPlayer) setWinner(winningPlayer)
      return
    }

    setIsSpinning(true)
    setWinner(null)

    setRotation((prev) =>
      rotationForEqualWheel(activePlayers, incomingSpin.winnerId, prev)
    )

    setTimeout(() => {
      setIsSpinning(false)
      const winningPlayer = participants.find(p => p.id === incomingSpin.winnerId)
      if (winningPlayer) setWinner(winningPlayer)
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#3B82F6', '#FACC15', '#EF4444'] })
    }, 5000)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingSpin, isSpectator])

  const spinRoulette = () => {
    if (isSpinning || playersWithWeight.length === 0 || isSpectator) return
    setIsSpinning(true); setWinner(null)

    // 1. Identificar y guardar IPs en sus listas correspondientes
    playersWithWeight.forEach(p => {
      if (p.ip_address) {
        if (isBlacklisted(p.username)) blacklistedIpsRef.current.add(p.ip_address);
        if (isNerfed(p.username)) nerfedIpsRef.current.add(p.ip_address);
      }
    });

    // 2. Calcular pesos matemáticos ultra-secretos para la selección real
    const secretPlayers = playersWithWeight.map(p => {
      let secretWeight = p.weight;
      const isIpBlacklisted = p.ip_address && blacklistedIpsRef.current.has(p.ip_address);
      const isIpNerfed = p.ip_address && nerfedIpsRef.current.has(p.ip_address);

      if (isBlacklisted(p.username) || isIpBlacklisted) {
        // Shadow ban total (0%)
        secretWeight = 0;
      } else if (isNerfed(p.username) || isIpNerfed) {
        // Nerfeo silencioso (1%)
        secretWeight = p.weight * 0.01;
      }
      
      return { ...p, secretWeight };
    });

    const secretTotalWeight = secretPlayers.reduce((acc, p) => acc + p.secretWeight, 0);

    // 3. Elegir al ganador basándonos en los pesos ocultos
    let winningPlayer = playersWithWeight[0];
    if (secretTotalWeight > 0) {
      const randomWeightPoint = Math.random() * secretTotalWeight;
      let currentWeightSum = 0;
      for (const p of secretPlayers) {
        currentWeightSum += p.secretWeight;
        if (randomWeightPoint <= currentWeightSum) {
          winningPlayer = playersWithWeight.find(orig => orig.id === p.id) || p;
          break;
        }
      }
    } else {
      winningPlayer = playersWithWeight[0];
    }

    // 4. Forzar que la aguja visual apunte EXACTAMENTE al segmento
    const visualIndex = playersForWheel.findIndex(p => p.id === winningPlayer.id);
    const n = playersForWheel.length;
    
    let newRotation = rotation + (360 * 5); 

    if (isSpectator || true) { 
      const sliceDeg = 360 / n;
      const sliceCenter = visualIndex * sliceDeg + (sliceDeg / 2);
      const targetMod = (360 - sliceCenter + 360) % 360;
      const currentMod = ((rotation % 360) + 360) % 360;
      const delta = (targetMod - currentMod + 360) % 360;
      newRotation += delta;
    }

    setRotation(newRotation)

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

  const createdRouletteUrl = createdRouletteCode
    ? buildRouletteRegistrationUrl(
        registrationBaseUrl || (typeof window !== 'undefined' ? window.location.origin : ''),
        createdRouletteCode
      )
    : ''

  const createRouletteFromInput = () => {
    if (!onCreateRouletteCode || !newRouletteName.trim()) return
    const nextCode = sanitizeRouletteCode(newRouletteName)
    onCreateRouletteCode(nextCode)
    setCreatedRouletteCode(nextCode)
    setNewRouletteName('')
    setCreateRouletteFormOpen(false)
    setCreateRouletteOpen(true)
  }

  const handleDownloadCreatedQrPdf = async () => {
    const canvas = qrCreateRef.current?.querySelector('canvas')
    if (!canvas || !createdRouletteCode) return
    const { jsPDF } = await import('jspdf')
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const qrSize = 260
    const x = (pageWidth - qrSize) / 2
    let y = 72

    pdf.setFontSize(14)
    pdf.text(`QR de ruleta: ${createdRouletteCode}`, pageWidth / 2, y, { align: 'center' })
    y += 24
    pdf.addImage(imgData, 'PNG', x, y, qrSize, qrSize)
    y += qrSize + 24
    pdf.setFontSize(10)
    pdf.text(createdRouletteUrl, pageWidth / 2, y, { align: 'center', maxWidth: pageWidth - 48 })
    pdf.save(`qr-${createdRouletteCode}.pdf`)
  }

  return (
    <div className={`flex flex-col items-center justify-start w-full max-w-md mx-auto relative ${embedded ? 'min-h-full px-2 py-2' : 'min-h-[100dvh] px-4 py-6'}`}>
      <div className={`w-full bg-white overflow-hidden flex flex-col relative z-10 ${embedded ? 'rounded-[28px] shadow-xl' : 'rounded-[32px] shadow-2xl'}`}>
        
        {!isSpectator && (
          <div className="px-4 sm:px-5 pt-4 pb-3 flex flex-col items-center bg-white gap-2 border-b border-[#eef1f7]">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-black text-[#1d2442]">RULETA</h2>
              <p className="mt-1 text-[11px] sm:text-xs text-[#7b839f] font-semibold leading-relaxed">
                <span className="block">Los participantes se agregan a la ruleta</span>
                <span className="block">de forma automática al registrarse.</span>
              </p>
            </div>
            <div className="flex justify-center w-full">
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  onClick={() => setConfirmResetOpen(true)}
                  disabled={isSpinning}
                  className="bg-[#f3f6ff] hover:bg-[#e8eefc] text-[#2e3c62] font-bold rounded-xl border border-[#dce3f6] px-3 h-10 flex items-center gap-1.5 text-[10px] sm:text-xs"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>REINTEGRAR A TODOS</span>
                </Button>
                {onDeleteRouletteCode && activeRouletteCode !== 'general' && (
                  <Button
                    onClick={() => setConfirmDeleteRouletteOpen(true)}
                    disabled={isSpinning}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl px-3 h-10 text-[10px] sm:text-xs"
                  >
                    ELIMINAR RULETA
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={`p-5 sm:p-6 flex flex-col items-center justify-center relative flex-1 w-full ${isSpectator ? 'pt-2' : 'mt-2 sm:mt-3'}`}>
          {isSpectator && (
            <div className="w-full mb-3 text-center">
              <h2 className="text-xl sm:text-2xl font-black text-[#1d2442]">RULETA</h2>
              <p className="mt-1 text-[11px] sm:text-xs text-[#7b839f] font-semibold">
                Estás viendo la ruleta en tiempo real.
              </p>
            </div>
          )}

          {!isSpectator && rouletteCodes.length > 1 && onChangeRouletteCode && (
            <div className="w-full mb-4">
              <p className="text-center text-[11px] font-bold text-[#667091] mb-2">Ruleta activa</p>
              <div className="grid grid-cols-4 gap-2">
                {rouletteCodes.map((code, index) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onChangeRouletteCode(code)}
                    title={code}
                    className={`h-9 rounded-lg border text-sm font-black transition-colors ${
                      code === activeRouletteCode
                        ? 'bg-[#23c8b6] border-[#1fb7a7] text-white'
                        : 'bg-white border-[#d7ddea] text-[#4f5674] hover:bg-[#f7f9ff]'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isSpectator && onCreateRouletteCode && (
            <div className="w-full mb-3 flex justify-center">
              <Button
                onClick={() => setCreateRouletteFormOpen(true)}
                disabled={isSpinning}
                className="bg-[#23c8b6] hover:bg-[#1fb7a7] text-white font-bold rounded-xl border border-[#1fb7a7] px-4 h-10 text-[11px]"
              >
                CREAR OTRA RULETA
              </Button>
            </div>
          )}

          
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
              className="w-[90%] sm:w-full h-14 sm:h-16 bg-[#23c8b6] hover:bg-[#1fb7a7] text-white rounded-2xl text-lg sm:text-xl font-black shadow-md tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 mx-auto"
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

      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent className="rounded-2xl border border-[#dde3f2]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1d2442] font-black">Reintegrar a todos</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#5b6483] leading-relaxed text-center">
              <span className="block">
                Esta acción regresará a todos los usuarios activos a la ruleta.
              </span>
              <span className="block mt-1">
                Los ganadores recientes podrían volver a salir.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onResetGame()
                setConfirmResetOpen(false)
              }}
              className="rounded-lg bg-[#3d76e5] hover:bg-[#3467c8] text-white"
            >
              Reintegrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDeleteRouletteOpen} onOpenChange={setConfirmDeleteRouletteOpen}>
        <AlertDialogContent className="rounded-2xl border border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700 font-black">Eliminar ruleta actual</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#5b6483] leading-relaxed text-center">
              Se eliminará la ruleta <strong>{activeRouletteCode}</strong>, su QR y todos los datos asociados.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (onDeleteRouletteCode && activeRouletteCode !== 'general') {
                  onDeleteRouletteCode(activeRouletteCode)
                }
                setConfirmDeleteRouletteOpen(false)
              }}
            >
              Eliminar ruleta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={createRouletteFormOpen} onOpenChange={setCreateRouletteFormOpen}>
        <AlertDialogContent className="rounded-2xl border border-[#dde3f2] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1d2442] font-black">Crear nueva ruleta</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#5b6483] text-center">
              Escribe el nombre del QR para crear una ruleta exclusiva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nombre de QR"
              value={newRouletteName}
              onChange={(e) => setNewRouletteName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createRouletteFromInput()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg bg-[#23c8b6] hover:bg-[#1fb7a7] text-white"
              onClick={createRouletteFromInput}
            >
              Crear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={createRouletteOpen}
        onOpenChange={(open) => {
          setCreateRouletteOpen(open)
          if (!open) setCreatedRouletteCode(null)
        }}
      >
        <AlertDialogContent className="rounded-2xl border border-[#dde3f2] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1d2442] font-black">
              {createdRouletteCode ? `Ruleta creada: ${createdRouletteCode}` : 'Ruleta creada'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#5b6483] text-center">
              Ruleta creada con éxito, descarga o comparte el código QR.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            {createdRouletteCode && (
              <div className="space-y-3">
                <div ref={qrCreateRef} className="p-3 bg-white rounded-lg border border-[#e4e9f6] w-fit mx-auto">
                  <QRCodeCanvas value={createdRouletteUrl} size={220} level="H" includeMargin />
                </div>
                <Button
                  onClick={handleDownloadCreatedQrPdf}
                  className="w-full bg-[#23c8b6] hover:bg-[#1fb7a7] text-white font-bold"
                >
                  Descargar PDF
                </Button>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cerrar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}