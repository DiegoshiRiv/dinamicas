export function optimizeImageFile(file: File, maxDimension = 1200, quality = 0.85): Promise<string> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
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
        const ratio = Math.min(1, maxDimension / Math.max(image.width, image.height))
        const width = Math.max(1, Math.round(image.width * ratio))
        const height = Math.max(1, Math.round(image.height * ratio))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No se pudo preparar la imagen'))
          return
        }
        ctx.drawImage(image, 0, 0, width, height)
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
