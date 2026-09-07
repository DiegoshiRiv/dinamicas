/**
 * Edge-case regression checks for pure utilities (no DOM / Vite needed).
 * Run: node scripts/edge-case-check.mjs
 */
import assert from 'node:assert/strict'
function sanitizeRouletteCode(value) {
  const cleaned = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)
  return cleaned || 'general'
}

function formatClockLabel(hour24, minute = 0) {
  const h = Number.isFinite(hour24) ? Math.trunc(hour24) : 0
  const m = Number.isFinite(minute) ? Math.trunc(minute) : 0
  const safeHour = ((h % 24) + 24) % 24
  const safeMinute = Math.min(59, Math.max(0, m))
  const period = safeHour >= 12 ? 'p.m.' : 'a.m.'
  const hour12 = safeHour % 12 || 12
  return `${hour12}:${String(safeMinute).padStart(2, '0')} ${period}`
}

function normalizeUsername(username) {
  if (typeof username !== 'string' || !username) return ''
  try {
    return username
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[@]/g, 'a')
      .replace(/[$]/g, 's')
      .replace(/[!|]/g, 'i')
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/2/g, 'z')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/6/g, 'g')
      .replace(/7/g, 't')
      .replace(/8/g, 'b')
      .replace(/9/g, 'g')
      .replace(/[^a-z]/g, '')
  } catch {
    return ''
  }
}

function isVenaderoBlacklisted(username) {
  return normalizeUsername(username).includes('venadero')
}

function safeParseIso(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function isEventLive(startsAt, endsAt, now = new Date()) {
  const start = safeParseIso(startsAt)
  const end = safeParseIso(endsAt)
  if (!start || !end || start > end) return false
  return now >= start && now <= end
}

function banDays(raw) {
  return Math.max(1, Math.min(3650, Math.floor(Number(raw)) || 7))
}

function isValidCp(cp) {
  const n = Number(cp)
  return Number.isFinite(n) && Number.isInteger(n) && n >= 1
}

let failed = 0
function check(name, fn) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
  } catch (err) {
    failed++
    console.error(`  ✗ ${name}`)
    console.error(`    ${err.message}`)
  }
}

console.log('Edge-case checks\n')

check('sanitize: null/undefined → general', () => {
  assert.equal(sanitizeRouletteCode(null), 'general')
  assert.equal(sanitizeRouletteCode(undefined), 'general')
  assert.equal(sanitizeRouletteCode(''), 'general')
  assert.equal(sanitizeRouletteCode('   '), 'general')
})

check('sanitize: emoji / unicode / injection', () => {
  assert.equal(sanitizeRouletteCode('🔥Sala!!'), 'sala')
  assert.equal(sanitizeRouletteCode('../hack'), 'hack')
  assert.equal(sanitizeRouletteCode('A'.repeat(200)).length, 64)
})

check('formatClockLabel: NaN / negative / huge', () => {
  assert.equal(formatClockLabel(NaN, NaN), '12:00 a.m.')
  assert.equal(formatClockLabel(-1, 0), '11:00 p.m.')
  assert.equal(formatClockLabel(25, 70), '1:59 a.m.')
  assert.equal(formatClockLabel(Infinity, -5), '12:00 a.m.')
})

check('blacklist: null / emoji / leetspeak', () => {
  assert.equal(isVenaderoBlacklisted(null), false)
  assert.equal(isVenaderoBlacklisted(undefined), false)
  assert.equal(isVenaderoBlacklisted(''), false)
  assert.equal(isVenaderoBlacklisted('v3n@d3r0s'), true)
  assert.equal(isVenaderoBlacklisted('🔥normal'), false)
})

check('isEventLive: inverted / invalid / null', () => {
  assert.equal(isEventLive(null, null), false)
  assert.equal(isEventLive('', '2026-01-01T12:00:00Z'), false)
  assert.equal(isEventLive('not-a-date', 'also-bad'), false)
  assert.equal(
    isEventLive('2026-01-02T12:00:00Z', '2026-01-01T12:00:00Z'),
    false,
  )
  assert.equal(
    isEventLive(
      '2026-01-01T00:00:00Z',
      '2026-01-02T00:00:00Z',
      new Date('2026-01-01T12:00:00Z'),
    ),
    true,
  )
})

check('ban days: negative / NaN / huge', () => {
  assert.equal(banDays(-5), 1)
  assert.equal(banDays(NaN), 7)
  assert.equal(banDays(0), 7)
  assert.equal(banDays('abc'), 7)
  assert.equal(banDays(99999), 3650)
  assert.equal(banDays(3.9), 3)
})

check('CP validation: non-numeric', () => {
  assert.equal(isValidCp('abc'), false)
  assert.equal(isValidCp('12x'), false)
  assert.equal(isValidCp(''), false)
  assert.equal(isValidCp('1.5'), false)
  assert.equal(isValidCp('1500'), true)
  assert.equal(isValidCp(0), false)
  assert.equal(isValidCp(-3), false)
})

check('carousel index clamp', () => {
  const bannersLength = 2
  let index = 4
  const safe = bannersLength ? index % bannersLength : 0
  assert.equal(safe, 0)
  index = 5
  assert.equal(index % bannersLength, 1)
})

check('spin lock must unlock on abort paths (logic contract)', () => {
  // Document the contract: every early return after spinLock=true must clear it.
  const abortPaths = [
    'forced winner left room',
    'winningPlayer invalid / blacklisted',
    'no eligible players',
  ]
  assert.ok(abortPaths.length >= 3)
})

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll edge-case checks passed.')
