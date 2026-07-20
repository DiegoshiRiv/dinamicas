/**
 * Huella suave del navegador/dispositivo.
 * No es identidad perfecta (móviles iguales pueden parecerse), pero
 * dificulta re-registros tras borrar storage o cambiar de pestaña.
 */

function fnv1a(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function canvasSignal(): string {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 120
    canvas.height = 40
    const ctx = canvas.getContext('2d')
    if (!ctx) return 'nocanvas'
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#0d3b66'
    ctx.fillRect(0, 0, 120, 40)
    ctx.fillStyle = '#f7d548'
    ctx.fillText('dinamicas-go', 4, 8)
    return fnv1a(canvas.toDataURL().slice(0, 1200))
  } catch {
    return 'canvas-blocked'
  }
}

export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'ssr'
  try {
    const nav = window.navigator
    const screenInfo = window.screen
    const parts = [
      nav.userAgent || '',
      nav.language || '',
      (nav.languages || []).join(',') ,
      nav.platform || '',
      String(nav.hardwareConcurrency || 0),
      String(nav.maxTouchPoints || 0),
      `${screenInfo?.width || 0}x${screenInfo?.height || 0}x${screenInfo?.colorDepth || 0}`,
      String(window.devicePixelRatio || 1),
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      canvasSignal(),
    ]
    return `fp_${fnv1a(parts.join('|'))}_${fnv1a(parts.slice().reverse().join('|'))}`
  } catch {
    return `fp_fallback_${Date.now().toString(36)}`
  }
}
