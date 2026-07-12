import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/app/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog'
import { Input } from '@/app/components/ui/input'
import type { Participant, RecentWinner, IncomingSpin } from '@/hooks/useParticipants'
import confetti from 'canvas-confetti'
import { QRCodeCanvas } from 'qrcode.react'
import { buildRouletteRegistrationUrl, extractBaseIp, sanitizeRouletteCode } from '@/app/utils/rouletteCode'

import { normalizeUsername, isVenaderoBlacklisted } from '@/app/utils/UsuariosToxicosBlackList'
import { prefetchClientIp } from '@/app/hooks/useClientIp'

import moltres from '@/assets/iconos/moltres.png'
import zapdos from '@/assets/iconos/zapdos.png'
import articuno from '@/assets/iconos/articuno.png'
import pokeBallIcon from '@/assets/iconos/Poké_Ball_icon.svg.png'

function trackIp(ipSet: Set<string>, ip?: string) {
  if (!ip) return
  ipSet.add(ip)
  const base = extractBaseIp(ip)
  if (base) ipSet.add(base)
}

function ipIsTracked(ipSet: Set<string>, ip?: string): boolean {
  if (!ip) return false
  if (ipSet.has(ip)) return true
  const base = extractBaseIp(ip)
  return Boolean(base && ipSet.has(base))
}

function isNerfed(username: string): boolean {
  const normalized = normalizeUsername(username);
  const targets = ['hozz0501', 'tugfameam', 'TuGfaMeAm4xD ','yardrat', 'crackbandoo', 'alessandrasama'];
  return targets.some(target => normalized.includes(normalizeUsername(target)));
}

const SPIN_DURATION_MS = 6000
const SPIN_EASING = 'cubic-bezier(0.12, 0.85, 0.15, 1)'

function shadeColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

function teamBaseColor(team: string): string {
  switch (team) {
    case 'blue': return '#549BE7'
    case 'yellow': return '#F7D548'
    default: return '#E74C3C'
  }
}

function drawPokeball(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, 2 * Math.PI)
  ctx.fillStyle = '#f8f8f8'
  ctx.fill()
  ctx.lineWidth = Math.max(1.5, r * 0.07)
  ctx.strokeStyle = '#2d2d2d'
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, r - ctx.lineWidth / 2, 0, Math.PI)
  ctx.lineTo(cx - r, cy)
  ctx.closePath()
  ctx.fillStyle = '#ee1515'
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(cx - r, cy)
  ctx.lineTo(cx + r, cy)
  ctx.lineWidth = Math.max(2, r * 0.13)
  ctx.strokeStyle = '#2d2d2d'
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.24, 0, 2 * Math.PI)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.lineWidth = Math.max(1.5, r * 0.06)
  ctx.strokeStyle = '#2d2d2d'
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.1, 0, 2 * Math.PI)
  ctx.fillStyle = '#2d2d2d'
  ctx.fill()
  ctx.restore()
}

function fireWinnerConfetti(team: string) {
  const colors =
    team === 'blue'
      ? ['#549BE7', '#93C5FD', '#ffffff', '#ee1515']
      : team === 'yellow'
        ? ['#F7D548', '#FDE047', '#ffffff', '#ee1515']
        : ['#E74C3C', '#FCA5A5', '#ffffff', '#F7D548']

  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.55 },
    colors,
    startVelocity: 42,
    gravity: 0.9,
  })

  const end = Date.now() + 2800
  const burst = () => {
    confetti({ particleCount: 4, angle: 60, spread: 65, origin: { x: 0, y: 0.65 }, colors })
    confetti({ particleCount: 4, angle: 120, spread: 65, origin: { x: 1, y: 0.65 }, colors })
    if (Date.now() < end) requestAnimationFrame(burst)
  }
  burst()

  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 360,
      origin: { y: 0.45, x: 0.5 },
      colors,
      startVelocity: 28,
      ticks: 80,
      scalar: 1.1,
    })
  }, 400)
}

