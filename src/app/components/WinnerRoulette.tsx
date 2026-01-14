import { useState, useEffect, useRef } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { motion, animate } from 'motion/react'
import { Trophy, RotateCw, Check, X } from 'lucide-react'

type Team = 'yellow' | 'red' | 'blue'

interface Participant {
  id: string
  username: string
  team: Team
  status: 'active' | 'winner' | 'discarded'
}

interface WinnerRouletteProps {
  onBack: () => void
}

const teamColors: Record<Team, string> = {
  yellow: '#facc15',
  red: '#ef4444',
  blue: '#3b82f6',
}

const teamNames: Record<Team, string> = {
  yellow: 'Instinto',
  red: 'Valor',
  blue: 'Sabiduría',
}

export function WinnerRoulette({ onBack }: WinnerRouletteProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<Participant | null>(null)
  const [rotation, setRotation] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadParticipants()
  }, [])

  useEffect(() => {
    if (participants.length > 0) drawRoulette()
  }, [participants, rotation])

  const loadParticipants = () => {
    const data = JSON.parse(localStorage.getItem('participants') || '[]')
    setParticipants(
      data.filter((p: Participant) => p.status === 'active')
    )
  }

  const drawRoulette = () => {
    const canvas = canvasRef.current
    if (!canvas || participants.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 20

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const anglePerSegment = (2 * Math.PI) / participants.length

    participants.forEach((p, index) => {
      const start =
        index * anglePerSegment + (rotation * Math.PI) / 180
      const end = start + anglePerSegment

      // Segmento
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, start, end)
      ctx.closePath()
      ctx.fillStyle = teamColors[p.team] ?? '#999999'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Texto
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(start + anglePerSegment / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText(p.username, radius - 20, 5)
      ctx.restore()
    })

    // Centro
    ctx.beginPath()
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.stroke()

    // Indicador: triángulo invertido (punta hacia la ruleta)
ctx.beginPath()
ctx.moveTo(centerX - 14, centerY - radius - 18) // esquina izquierda arriba
ctx.lineTo(centerX + 14, centerY - radius - 18) // esquina derecha arriba
ctx.lineTo(centerX, centerY - radius + 6)       // punta hacia abajo (ruleta)
ctx.closePath()
ctx.fillStyle = '#000000'
ctx.fill()

  }

  const spinRoulette = () => {
    if (isSpinning || participants.length === 0) return

    setIsSpinning(true)
    setWinner(null)

    const totalRotation = 360 * 5 + Math.random() * 360

    animate(rotation, rotation + totalRotation, {
      duration: 5,
      ease: [0.32, 0.72, 0, 1],
      onUpdate: setRotation,
      onComplete: () => {
        const normalized = (rotation + totalRotation + 90) % 360
        const angle = 360 / participants.length
        const index =
          Math.floor((360 - normalized) / angle) %
          participants.length

        setWinner(participants[index])
        setIsSpinning(false)
      },
    })
  }

  const updateStatus = (status: 'winner' | 'discarded') => {
    if (!winner) return

    const data = JSON.parse(localStorage.getItem('participants') || '[]')
    localStorage.setItem(
      'participants',
      JSON.stringify(
        data.map((p: Participant) =>
          p.id === winner.id ? { ...p, status } : p
        )
      )
    )

    setWinner(null)
    loadParticipants()
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row justify-between">
        <CardTitle>Ruleta de Ganadores</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Volver
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setRotation(0)
              loadParticipants()
            }}
          >
            <RotateCw className="w-4 h-4 mr-2" />
            Reiniciar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="border rounded-lg shadow-lg"
          />
        </div>

        {winner && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center p-6 rounded-lg"
            style={{
              backgroundColor:
                (teamColors[winner.team] ?? '#999999') + '22',
            }}
          >
            <Trophy className="mx-auto h-12 w-12 mb-2" />
            <h3 className="text-2xl font-bold">
              {winner.username}
            </h3>
            <p className="text-sm">
              Equipo {teamNames[winner.team]}
            </p>

            <div className="flex justify-center gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => updateStatus('discarded')}
              >
                <X className="w-4 h-4 mr-2" />
                Descartar
              </Button>
              <Button onClick={() => updateStatus('winner')}>
                <Check className="w-4 h-4 mr-2" />
                Confirmar
              </Button>
            </div>
          </motion.div>
        )}

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={spinRoulette}
            disabled={isSpinning || !!winner}
          >
            {isSpinning ? 'Girando…' : 'Girar Ruleta'}
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500">
          Participantes activos: {participants.length}
        </p>
      </CardContent>
    </Card>
  )
}
