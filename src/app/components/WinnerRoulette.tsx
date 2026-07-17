import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/app/components/ui/button'
import { RotateCcw, RefreshCw } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog'
import { Input } from '@/app/components/ui/input'
import type { Participant, RecentWinner, IncomingSpin } from '@/hooks/useParticipants'
import confetti from 'canvas-confetti'
import { QRCodeCanvas } from 'qrcode.react'
import { buildRouletteRegistrationUrl, extractBaseIp, sanitizeRouletteCode } from '@/app/utils/rouletteCode'

import { normalizeUsername, isVenaderoBlacklisted } from '@/app/utils/UsuariosToxicosBlackList'
import { prefetchClientIp } from '@/app/hooks/useClientIp'
import { telemetry } from '@/app/utils/telemetry'

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
  const targets = ['hozz0501', 'tugfameam', 'TuGfaMeAm4xD ', 'yardrat', 'crackbandoo', 'alessandrasama', 'Cavalex92'];
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
  /** Consulta fresca a Supabase antes de sortear / al abrir */
  syncParticipantsFresh?: (reason: string) => Promise<Participant[]>
  realtimeReady?: boolean
  syncError?: string | null
  /** Solo Fuecoco / super: puede fijar quién gana (animación natural). */
  canForceWinner?: boolean
}

type WheelPlayer = Participant & { weight: number }

const LAST_WIN_TEAM_KEY = (code: string) => `dinamicas:lastWinTeam:${sanitizeRouletteCode(code)}`

/** Orden visual estable: Instinto → Valor → Sabiduría, omitiendo equipos agotados. */
function alternatePlayersByTeam<T extends Pick<Participant, 'team'>>(players: T[]): T[] {
  const teamOrder: Participant['team'][] = ['yellow', 'red', 'blue']
  const queues = new Map<Participant['team'], T[]>(
    teamOrder.map((team) => [team, players.filter((player) => player.team === team)]),
  )
  const arranged: T[] = []

  while (arranged.length < players.length) {
    let addedInCycle = false
    for (const team of teamOrder) {
      const next = queues.get(team)?.shift()
      if (next) {
        arranged.push(next)
        addedInCycle = true
      }
    }
    // Protección para datos futuros con un equipo fuera de los tres conocidos.
    if (!addedInCycle) break
  }

  if (arranged.length < players.length) {
    const arrangedSet = new Set(arranged)
    arranged.push(...players.filter((player) => !arrangedSet.has(player)))
  }

  return arranged
}

function readLastWinTeam(code: string): Participant['team'] | null {
  try {
    const raw = sessionStorage.getItem(LAST_WIN_TEAM_KEY(code))
    if (raw === 'blue' || raw === 'yellow' || raw === 'red') return raw
  } catch {
    /* ignore */
  }
  return null
}

function writeLastWinTeam(code: string, team: Participant['team']) {
  try {
    sessionStorage.setItem(LAST_WIN_TEAM_KEY(code), team)
  } catch {
    /* ignore */
  }
}