interface WinnerRouletteProps {
  onBack: () => void
  participants: Participant[]
  recentWinners: RecentWinner[]
  updateStatus: (id: string, status: string) => void
  onResetGame: () => void
  isSpectator?: boolean
  embedded?: boolean
  incomingSpin?: IncomingSpin | null
  broadcastSpin?: (rotation: number, winnerId: string, winnerUsername?: string, winnerTeam?: Participant['team']) => void
  penaltyMonths: number
  penaltyPercent: number
  rouletteCodes?: string[]
  activeRouletteCode?: string
  onChangeRouletteCode?: (code: string) => void
  onCreateRouletteCode?: (code: string) => void
  onDeleteRouletteCode?: (code: string) => void
  registrationBaseUrl?: string
  /** true mientras se descarga la lista (espectadores: evita "Sin participantes" falso) */
  listLoading?: boolean
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
  onCreateRouletteCode, onDeleteRouletteCode, registrationBaseUrl = '',
  listLoading = false,
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
  const pokeballImgRef = useRef<HTMLImageElement | null>(null)
  const spinTimerRef = useRef<number | null>(null)
  const drawTimerRef = useRef<number | null>(null)
  const [wheelAssetsReady, setWheelAssetsReady] = useState(false)
  
  const nerfedIpsRef = useRef<Set<string>>(new Set(['202.5.98.55', '201.162.167.42']))

  const activePlayers = useMemo(
    () => participants.filter((p) => p.status === 'active'),
    [participants],
  )

  const recentWinnerByUsername = useMemo(() => {
    const map = new Map<string, RecentWinner>()
    for (const rw of recentWinners) map.set(rw.username, rw)
    return map
  }, [recentWinners])

  const venaderoIps = useMemo(() => {
    const ips = new Set<string>()
    for (const p of activePlayers) {
      if (isVenaderoBlacklisted(p.username)) trackIp(ips, p.ip_address)
    }
    return ips
  }, [activePlayers])

  /** Sorteo real: venaderos y sus IPs nunca entran al pool */
  const eligiblePlayers = useMemo(
    () =>
      activePlayers.filter(
        (p) => !isVenaderoBlacklisted(p.username) && !ipIsTracked(venaderoIps, p.ip_address),
      ),
    [activePlayers, venaderoIps],
  )

  useEffect(() => {
    eligiblePlayers.forEach((p) => {
      if (isNerfed(p.username)) trackIp(nerfedIpsRef.current, p.ip_address)
    })
  }, [eligiblePlayers])

