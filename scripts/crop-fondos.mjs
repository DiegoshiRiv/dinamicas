import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const TARGET_W = 1600
const TARGET_H = 800
const ASSETS = path.resolve('src/assets')

const JOBS = [
  { file: 'FondoCD.png', focalY: 0.55 },
  { file: 'FondoCD2.png', focalY: 0.5 },
]

async function cropToLandscape(file, focalY) {
  const input = path.join(ASSETS, file)
  const backup = `${input}.bak`
  const temp = `${input}.tmp`

  const meta = await sharp(input).metadata()
  const { width, height } = meta
  const cropH = Math.round(width / 2)
  const centerY = Math.round(height * focalY)
  const top = Math.min(Math.max(0, centerY - Math.round(cropH / 2)), height - cropH)

  console.log(`${file}: ${width}x${height} -> crop y=${top} h=${cropH} -> ${TARGET_W}x${TARGET_H}`)

  if (!fs.existsSync(backup)) {
    fs.copyFileSync(input, backup)
    console.log(`  backup: ${path.basename(backup)}`)
  }

  await sharp(input)
    .extract({ left: 0, top, width, height: cropH })
    .resize(TARGET_W, TARGET_H, { fit: 'fill' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(temp)

  fs.renameSync(temp, input)

  const out = await sharp(input).metadata()
  const sizeKb = Math.round(fs.statSync(input).size / 1024)
  console.log(`  result: ${out.width}x${out.height} (${sizeKb} KB)`)
}

for (const job of JOBS) {
  await cropToLandscape(job.file, job.focalY)
}
