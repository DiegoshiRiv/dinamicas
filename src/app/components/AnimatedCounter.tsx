import { useEffect, useState } from 'react'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 550,
  className = 'text-[#f97316] font-black',
}: AnimatedCounterProps) {
  const safeValue = Number.isFinite(value) ? value : 0
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (safeValue <= 0) {
      setDisplay(0)
      return
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      setDisplay(Math.round(safeValue))
      return
    }

    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(Math.round(safeValue * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [safeValue, duration])

  return <span className={className}>{display.toLocaleString('es-MX')}</span>
}