  useEffect(() => {
    let cancelled = false
    void prefetchClientIp()
      .then((ip) => {
        if (!cancelled) setClientIp(ip)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const img = new Image()
    img.src = pokeBallIcon
    img.onload = () => {
      pokeballImgRef.current = img
      setWheelAssetsReady(true)
    }
  }, [])

  const cannotWin = useCallback(
    (p: Participant) =>
      isVenaderoBlacklisted(p.username) || ipIsTracked(venaderoIps, p.ip_address),
    [venaderoIps],
  )

  const playersWithWeight = useMemo((): WheelPlayer[] => {
    const now = new Date();
    return eligiblePlayers.map(p => {
      let weight = 100;
      const recent = recentWinnerByUsername.get(p.username);
      if (recent) {
        const wonAt = new Date(recent.won_at);
        const monthsDiff = (now.getTime() - wonAt.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        if (monthsDiff <= penaltyMonths) {
          weight = Math.max(1, 100 - penaltyPercent);
        }
      }
      return { ...p, weight };
    });
  }, [eligiblePlayers, recentWinnerByUsername, penaltyMonths, penaltyPercent]);

  /** Ruleta visible: todos los activos (incl. venaderos) para que se vean en espectadores */
  const playersForWheel = useMemo((): WheelPlayer[] => {
    return activePlayers.map((p) => ({ ...p, weight: 1 }))
  }, [activePlayers])

  const totalWeight = useMemo(
    () => playersForWheel.reduce((acc, p) => acc + p.weight, 0),
    [playersForWheel],
  )

  useEffect(() => {
    if (drawTimerRef.current) window.clearTimeout(drawTimerRef.current)

    const drawWheel = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const size = canvas.width
      const center = size / 2
      const radius = center - 42
      ctx.clearRect(0, 0, size, size)

      if (playersForWheel.length === 0) {
        ctx.beginPath(); ctx.arc(center, center, radius, 0, 2 * Math.PI); ctx.fillStyle = '#f3f6ff'; ctx.fill()
        ctx.lineWidth = 2; ctx.strokeStyle = '#dce3f6'; ctx.stroke()
        const pokeImg = pokeballImgRef.current
        if (pokeImg) {
          const s = radius * 0.35
          ctx.drawImage(pokeImg, center - s, center - s, s * 2, s * 2)
        } else {
          drawPokeball(ctx, center, center, radius * 0.18)
        }
        ctx.fillStyle = '#5b6483'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(
          listLoading ? 'Cargando...' : 'Sin participantes',
          center,
          center + radius * 0.45,
        )
        return
      }

      // Marco exterior
      ctx.beginPath()
      ctx.arc(center, center, radius + 30, 0, 2 * Math.PI)
      const frameGrad = ctx.createLinearGradient(center - radius, center - radius, center + radius, center + radius)
      frameGrad.addColorStop(0, '#0d3b66')
      frameGrad.addColorStop(0.4, '#1a4f7a')
      frameGrad.addColorStop(0.7, '#0d3b66')
      frameGrad.addColorStop(1, '#0a2f52')
      ctx.lineWidth = 22
      ctx.strokeStyle = frameGrad
      ctx.stroke()

      // Anillo interior claro
      ctx.beginPath()
      ctx.arc(center, center, radius + 16, 0, 2 * Math.PI)
      const innerRingGrad = ctx.createLinearGradient(0, 0, size, size)
      innerRingGrad.addColorStop(0, '#e8f4fc')
      innerRingGrad.addColorStop(0.5, '#dce3f6')
      innerRingGrad.addColorStop(1, '#e8f4fc')
      ctx.lineWidth = 6
      ctx.strokeStyle = innerRingGrad
      ctx.stroke()

      // Remaches en el borde
      const rivetCount = 24
      for (let i = 0; i < rivetCount; i++) {
        const angle = (i / rivetCount) * 2 * Math.PI
        const rx = center + (radius + 8) * Math.cos(angle)
        const ry = center + (radius + 8) * Math.sin(angle)
        ctx.beginPath()
        ctx.arc(rx, ry, 2.5, 0, 2 * Math.PI)
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#3d76e5'
        ctx.fill()
        ctx.strokeStyle = '#0d3b66'
        ctx.lineWidth = 0.8
        ctx.stroke()
      }

      // Borde interior blanco
      ctx.beginPath()
      ctx.arc(center, center, radius + 2, 0, 2 * Math.PI)
      ctx.lineWidth = 3
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.stroke()

      const showLabels = playersForWheel.length <= 80
      let currentAngle = -Math.PI / 2

      playersForWheel.forEach((player, idx) => {
        const sliceAngle = totalWeight > 0 ? (player.weight / totalWeight) * (2 * Math.PI) : 0
        if (sliceAngle === 0) return
        const endAngle = currentAngle + sliceAngle
        const base = teamBaseColor(player.team)
        const altShade = idx % 2 === 0 ? 0 : -18

        ctx.beginPath()
        ctx.moveTo(center, center)
        ctx.arc(center, center, radius, currentAngle, endAngle)
        ctx.closePath()

        const midAngle = currentAngle + sliceAngle / 2
        const gx = center + Math.cos(midAngle) * radius * 0.35
        const gy = center + Math.sin(midAngle) * radius * 0.35
        const sliceGrad = ctx.createRadialGradient(gx, gy, 0, center, center, radius)
        sliceGrad.addColorStop(0, shadeColor(base, 35 + altShade))
        sliceGrad.addColorStop(0.65, shadeColor(base, altShade))
        sliceGrad.addColorStop(1, shadeColor(base, -35 + altShade))
        ctx.fillStyle = sliceGrad
        ctx.fill()

        // Textura sutil tipo rombos en el segmento
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(center, center)
        ctx.arc(center, center, radius, currentAngle, endAngle)
        ctx.closePath()
        ctx.clip()
        const patternStep = 14
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'
        ctx.lineWidth = 1
        for (let px = center - radius; px < center + radius; px += patternStep) {
          ctx.beginPath()
          ctx.moveTo(px, center - radius)
          ctx.lineTo(px + radius, center + radius)
          ctx.stroke()
        }
        ctx.restore()

        ctx.beginPath()
        ctx.moveTo(center, center)
        ctx.arc(center, center, radius, currentAngle, endAngle)
        ctx.closePath()
        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'
        ctx.stroke()

        if (showLabels || isVenaderoBlacklisted(player.username)) {
          const textAngle = currentAngle + sliceAngle / 2
          ctx.save()
          ctx.translate(center, center)
          ctx.rotate(textAngle)
          ctx.textAlign = 'right'
          ctx.fillStyle = player.team === 'yellow' ? '#1f2937' : '#ffffff'
          ctx.shadowColor = 'rgba(0,0,0,0.35)'
          ctx.shadowBlur = 4
          const fontSize = playersForWheel.length > 50 ? 10 : playersForWheel.length > 20 ? 12 : 16
          ctx.font = `bold ${fontSize}px sans-serif`
          const label = player.username.length > 15 ? `${player.username.substring(0, 15)}...` : player.username
          ctx.fillText(label, radius - 18, 4)
          ctx.shadowBlur = 0
          ctx.restore()
        }

        currentAngle = endAngle
      })

      if (!showLabels) {
        ctx.fillStyle = '#1f2937'
        ctx.font = 'bold 28px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(String(playersForWheel.length), center, center - 8)
        ctx.font = 'bold 14px sans-serif'
        ctx.fillStyle = '#6b7280'
        ctx.fillText('participantes', center, center + 18)
      }

      // Centro: Poké Ball
      const hubSize = radius * 0.22
      const pokeImg = pokeballImgRef.current
      if (pokeImg) {
        ctx.drawImage(pokeImg, center - hubSize, center - hubSize, hubSize * 2, hubSize * 2)
      } else {
        drawPokeball(ctx, center, center, hubSize)
      }

      // Aro alrededor del hub
      ctx.beginPath()
      ctx.arc(center, center, hubSize + 6, 0, 2 * Math.PI)
      ctx.lineWidth = 4
      ctx.strokeStyle = '#0d3b66'
      ctx.stroke()
    }

    const delay = isSpinning ? 0 : 300
    drawTimerRef.current = window.setTimeout(drawWheel, delay)

    return () => {
      if (drawTimerRef.current) window.clearTimeout(drawTimerRef.current)
    }
  }, [playersForWheel, totalWeight, isSpinning, wheelAssetsReady, listLoading])

  useEffect(() => {
    if (!isSpectator || !incomingSpin) return

    const resolveWinner = (): Participant | null => {
      const fromList = participants.find((p) => p.id === incomingSpin.winnerId)
      if (fromList && !cannotWin(fromList)) return fromList
      if (incomingSpin.winnerUsername && incomingSpin.winnerTeam) {
        if (isVenaderoBlacklisted(incomingSpin.winnerUsername)) return null
        return {
          id: incomingSpin.winnerId,
          username: incomingSpin.winnerUsername,
          team: incomingSpin.winnerTeam,
          status: 'active',
        }
      }
      return null
    }

    const winningPlayer = resolveWinner()
    // Si la lista aún no llegó, giramos con el ganador sintético para no perder el spin.
    const wheelPlayers =
      activePlayers.length > 0
        ? activePlayers
        : winningPlayer
          ? [winningPlayer]
          : []

    const isOldSpin = Date.now() - incomingSpin.localReceivedAt > 2000

    if (isOldSpin) {
      const finalRotation = rotationForEqualWheel(
        wheelPlayers,
        incomingSpin.winnerId,
        0,
      )
      setRotation(finalRotation)
      if (winningPlayer) setWinner(winningPlayer)
      return
    }

    setIsSpinning(true)
    setWinner(null)

    setRotation((prev) =>
      rotationForEqualWheel(wheelPlayers, incomingSpin.winnerId, prev),
    )

    if (spinTimerRef.current) window.clearTimeout(spinTimerRef.current)
    spinTimerRef.current = window.setTimeout(() => {
      setIsSpinning(false)
      if (winningPlayer) {
        setWinner(winningPlayer)
        fireWinnerConfetti(winningPlayer.team)
      }
    }, SPIN_DURATION_MS)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingSpin, isSpectator])

  useEffect(() => () => {
    if (spinTimerRef.current) window.clearTimeout(spinTimerRef.current)
  }, [])

  const spinRoulette = () => {
    if (isSpinning || playersWithWeight.length === 0 || isSpectator) return
    setIsSpinning(true); setWinner(null)

    // 1. Rastrear IPs solo para usuarios nerfeados (venaderos: 0% solo por nombre)
    playersWithWeight.forEach(p => {
      if (isNerfed(p.username)) trackIp(nerfedIpsRef.current, p.ip_address)
    });

    // 2. Pesos ocultos (pool ya excluye venaderos)
    const secretPlayers = playersWithWeight.map(p => {
      let secretWeight = p.weight;
      const isIpNerfed = ipIsTracked(nerfedIpsRef.current, p.ip_address)

      if (isNerfed(p.username) || isIpNerfed) {
        secretWeight = p.weight * 0.01;
      }
      
      return { ...p, secretWeight };
    });

    const secretTotalWeight = secretPlayers.reduce((acc, p) => acc + p.secretWeight, 0);

    // 3. Elegir ganador (solo elegibles; venaderos nunca)
    let winningPlayer = playersWithWeight[0]
    if (secretTotalWeight > 0) {
      const randomWeightPoint = Math.random() * secretTotalWeight
      let currentWeightSum = 0
      for (const p of secretPlayers) {
        currentWeightSum += p.secretWeight
        if (randomWeightPoint <= currentWeightSum) {
          winningPlayer = playersWithWeight.find((orig) => orig.id === p.id) || p
          break
        }
      }
    }

    if (!winningPlayer || cannotWin(winningPlayer)) {
      setIsSpinning(false)
      return
    }

    // 4. Aguja visual sobre la ruleta completa (incluye venaderos visibles)
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

    if (broadcastSpin) {
      broadcastSpin(newRotation, winningPlayer.id, winningPlayer.username, winningPlayer.team)
    }

    if (spinTimerRef.current) window.clearTimeout(spinTimerRef.current)
    spinTimerRef.current = window.setTimeout(() => {
      setIsSpinning(false)
      setWinner(winningPlayer)
      if (!cannotWin(winningPlayer)) {
        updateStatus(winningPlayer.id, 'winner')
      }
      fireWinnerConfetti(winningPlayer.team)
    }, SPIN_DURATION_MS)
  }

  const getTeamColors = (team: string) => {
    switch (team) {
      case 'blue': return { bg: '#EFF6FF', border: '#549BE7', text: '#2563EB', name: 'Sabiduría', icon: articuno }
      case 'yellow': return { bg: '#FEFCE8', border: '#F7D548', text: '#CA8A04', name: 'Instinto', icon: zapdos }
      case 'red': return { bg: '#FEF2F2', border: '#E74C3C', text: '#DC2626', name: 'Valor', icon: moltres }
      default: return { bg: '#FFFFFF', border: '#0d3b66', text: '#0d3b66', name: '', icon: pokeBallIcon }
    }
  }

  const isMe =
    winner &&
    clientIp &&
    !isVenaderoBlacklisted(winner.username) &&
    extractBaseIp(winner.ip_address) === clientIp

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
          <div className="px-4 sm:px-5 pt-4 pb-3 flex flex-col items-center bg-gradient-to-b from-[#e8f4fc] to-white gap-2 border-b border-[#dce3f6]">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-black text-[#0d3b66]">
                RULETA POKÉMON
              </h2>
              <p className="mt-1 text-[11px] sm:text-xs text-[#5b6483] font-semibold leading-relaxed">
                <span className="block">¡Gira la ruleta y descubre al afortunado!</span>
                <span className="block">Los participantes entran al registrarse.</span>
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
              <h2 className="text-xl sm:text-2xl font-black text-[#0d3b66]">
                RULETA POKÉMON
              </h2>
              <p className="mt-1 text-[11px] sm:text-xs text-[#5b6483] font-semibold">
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
                className="bg-[#0d3b66] hover:bg-[#0a2f52] text-white font-bold rounded-xl border border-[#0a2f52] px-4 h-10 text-[11px]"
              >
                CREAR OTRA RULETA
              </Button>
            </div>
          )}


          <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square mb-8 mx-auto">
            <div
              className={`relative w-full h-full rounded-full overflow-hidden ${isSpinning ? 'roulette-glow-spin' : 'shadow-[0_10px_40px_rgba(13,59,102,0.18)]'}`}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={800}
                className="w-full h-full rounded-full"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? `transform ${SPIN_DURATION_MS}ms ${SPIN_EASING}` : 'none',
                }}
              />
              {isSpinning && (
                <div className="absolute inset-0 rounded-full pointer-events-none z-[1] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_72%)]" />
              )}
            </div>

            <div
              className={`absolute top-[-2px] left-1/2 -translate-x-1/2 z-30 ${isSpinning ? 'roulette-pointer-spin' : 'roulette-pointer-idle'}`}
            >
              <svg width="40" height="36" viewBox="0 0 40 36" fill="none" aria-hidden>
                <path
                  d="M20 32 L5 5 Q20 10 35 5 Z"
                  fill="#ffffff"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 31 L7 7 Q20 11 33 7 Z"
                  fill="#FACC15"
                  stroke="#0d3b66"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {!isSpectator && (
            <Button 
              onClick={spinRoulette} 
              disabled={isSpinning || playersWithWeight.length === 0} 
              className={`w-[90%] sm:w-full h-14 sm:h-16 bg-[#0d3b66] hover:bg-[#0a2f52] text-white rounded-2xl text-lg sm:text-xl font-black tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 mx-auto border-2 border-[#0a2f52] ${!isSpinning && playersWithWeight.length > 0 ? 'roulette-btn-idle' : ''}`}
            >
              {isSpinning ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full register-active-spin" />
                  GIRANDO...
                </span>
              ) : (
                '¡GIRAR RULETA!'
              )}
            </Button>
          )}
        </div>
      </div>

      {winner && !isSpinning && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 winner-overlay-enter"
          onClick={() => setWinner(null)}
        >
          <div
            className={`bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl relative border-2 border-[#dce3f6] winner-card-enter overflow-hidden ${isMe ? 'ring-4 ring-green-400/50 ring-offset-2' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute inset-0 winner-rays pointer-events-none opacity-30"
              style={{
                background: `conic-gradient(from 0deg, transparent, ${getTeamColors(winner.team).border}33, transparent, ${getTeamColors(winner.team).border}22, transparent)`,
              }}
            />

            {['⚡', '✦', '🔥'].map((star, i) => (
              <span
                key={i}
                className="absolute text-lg winner-sparkle pointer-events-none"
                style={{
                  top: `${18 + i * 22}%`,
                  left: i === 0 ? '12%' : i === 1 ? '82%' : '50%',
                  animationDelay: `${i * 0.4}s`,
                  color: getTeamColors(winner.team).border,
                }}
              >
                {star}
              </span>
            ))}

            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div
                  className="p-5 rounded-full shadow-lg border-[3px] winner-icon-bounce"
                  style={{
                    backgroundColor: getTeamColors(winner.team).bg,
                    borderColor: getTeamColors(winner.team).border,
                    boxShadow: `0 0 30px ${getTeamColors(winner.team).border}55`,
                  }}
                >
                  <div
                    className="w-16 h-16 drop-shadow-md"
                    style={{
                      backgroundColor: getTeamColors(winner.team).border,
                      WebkitMask: `url(${getTeamColors(winner.team).icon}) center/contain no-repeat`,
                      mask: `url(${getTeamColors(winner.team).icon}) center/contain no-repeat`,
                    }}
                    title={`Equipo ${getTeamColors(winner.team).name}`}
                  />
                </div>
              </div>
              <h3
                className={`text-xl font-black mb-4 uppercase tracking-widest ${isMe ? 'text-green-500 text-2xl' : 'text-[#0d3b66]'}`}
                style={isMe ? { textShadow: '0 0 20px rgba(34,197,94,0.4)' } : undefined}
              >
                {isMe ? '¡TÚ GANASTE!' : '¡Ganador!'}
              </h3>
              <p className="text-4xl font-black mb-8 break-words leading-tight text-[#0d3b66] winner-name-shine">
                {winner.username}
              </p>
              {!isSpectator && (
                <Button
                  onClick={() => setWinner(null)}
                  className="w-full py-6 rounded-xl font-bold text-lg bg-[#0d3b66] text-white hover:bg-[#0a2f52] transition-transform active:scale-95"
                >
                  Aceptar
                </Button>
              )}
            </div>
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