/** Baja mucho el peso del equipo que acaba de ganar, si hay gente de otros equipos. */
function applyTeamVariety<T extends { team: Participant['team']; secretWeight: number }>(
  players: T[],
  lastTeam: Participant['team'] | null,
): T[] {
  if (!lastTeam) return players
  const hasOtherTeam = players.some((p) => p.team !== lastTeam && p.secretWeight > 0)
  if (!hasOtherTeam) return players
  // ~6% del peso original → casi nunca repite equipo; si solo queda ese equipo, no se aplica.
  return players.map((p) =>
    p.team === lastTeam ? { ...p, secretWeight: p.secretWeight * 0.06 } : p,
  )
}


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
  syncParticipantsFresh,
  realtimeReady = false,
  syncError = null,
  canForceWinner = false,
}: WinnerRouletteProps) {
  
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [forceSyncStatus, setForceSyncStatus] = useState<string | null>(null)
  const [winner, setWinner] = useState<Participant | null>(null)
  const [clientIp, setClientIp] = useState<string>('')
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [confirmDeleteRouletteOpen, setConfirmDeleteRouletteOpen] = useState(false)
  const [createRouletteFormOpen, setCreateRouletteFormOpen] = useState(false)
  const [newRouletteName, setNewRouletteName] = useState('')
  const [createRouletteOpen, setCreateRouletteOpen] = useState(false)
  const [createdRouletteCode, setCreatedRouletteCode] = useState<string | null>(null)
  const [forcedWinnerId, setForcedWinnerId] = useState<string | null>(null)
  const [forcePickerOpen, setForcePickerOpen] = useState(false)
  const [forceSearch, setForceSearch] = useState('')
  
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

  const forcedWinner = useMemo(
    () => (forcedWinnerId ? activePlayers.find((p) => p.id === forcedWinnerId) ?? null : null),
    [forcedWinnerId, activePlayers],
  )

  useEffect(() => {
    setForcedWinnerId(null)
    setForcePickerOpen(false)
    setForceSearch('')
  }, [activeRouletteCode])

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

  const forceCandidates = useMemo(() => {
    const q = forceSearch.trim().toLowerCase()
    // Solo activos en la ruleta (así la animación cae en un segmento real).
    if (!q) return activePlayers.slice(0, 50)
    return activePlayers.filter((p) => p.username.toLowerCase().includes(q)).slice(0, 50)
  }, [activePlayers, forceSearch])

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
    return alternatePlayersByTeam(activePlayers.map((p) => ({ ...p, weight: 1 })))
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
          listLoading || isSyncing ? 'Cargando...' : 'Sin participantes',
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

      // Siempre mostrar nombres (antes se ocultaban con >80 y solo se veía el conteo).
      const n = playersForWheel.length
      const showPattern = n <= 36
      const fontSize = n > 120 ? 7 : n > 80 ? 8 : n > 50 ? 10 : n > 20 ? 12 : 16
      const maxChars = n > 120 ? 8 : n > 80 ? 10 : 15
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

        // Textura solo con pocos segmentos (en móviles con muchos nombres era muy lento).
        if (showPattern) {
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
        }

        ctx.beginPath()
        ctx.moveTo(center, center)
        ctx.arc(center, center, radius, currentAngle, endAngle)
        ctx.closePath()
        ctx.lineWidth = n > 80 ? 1 : 2
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'
        ctx.stroke()

        const textAngle = currentAngle + sliceAngle / 2
        ctx.save()
        ctx.translate(center, center)
        ctx.rotate(textAngle)
        ctx.textAlign = 'right'
        ctx.fillStyle = player.team === 'yellow' ? '#1f2937' : '#ffffff'
        ctx.shadowColor = 'rgba(0,0,0,0.35)'
        ctx.shadowBlur = n > 80 ? 2 : 4
        ctx.font = `bold ${fontSize}px sans-serif`
        const label =
          player.username.length > maxChars
            ? `${player.username.substring(0, maxChars)}…`
            : player.username
        ctx.fillText(label, radius - 14, 3)
        ctx.shadowBlur = 0
        ctx.restore()

        currentAngle = endAngle
      })

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

    const delay = isSpinning ? 0 : playersForWheel.length === 0 ? 0 : 120
    drawTimerRef.current = window.setTimeout(drawWheel, delay)

    return () => {
      if (drawTimerRef.current) window.clearTimeout(drawTimerRef.current)
    }
  }, [playersForWheel, totalWeight, isSpinning, wheelAssetsReady, listLoading, isSyncing])

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

    const runSpin = (list: Participant[]) => {
      const winningPlayer = resolveWinner()
      const wheelPlayers = alternatePlayersByTeam(
        list.length > 0
          ? list
          : winningPlayer
            ? [winningPlayer]
            : [],
      )

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
    }

    // Si la lista aún no cargó, sincroniza una vez y luego gira (evita ruleta incompleta).
    if (activePlayers.length === 0 && syncParticipantsFresh) {
      let cancelled = false
      void syncParticipantsFresh('spectator_spin_wait')
        .then((fresh) => {
          if (cancelled) return
          const actives = fresh.filter((p) => p.status === 'active')
          runSpin(actives.length > 0 ? actives : activePlayers)
        })
        .catch(() => {
          if (!cancelled) runSpin(activePlayers)
        })
      return () => {
        cancelled = true
      }
    }

    runSpin(activePlayers)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingSpin, isSpectator])

  useEffect(() => () => {
    if (spinTimerRef.current) window.clearTimeout(spinTimerRef.current)
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!syncParticipantsFresh) return
    setIsSyncing(true)
    const warm = async () => {
      try {
        let list = await syncParticipantsFresh('roulette_open')
        // Reintento si llegó vacío (red lenta / race al abrir).
        if (!cancelled && list.filter((p) => p.status === 'active').length === 0) {
          await new Promise((r) => window.setTimeout(r, 600))
          if (!cancelled) list = await syncParticipantsFresh('roulette_open_retry')
        }
      } catch {
        /* syncError queda en el hook */
      } finally {
        if (!cancelled) setIsSyncing(false)
      }
    }
    void warm()
    return () => {
      cancelled = true
    }
  }, [syncParticipantsFresh, activeRouletteCode])

  const fingerprint = (list: Participant[]) => {
    const ids = list.map((p) => p.id).filter((id) => !String(id).startsWith('local-')).sort()
    return { count: ids.length, key: ids.join('|') }
  }

  const runConsistencySync = async (reason: string) => {
    if (!syncParticipantsFresh) return participants
    const localFp = fingerprint(participants)
    const started = performance.now()
    let freshList = await syncParticipantsFresh(reason)
    let serverFp = fingerprint(freshList)
    let syncMs = Math.round(performance.now() - started)

    telemetry.consistency({
      localCount: localFp.count,
      serverCount: serverFp.count,
      difference: Math.abs(serverFp.count - localFp.count),
      syncMs,
      reason,
    })

    if (localFp.key !== serverFp.key || localFp.count !== serverFp.count) {
      const started2 = performance.now()
      freshList = await syncParticipantsFresh(`${reason}_reconcile`)
      serverFp = fingerprint(freshList)
      syncMs = Math.round(performance.now() - started2)
      telemetry.consistency({
        localCount: localFp.count,
        serverCount: serverFp.count,
        difference: Math.abs(serverFp.count - localFp.count),
        syncMs,
        reason: `${reason}_reconcile`,
      })
    }

    return freshList
  }

  const forceSyncParticipants = async () => {
    if (isSpinning || isSyncing || !syncParticipantsFresh) return
    const localBefore = fingerprint(participants).count
    setIsSyncing(true)
    setForceSyncStatus('Sincronizando participantes…')
    try {
      const started = performance.now()
      const fresh = await runConsistencySync('admin_force_sync')
      const server = fingerprint(fresh).count
      const ms = Math.round(performance.now() - started)
      setForceSyncStatus(
        `Servidor: ${server} · Local antes: ${localBefore} · Actualizado correctamente (${ms} ms)`,
      )
    } catch {
      setForceSyncStatus('No se pudo sincronizar. Revisa la conexión e intenta de nuevo.')
    } finally {
      setIsSyncing(false)
    }
  }

  const spinRoulette = async () => {
    if (isSpinning || isSpectator || isSyncing) return

    setIsSyncing(true)
    setForceSyncStatus(null)
    let freshList = participants
    try {
      freshList = await runConsistencySync('before_spin')
    } finally {
      setIsSyncing(false)
    }

    const freshActive = freshList.filter((p) => p.status === 'active')
    const freshEligible = freshActive.filter((p) => !cannotWin(p))
    const now = new Date()
    const weighted: WheelPlayer[] = freshEligible.map((p) => {
      let weight = 100
      const recent = recentWinnerByUsername.get(p.username)
      if (recent) {
        const wonAt = new Date(recent.won_at)
        const monthsDiff = (now.getTime() - wonAt.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
        if (monthsDiff <= penaltyMonths) {
          weight = Math.max(1, 100 - penaltyPercent)
        }
      }
      return { ...p, weight }
    })
    const wheelPlayers: WheelPlayer[] = alternatePlayersByTeam(
      freshActive.map((p) => ({ ...p, weight: 1 })),
    )

    if (weighted.length === 0) {
      const canForceFromWheel =
        canForceWinner &&
        Boolean(forcedWinnerId) &&
        freshActive.some((p) => p.id === forcedWinnerId)
      if (!canForceFromWheel) {
        console.warn('[dinamicas:roulette] spin aborted: no eligible players after sync', {
          total: freshList.length,
          active: freshActive.length,
          realtimeReady,
        })
        return
      }
    }

    setIsSpinning(true)
    setWinner(null)

    weighted.forEach((p) => {
      if (isNerfed(p.username)) trackIp(nerfedIpsRef.current, p.ip_address)
    })

    const secretPlayers = applyTeamVariety(
      weighted.map((p) => {
        let secretWeight = p.weight
        const isIpNerfed = ipIsTracked(nerfedIpsRef.current, p.ip_address)
        if (isNerfed(p.username) || isIpNerfed) {
          secretWeight = p.weight * 0.01
        }
        return { ...p, secretWeight }
      }),
      readLastWinTeam(activeRouletteCode),
    )

    const secretTotalWeight = secretPlayers.reduce((acc, p) => acc + p.secretWeight, 0)

    let winningPlayer: Participant = weighted[0] ?? freshActive[0]
    let usedForcedWinner = false

    if (canForceWinner && forcedWinnerId) {
      const forced = freshActive.find((p) => p.id === forcedWinnerId)
      if (forced) {
        winningPlayer = forced
        usedForcedWinner = true
      }
    }

    if (!usedForcedWinner && secretTotalWeight > 0) {
      const randomWeightPoint = Math.random() * secretTotalWeight
      let currentWeightSum = 0
      for (const p of secretPlayers) {
        currentWeightSum += p.secretWeight
        if (randomWeightPoint <= currentWeightSum) {
          winningPlayer = weighted.find((orig) => orig.id === p.id) || p
          break
        }
      }
    }

    if (!winningPlayer || (!usedForcedWinner && cannotWin(winningPlayer))) {
      setIsSpinning(false)
      return
    }

    setForcedWinnerId(null)
    setForcePickerOpen(false)
    setForceSearch('')

    writeLastWinTeam(activeRouletteCode, winningPlayer.team)

    const visualIndex = wheelPlayers.findIndex((p) => p.id === winningPlayer.id)
    const n = wheelPlayers.length || 1
    // Variación sutil dentro del segmento para que no siempre caiga en el centro exacto.
    const sliceDeg = 360 / n
    const jitter = (Math.random() - 0.5) * sliceDeg * 0.55
    let newRotation = rotation + 360 * (5 + Math.floor(Math.random() * 2))
    const sliceCenter = Math.max(0, visualIndex) * sliceDeg + sliceDeg / 2 + jitter
    const targetMod = (360 - sliceCenter + 360) % 360
    const currentMod = ((rotation % 360) + 360) % 360
    const delta = (targetMod - currentMod + 360) % 360
    newRotation += delta

    setRotation(newRotation)

    if (broadcastSpin) {
      broadcastSpin(newRotation, winningPlayer.id, winningPlayer.username, winningPlayer.team)
    }

    if (spinTimerRef.current) window.clearTimeout(spinTimerRef.current)
    spinTimerRef.current = window.setTimeout(() => {
      setIsSpinning(false)
      setWinner(winningPlayer)
      if (!String(winningPlayer.id).startsWith('local-')) {
        if (usedForcedWinner || !cannotWin(winningPlayer)) {
          void updateStatus(winningPlayer.id, 'winner')
        }
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
                <span className="block font-bold text-[#0d3b66]">
                  {listLoading || isSyncing
                    ? 'Actualizando lista…'
                    : `${activePlayers.length} en la ruleta`}
                </span>
              </p>
            </div>
            <div className="flex justify-center w-full">
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  onClick={() => void forceSyncParticipants()}
                  disabled={isSpinning || isSyncing || !syncParticipantsFresh}
                  className="bg-[#23c8b6] hover:bg-[#1fb7a7] text-white font-bold rounded-xl border border-[#1fb7a7] px-3 h-10 flex items-center gap-1.5 text-[10px] sm:text-xs shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'ACTUALIZANDO…' : 'ACTUALIZAR LISTA'}</span>
                </Button>
                <Button
                  onClick={() => setConfirmResetOpen(true)}
                  disabled={isSpinning}
                  variant="outline"
                  className="bg-white hover:bg-[#f7f9ff] text-[#5b6483] font-bold rounded-xl border border-[#dce3f6] px-3 h-10 flex items-center gap-1.5 text-[10px] sm:text-xs"
                  title="Devuelve a los ganadores a la ruleta (no actualiza la lista)"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>REINTEGRAR GANADORES</span>
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
            {forceSyncStatus && (
              <p className="text-center text-[11px] font-semibold text-[#5b6483] leading-snug px-1 max-w-sm">
                {forceSyncStatus}
              </p>
            )}
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
              <p className="mt-1 text-[11px] font-bold text-[#0d3b66]">
                {listLoading || isSyncing
                  ? 'Cargando nombres…'
                  : `${activePlayers.length} participante${activePlayers.length === 1 ? '' : 's'}`}
              </p>
              {syncParticipantsFresh && (
                <button
                  type="button"
                  onClick={() => void forceSyncParticipants()}
                  disabled={isSpinning || isSyncing}
                  className="mt-2 text-[11px] font-bold text-[#3d76e5] underline underline-offset-2 disabled:opacity-50"
                >
                  {isSyncing ? 'Sincronizando…' : 'Actualizar lista'}
                </button>
              )}
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
            <div className="w-[90%] sm:w-full mx-auto space-y-2">
              {canForceWinner && (
                <div className="rounded-2xl border border-[#dce3f6] bg-[#f8fafc] p-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => setForcePickerOpen((v) => !v)}
                    disabled={isSpinning || isSyncing}
                    className="w-full text-left text-[11px] font-bold text-[#5b6483] flex items-center justify-between"
                  >
                    <span>
                      {forcedWinner
                        ? `Resultado fijado: ${forcedWinner.username}`
                        : 'Elegir resultado (solo master)'}
                    </span>
                    <span className="text-[#3d76e5]">{forcePickerOpen ? 'Cerrar' : 'Abrir'}</span>
                  </button>
                  {forcedWinner && (
                    <button
                      type="button"
                      onClick={() => setForcedWinnerId(null)}
                      disabled={isSpinning}
                      className="text-[10px] font-semibold text-red-500 underline"
                    >
                      Quitar selección (sorteo libre)
                    </button>
                  )}
                  {forcePickerOpen && (
                    <div className="space-y-2">
                      <Input
                        value={forceSearch}
                        onChange={(e) => setForceSearch(e.target.value)}
                        placeholder="Buscar usuario en la ruleta…"
                        className="h-10 rounded-xl border-[#dce3f6] bg-white text-sm"
                        disabled={isSpinning}
                      />
                      <div className="max-h-40 overflow-y-auto rounded-xl border border-[#e8eefc] bg-white divide-y divide-[#eef2fb]">
                        {forceCandidates.length === 0 ? (
                          <p className="p-3 text-[11px] text-[#7f879f] font-semibold">
                            No hay coincidencias en la ruleta.
                          </p>
                        ) : (
                          forceCandidates.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setForcedWinnerId(p.id)
                                setForcePickerOpen(false)
                                setForceSearch('')
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-[#f3f6ff] ${
                                forcedWinnerId === p.id ? 'bg-[#e8f4fc] text-[#0d3b66]' : 'text-[#4f5674]'
                              }`}
                            >
                              {p.username}
                              <span className="ml-2 text-[10px] font-semibold text-[#94a3b8] uppercase">
                                {p.team === 'blue' ? 'Sabiduría' : p.team === 'yellow' ? 'Instinto' : 'Valor'}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                      <p className="text-[10px] text-[#94a3b8] font-medium leading-snug">
                        Al girar, la ruleta caerá en esa persona de forma natural. Los espectadores no ven esta opción.
                      </p>
                    </div>
                  )}
                </div>
              )}
              <Button 
                onClick={() => void spinRoulette()} 
                disabled={isSpinning || isSyncing || (playersWithWeight.length === 0 && !listLoading && !forcedWinner)} 
                className={`w-full h-14 sm:h-16 bg-[#0d3b66] hover:bg-[#0a2f52] text-white rounded-2xl text-lg sm:text-xl font-black tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 border-2 border-[#0a2f52] ${!isSpinning && !isSyncing && playersWithWeight.length > 0 ? 'roulette-btn-idle' : ''}`}
              >
                {isSpinning ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full register-active-spin" />
                    GIRANDO...
                  </span>
                ) : isSyncing || listLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full register-active-spin" />
                    ACTUALIZANDO LISTA...
                  </span>
                ) : (
                  '¡GIRAR RULETA!'
                )}
              </Button>
            </div>
          )}
          {(syncError || (!realtimeReady && !isSpectator)) && (
            <p className="text-center text-[11px] font-semibold text-[#5b6483] px-4 mt-2">
              {syncError
                ? `Sincronización: ${syncError}. Se conserva la última lista.`
                : 'Conectando canal en vivo…'}
            </p>
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
            <AlertDialogTitle className="text-[#1d2442] font-black">Reintegrar ganadores</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#5b6483] leading-relaxed text-center">
              <span className="block">
                Vuelve a meter en la ruleta a quienes ya ganaron.
              </span>
              <span className="block mt-1 font-bold text-[#0d3b66]">
                No actualiza la lista de registrados: usa «Actualizar lista» para eso.
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