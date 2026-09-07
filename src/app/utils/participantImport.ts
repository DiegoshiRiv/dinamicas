import { normalizeRegistrationUsername } from '@/app/utils/registrationToken'

export const MAX_PARTICIPANT_IMPORT_NAMES = 1000

export const PARTICIPANT_IMPORT_ACCEPT = [
  '.txt',
  '.csv',
  '.tsv',
  '.xlsx',
  '.pdf',
  'text/plain',
  'text/csv',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
].join(',')

let pdfWorkerConfigured = false

function stripListMarker(value: string): string {
  return value
    .replace(/^\s*[-*\u2022]+\s*/u, '')
    .replace(/^\s*\d+[\).\-\s]+\s*/u, '')
    .replace(/^\s*[@#]+\s*/u, '')
}

function cleanParticipantCandidate(value: string): string {
  return stripListMarker(value)
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2018\u2019\u201c\u201d]/g, '"')
    .replace(/^["']+|["']+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isHeaderCandidate(value: string): boolean {
  const key = normalizeRegistrationUsername(value)
  return [
    'nombre',
    'usuario',
    'entrenador',
    'trainer',
    'nickname',
    'nick',
    'participante',
    'participantes',
    'user',
    'username',
  ].includes(key)
}

export function parseParticipantListText(text: string): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  const lines = text.replace(/\r\n?/g, '\n').split('\n')

  for (const line of lines) {
    const pieces = /[,;\t]/.test(line) ? line.split(/[,;\t]/) : [line]

    for (const piece of pieces) {
      const name = cleanParticipantCandidate(piece)
      if (!name || isHeaderCandidate(name)) continue

      const key = normalizeRegistrationUsername(name)
      if (!key || seen.has(key)) continue

      seen.add(key)
      names.push(name)
      if (names.length >= MAX_PARTICIPANT_IMPORT_NAMES) return names
    }
  }

  return names
}

async function extractPdfText(file: File): Promise<string> {
  const [pdfjs, workerModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])

  if (!pdfWorkerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default
    pdfWorkerConfigured = true
  }

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    pages.push(
      content.items
        .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
        .filter(Boolean)
        .join('\n'),
    )
  }

  return pages.join('\n')
}

async function extractXlsxText(file: File): Promise<string> {
  const readXlsxFile = (await import('read-excel-file/browser')).default
  const rows = await readXlsxFile(file)
  return rows
    .flat()
    .map((cell) => (cell == null ? '' : String(cell)))
    .filter(Boolean)
    .join('\n')
}

export async function extractParticipantNamesFromFile(file: File): Promise<string[]> {
  const filename = file.name.toLowerCase()
  const type = file.type.toLowerCase()

  if (filename.endsWith('.xlsx') || type.includes('spreadsheetml.sheet')) {
    return parseParticipantListText(await extractXlsxText(file))
  }

  if (filename.endsWith('.pdf') || type === 'application/pdf') {
    return parseParticipantListText(await extractPdfText(file))
  }

  if (filename.endsWith('.xls')) {
    throw new Error('Guarda el Excel como .xlsx para importarlo.')
  }

  if (
    filename.endsWith('.txt') ||
    filename.endsWith('.csv') ||
    filename.endsWith('.tsv') ||
    type.startsWith('text/')
  ) {
    return parseParticipantListText(await file.text())
  }

  throw new Error('Formato no compatible. Usa TXT, CSV, XLSX o PDF.')
}
