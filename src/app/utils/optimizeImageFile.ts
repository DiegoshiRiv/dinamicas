export function optimizeImageFile(
  file: File,
  maxDimension = 1200,
  quality = 0.85,
  options?: { forceJpeg?: boolean },
): Promise<string> {
  if (!file || file.size === 0) {
    return Promise.reject(new Error('Archivo vacío'))
  }
  if (file.type && !file.type.startsWith('image/')) {
    return Promise.reject(new Error('El archivo no es una imagen'))
  }

  const forceJpeg = Boolean(options?.forceJpeg)

  if (!forceJpeg && (file.type === 'image/gif' || file.type === 'image/svg+xml')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('No se pudo leer la imagen'))
      reader.readAsDataURL(file)
    })
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const ratio = Math.min(1, maxDimension / Math.max(image.width || 1, image.height || 1, 1))
        const width = Math.max(1, Math.round((image.width || 1) * ratio))
        const height = Math.max(1, Math.round((image.height || 1) * ratio))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No se pudo preparar la imagen'))
          return
        }
        // Fondo blanco: JPEG no tiene transparencia y evita “agujeros” negros.
        if (forceJpeg) {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, width, height)
        }
        ctx.drawImage(image, 0, 0, width, height)
        if (forceJpeg) {
          resolve(canvas.toDataURL('image/jpeg', quality))
          return
        }
        const usePng = file.type === 'image/png' || file.type === 'image/webp'
        resolve(canvas.toDataURL(usePng ? 'image/png' : 'image/jpeg', quality))
      }
      image.onerror = () => reject(new Error('No se pudo procesar la imagen'))
      image.src = String(reader.result || '')
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
}
