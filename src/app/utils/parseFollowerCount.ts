export function parseFollowerCount(text: string): number | null {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*([KkMm])?\s*followers/i)
  if (!match) return null

  let num = parseFloat(match[1].replace(',', '.'))
  const suffix = match[2]?.toUpperCase()
  if (suffix === 'K') num *= 1000
  if (suffix === 'M') num *= 1_000_000

  return Math.round(num)
}
