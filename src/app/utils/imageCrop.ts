/** Utilidades de recorte tipo banner (cover + pan/zoom sin huecos). */

export type CropTransform = {
  /** Escala absoluta: tamaño renderizado / tamaño natural */
  scale: number
  /** Posición izquierda de la imagen respecto al marco */
  x: number
  /** Posición superior de la imagen respecto al marco */
  y: number
}

export type CropFrameSize = {
  width: number
  height: number
}

/** Proporción de la portada en la app (~max-w-md × clamp altura). */
export const PORTADA_ASPECT_RATIO = 448 / 240

export const PORTADA_EXPORT_WIDTH = 1600
export const PORTADA_EXPORT_HEIGHT = Math.round(PORTADA_EXPORT_WIDTH / PORTADA_ASPECT_RATIO)

export function coverMinScale(
  naturalWidth: number,
  naturalHeight: number,
  frameWidth: number,
  frameHeight: number,
): number {
  if (!naturalWidth || !naturalHeight || !frameWidth || !frameHeight) return 1
  return Math.max(frameWidth / naturalWidth, frameHeight / naturalHeight)
}

export function centerCoverTransform(
  naturalWidth: number,
  naturalHeight: number,
  frameWidth: number,
  frameHeight: number,
): CropTransform {
  const scale = coverMinScale(naturalWidth, naturalHeight, frameWidth, frameHeight)
  const imgW = naturalWidth * scale
  const imgH = naturalHeight * scale
  return {
    scale,
    x: (frameWidth - imgW) / 2,
    y: (frameHeight - imgH) / 2,
  }
}

export function clampCropTransform(
  transform: CropTransform,
  naturalWidth: number,
  naturalHeight: number,
  frameWidth: number,
  frameHeight: number,
  maxZoom = 4,
): CropTransform {
  const minScale = coverMinScale(naturalWidth, naturalHeight, frameWidth, frameHeight)
  const scale = Math.min(minScale * maxZoom, Math.max(minScale, transform.scale))
  const imgW = naturalWidth * scale
  const imgH = naturalHeight * scale
  const minX = frameWidth - imgW
  const minY = frameHeight - imgH
  return {
    scale,
    x: Math.min(0, Math.max(minX, transform.x)),
    y: Math.min(0, Math.max(minY, transform.y)),
  }
}

/** Zoom manteniendo el punto focal (coords del marco) estable. */
export function zoomCropAtPoint(
  transform: CropTransform,
  naturalWidth: number,
  naturalHeight: number,
  frameWidth: number,
  frameHeight: number,
  nextScale: number,
  focalX: number,
  focalY: number,
  maxZoom = 4,
): CropTransform {
  const minScale = coverMinScale(naturalWidth, naturalHeight, frameWidth, frameHeight)
  const scale = Math.min(minScale * maxZoom, Math.max(minScale, nextScale))
  if (scale === transform.scale) {
    return clampCropTransform(transform, naturalWidth, naturalHeight, frameWidth, frameHeight, maxZoom)
  }
  const ratio = scale / transform.scale
  const x = focalX - (focalX - transform.x) * ratio
  const y = focalY - (focalY - transform.y) * ratio
  return clampCropTransform(
    { scale, x, y },
    naturalWidth,
    naturalHeight,
    frameWidth,
    frameHeight,
    maxZoom,
  )
}

export function cropZoomPercent(
  transform: CropTransform,
  naturalWidth: number,
  naturalHeight: number,
  frameWidth: number,
  frameHeight: number,
): number {
  const minScale = coverMinScale(naturalWidth, naturalHeight, frameWidth, frameHeight)
  if (!minScale) return 100
  return Math.round((transform.scale / minScale) * 100)
}

export type CropExportOptions = {
  exportWidth: number
  exportHeight: number
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp'
  quality?: number
}

/** Recorta al marco y devuelve data URL (JPEG por defecto). */
export function exportCroppedImage(
  image: HTMLImageElement,
  transform: CropTransform,
  frame: CropFrameSize,
  options: CropExportOptions,
): string {
  const { exportWidth, exportHeight, mimeType = 'image/jpeg', quality = 0.88 } = options
  const canvas = document.createElement('canvas')
  canvas.width = exportWidth
  canvas.height = exportHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo preparar el canvas')

  const sx = -transform.x / transform.scale
  const sy = -transform.y / transform.scale
  const sw = frame.width / transform.scale
  const sh = frame.height / transform.scale

  ctx.fillStyle = '#0b1220'
  ctx.fillRect(0, 0, exportWidth, exportHeight)
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, exportWidth, exportHeight)

  return canvas.toDataURL(mimeType, quality)
}

export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.crossOrigin = 'anonymous'
    img.src = src
  })
}
