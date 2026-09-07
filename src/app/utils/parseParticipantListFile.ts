/**
 * Extrae nombres de entrenador desde TXT, CSV, Excel o PDF.
 * Una entrada por línea / celda de la primera columna útil.
 */

const MAX_NAME_LEN = 40

function cleanName(raw: string): string | null {
  const name = raw
    .replace(/^\uFEFF/, '')
    .replace(/^["']|["']$/g, '')
    .trim()
  if (!name) return null
  if (/^nombre(s)?$/i.test(name)) return null
  if (/^username$/i.test(name)) return null
  if (/^entrenador(es)?$/i.test(name)) return null
  if (/^user(name)?$/i.test(name)) return null
  if (name.length > MAX_NAME_LEN) return name.slice(0, MAX_NAME_LEN).trim() || null
  return name
}

function dedupeNames(names: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const name of names) {
    const key = name.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, '')
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(name)
  }
  return out
}

function parsePlainText(text: string): string[] {
  const names: string[] = []
  for (const line of text.split(/\r?\n/)) {
    const cells = line.includes('\t')
      ? line.split('\t')
      : line.includes(';')
        ? line.split(';')
        : line.includes(',')
          ? line.split(',')
          : [line]
    for (const cell of cells) {
      const name = cleanName(cell)
      if (name) {
        names.push(name)
        break
      }
    }
  }
  return dedupeNames(names)
}

async function parseExcel(buffer: ArrayBuffer): Promise<string[]> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'array' })
  const names: string[] = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue
    const rows = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    })
    for (const row of rows) {
      if (!Array.isArray(row)) continue
      for (const cell of row) {
        const name = cleanName(String(cell ?? ''))
        if (name) {
          names.push(name)
          break
        }
      }
    }
    if (names.length > 0) break
  }
  return dedupeNames(names)
}

async function parsePdf(buffer: ArrayBuffer): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist')
  // Worker en CDN para no bloquear el bundle principal.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

  const doc = await pdfjs.getDocument({ data: buffer }).promise
  const chunks: string[] = []
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join('\n')
    chunks.push(pageText)
  }
  return parsePlainText(chunks.join('\n'))
}

export type ParticipantListParseResult = {
  names: string[]
  source: 'txt' | 'csv' | 'xlsx' | 'xls' | 'pdf'
}

export async function parseParticipantListFile(file: File): Promise<ParticipantListParseResult> {
  const lower = file.name.toLowerCase()
  const buffer = await file.arrayBuffer()

  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    return { names: await parseExcel(buffer), source: lower.endsWith('.xls') ? 'xls' : 'xlsx' }
  }
  if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
    return { names: await parsePdf(buffer), source: 'pdf' }
  }
  if (lower.endsWith('.csv') || file.type === 'text/csv') {
    const text = new TextDecoder('utf-8').decode(buffer)
    return { names: parsePlainText(text), source: 'csv' }
  }
  if (lower.endsWith('.txt') || file.type.startsWith('text/')) {
    const text = new TextDecoder('utf-8').decode(buffer)
    return { names: parsePlainText(text), source: 'txt' }
  }

  // Extensión desconocida: intenta texto, luego excel.
  try {
    const text = new TextDecoder('utf-8').decode(buffer)
    const names = parsePlainText(text)
    if (names.length > 0) return { names, source: 'txt' }
  } catch {
    /* fall through */
  }
  return { names: await parseExcel(buffer), source: 'xlsx' }
}

export const PARTICIPANT_LIST_ACCEPT =
  '.txt,.csv,.xlsx,.xls,.pdf,text/plain,text/csv,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
