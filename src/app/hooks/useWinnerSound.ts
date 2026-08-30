import { useCallback, useEffect, useRef, useState } from 'react'
import winnerSoundUrl from '@/assets/1-26. Obtained a Gym Badge!.mp3'

const STORAGE_KEY = 'dinamicas-winner-sound'

function readPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

/**
 * Sonido de victoria. Arranca apagado porque los navegadores móviles solo
 * permiten reproducir audio después de que la persona toque algo: ese toque es
 * justo el que activa el interruptor, y ahí se aprovecha para desbloquearlo.
 */
export function useWinnerSound() {
  const [enabled, setEnabled] = useState(readPreference)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(winnerSoundUrl)
      audio.preload = 'auto'
      audioRef.current = audio
    }
    return audioRef.current
  }, [])

  const toggle = useCallback(() => {
    const next = !enabled
    setEnabled(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
    } catch {
      /* modo privado: la preferencia solo dura la sesión */
    }

    if (!next) {
      audioRef.current?.pause()
      return
    }

    // Reproducir y frenar dentro del gesto deja el audio listo para sonar solo.
    const audio = getAudio()
    audio.currentTime = 0
    void audio
      .play()
      .then(() => {
        audio.pause()
        audio.currentTime = 0
      })
      .catch(() => {
        /* si el navegador lo bloquea, se intentará de nuevo al ganar */
      })
  }, [enabled, getAudio])

  const play = useCallback(() => {
    if (!enabled) return
    const audio = getAudio()
    audio.currentTime = 0
    void audio.play().catch(() => {
      /* sin permiso de reproducción: el premio se muestra igual */
    })
  }, [enabled, getAudio])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  return { enabled, toggle, play }
}
