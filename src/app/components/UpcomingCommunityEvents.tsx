import { useCallback, useEffect, useRef, useState } from 'react'
import { parseISO } from 'date-fns'
import {
  getPresencialCarouselSlides,
  type PresencialCarouselSlide,
} from '@/app/data/communityUpcoming'
import sellodexImg from '@/assets/recursos/sellodex.png'

const AUTO_MS = 5000
const SWIPE_THRESHOLD = 40

export function UpcomingCommunityEvents({
  onSelectDay,
}: {
  onSelectDay: (day: Date) => void
}) {
  const slides = getPresencialCarouselSlides()
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const paused = useRef(false)

  const goTo = useCallback(
    (next: number) => {
      if (slides.length === 0) return
      setIndex(((next % slides.length) + slides.length) % slides.length)
    },
    [slides.length],
  )

  useEffect(() => {
    if (slides.length <= 1) return
    const id = window.setInterval(() => {
      if (!paused.current) setIndex((i) => (i + 1) % slides.length)
    }, AUTO_MS)
    return () => window.clearInterval(id)
  }, [slides.length])

  if (slides.length === 0) return null

  return (
    <div
      className="rounded-2xl border border-[#0d3b66]/10 bg-white p-4 shadow-sm space-y-3"
      onMouseEnter={() => {
        paused.current = true
      }}
      onMouseLeave={() => {
        paused.current = false
      }}
      onTouchStart={() => {
        paused.current = true
      }}
      onTouchEnd={() => {
        paused.current = false
      }}
    >
      <div>
        <h3 className="text-[13px] font-black text-[#0d3b66] uppercase tracking-wide">
          Próximos eventos de la comunidad
        </h3>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl touch-pan-y"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current
          touchStartX.current = null
          if (start == null || slides.length <= 1) return
          const delta = e.changedTouches[0].clientX - start
          if (delta < -SWIPE_THRESHOLD) goTo(index + 1)
          else if (delta > SWIPE_THRESHOLD) goTo(index - 1)
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide) => (
            <CarouselBanner
              key={slide.id}
              slide={slide}
              onOpen={() => onSelectDay(parseISO(`${slide.dayKey}T12:00:00`))}
            />
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 pt-0.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Ver ${slide.title}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-5 bg-[#2563eb]' : 'w-2 bg-[#0d3b66]/20 hover:bg-[#0d3b66]/35'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CarouselBanner({
  slide,
  onOpen,
}: {
  slide: PresencialCarouselSlide
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full shrink-0 text-left relative h-36 sm:h-40 overflow-hidden group"
    >
      <img
        src={slide.banner}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d3b66] via-[#0d3b66]/55 to-transparent" />
      {slide.selloDex && (
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#0d3b66] text-white shadow">
            <img src={sellodexImg} alt="" className="w-3.5 h-3.5 object-contain" />
            {slide.id === 'fest-global' ? 'SelloDex sáb. y dom.' : 'SelloDex'}
          </span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <p className="text-[14px] sm:text-[15px] font-black text-white leading-tight drop-shadow-[0_2px_6px_rgba(13,59,102,0.9)]">
          {slide.title}
        </p>
        <p className="text-[10px] font-bold text-[#bfdbfe] mt-0.5 drop-shadow-[0_1px_4px_rgba(13,59,102,0.85)]">
          {slide.dateLabel}
        </p>
        <p className="text-[9px] font-bold text-white/90 mt-1 uppercase tracking-wide drop-shadow-[0_1px_3px_rgba(13,59,102,0.8)]">
          Toca para ver información
        </p>
      </div>
    </button>
  )
}
