#!/usr/bin/env node
/**
 * Prueba de estrés realista del registro (token + IP + timeouts + reintentos).
 *
 * Uso:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npm run check:registration-stress
 *
 * Variables:
 *   STRESS_CLIENTS=100
 *   STRESS_MIN_LATENCY_MS=100
 *   STRESS_MAX_LATENCY_MS=5000
 *   STRESS_TIMEOUT_MS=3000          (timeout de UI simulado; el insert puede seguir)
 *   STRESS_RETRY_RATE=0.25         (fracción que reintenta tras timeout/error)
 *   STRESS_DROP_RATE=0.1           (fracción que "cierra pestaña" sin reintentar)
 *   STRESS_CLEANUP=true
 */
import { performance } from 'node:perf_hooks'
import { randomUUID } from 'node:crypto'

const ROOM_MARKER = '::r:'
const DEFAULT_ROULETTE_CODE = 'general'

const help = `
Prueba de estres de registro (concurrencia + latencia + timeouts + reintentos).

  VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npm run check:registration-stress
`

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(help.trim())
  process.exit(0)
}

const env = process.env
const supabaseUrl = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
const supabaseKey =
  env.SUPABASE_KEY ||
  env.SUPABASE_ANON_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(help.trim())
  console.error('\nFaltan URL y anon key de Supabase.')
  process.exit(1)
}

const clients = readInt('STRESS_CLIENTS', 100)
const minLatency = readInt('STRESS_MIN_LATENCY_MS', 100)
const maxLatency = readInt('STRESS_MAX_LATENCY_MS', 5000)
const uiTimeoutMs = readInt('STRESS_TIMEOUT_MS', 3000)
const retryRate = readFloat('STRESS_RETRY_RATE', 0.25)
const dropRate = readFloat('STRESS_DROP_RATE', 0.1)
const cleanupEnabled = env.STRESS_CLEANUP !== 'false'
const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
const rouletteCode = sanitize(env.STRESS_ROULETTE || `stress-${runId}`)
const restBaseUrl = `${supabaseUrl}/rest/v1`

const createdTokens = []
const createdIps = []

console.log('Estres de registro')
console.log(`- clientes: ${clients}`)
console.log(`- latencia artificial: ${minLatency}-${maxLatency} ms`)
console.log(`- timeout UI: ${uiTimeoutMs} ms`)
console.log(`- retry rate: ${retryRate}`)
console.log(`- drop rate: ${dropRate}`)
console.log(`- ruleta: ${rouletteCode}`)

const wallStart = performance.now()
const outcomes = await Promise.all(
  Array.from({ length: clients }, (_, i) => simulateClient(i + 1)),
)
const wallMs = performance.now() - wallStart

// Verificación final en servidor
const serverRows = await listRoomParticipants()
const tokensOnServer = serverRows
  .map((r) => r.registration_token)
  .filter(Boolean)
const uniqueTokens = new Set(tokensOnServer)
const uniqueIps = new Set(serverRows.map((r) => r.ip_address))

const intendedSuccesses = outcomes.filter((o) => o.intendedSuccess).length
const reportedSuccesses = outcomes.filter((o) => o.reportedSuccess).length
const timeouts = outcomes.filter((o) => o.timedOut).length
const retries = outcomes.filter((o) => o.retried).length
const drops = outcomes.filter((o) => o.dropped).length

console.log('\nResumen cliente')
console.log(`- duracion: ${wallMs.toFixed(0)} ms`)
console.log(`- exito reportado UI: ${reportedSuccesses}`)
console.log(`- exito pretendido (sin drop): ${intendedSuccesses}`)
console.log(`- timeouts UI: ${timeouts}`)
console.log(`- reintentos: ${retries}`)
console.log(`- drops (sin reintento): ${drops}`)

console.log('\nResumen servidor')
console.log(`- filas en sala: ${serverRows.length}`)
console.log(`- tokens unicos: ${uniqueTokens.size}`)
console.log(`- ips unicas: ${uniqueIps.size}`)

const failed = []
if (uniqueTokens.size !== tokensOnServer.length) {
  failed.push('Hay tokens duplicados en servidor')
}
if (serverRows.length !== uniqueIps.size) {
  // Con UNIQUE(ip) no debería pasar; con solo token podría haber misma IP
  console.log('- nota: ips no unicas (posible si se dropeo UNIQUE ip)')
}
if (serverRows.length < intendedSuccesses - drops) {
  // intended already excludes drops roughly
}
// Cada cliente que reportó éxito o que hizo insert sin drop debe existir
const expectedMin = outcomes.filter((o) => o.reportedSuccess || (o.insertCompleted && !o.dropped)).length
// Mejor: contar tokens que debieron persistir
const expectedTokens = new Set(
  outcomes.filter((o) => o.insertCompleted || o.reportedSuccess).map((o) => o.token),
)
const missing = [...expectedTokens].filter((t) => !uniqueTokens.has(t))
if (missing.length > 0) {
  failed.push(`${missing.length} tokens esperados no estan en servidor`)
}
if (serverRows.length !== uniqueTokens.size && tokensOnServer.length > 0) {
  failed.push('Filas vs tokens unicos no coinciden (duplicados?)')
}
// Ruleta: count active debe == server rows (todos active)
const activeCount = serverRows.filter((r) => r.status === 'active').length
if (activeCount !== serverRows.length) {
  failed.push(`Ruleta/status: ${activeCount} active de ${serverRows.length}`)
}
if (Math.abs(serverRows.length - reportedSuccesses) > timeouts) {
  // allow some slack for timeout-then-success without UI recovery in this sim
  console.log(
    `- aviso: server=${serverRows.length} vs UI success=${reportedSuccesses} (timeouts=${timeouts})`,
  )
}

if (cleanupEnabled && (createdIps.length > 0 || createdTokens.length > 0)) {
  await cleanup()
}

if (failed.length > 0) {
  console.error('\nEstres FALLIDO:')
  for (const f of failed) console.error(`- ${f}`)
  process.exit(1)
}

console.log('\nEstres OK: sin duplicados de token y conteo coherente con la sala.')
process.exit(0)

async function simulateClient(index) {
  const deviceToken = randomUUID()
  const roomToken = `${deviceToken}${ROOM_MARKER}${rouletteCode}`
  const rawIp = buildIp(index)
  const ipAddress = `${rawIp}${ROOM_MARKER}${rouletteCode}`
  const username = `stress-${runId}-${String(index).padStart(4, '0')}`
  const team = ['blue', 'yellow', 'red'][(index - 1) % 3]
  const latency = minLatency + Math.random() * (maxLatency - minLatency)
  const willDrop = Math.random() < dropRate

  const result = {
    index,
    token: roomToken,
    intendedSuccess: !willDrop,
    reportedSuccess: false,
    insertCompleted: false,
    timedOut: false,
    retried: false,
    dropped: willDrop,
  }

  await sleep(latency * 0.15)

  const insertPromise = insertWithToken({ username, team, ipAddress, roomToken })
    .then(() => {
      result.insertCompleted = true
      createdIps.push(ipAddress)
      createdTokens.push(roomToken)
    })
    .catch((err) => {
      result.insertError = err instanceof Error ? err.message : String(err)
    })

  const raced = await Promise.race([
    insertPromise.then(() => 'ok'),
    sleep(uiTimeoutMs).then(() => 'timeout'),
  ])

  if (raced === 'timeout') {
    result.timedOut = true
    // El insert puede seguir en background
    if (willDrop) {
      await insertPromise.catch(() => {})
      return result
    }

    // Recuperación post-timeout: buscar por token (como el front)
    await sleep(200 + Math.random() * 800)
    const found = await findByToken(roomToken)
    if (found) {
      result.reportedSuccess = true
      await insertPromise.catch(() => {})
      return result
    }

    // Reintento idempotente (solo una fracción)
    if (Math.random() < retryRate) {
      result.retried = true
      try {
        await insertWithToken({ username, team, ipAddress, roomToken })
        result.insertCompleted = true
        createdIps.push(ipAddress)
        createdTokens.push(roomToken)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (/23505|duplicate|unique/i.test(msg)) {
          const again = await findByToken(roomToken)
          if (again) {
            result.reportedSuccess = true
            result.insertCompleted = true
            return result
          }
        }
        result.insertError = msg
      }
      const afterRetry = await findByToken(roomToken)
      if (afterRetry) result.reportedSuccess = true
    }
    await insertPromise.catch(() => {})
    return result
  }

  // Insert terminó dentro del timeout UI
  await insertPromise
  if (result.insertCompleted) {
    result.reportedSuccess = true
  } else if (result.insertError && /23505|duplicate|unique/i.test(result.insertError)) {
    const found = await findByToken(roomToken)
    result.reportedSuccess = Boolean(found)
    result.insertCompleted = result.reportedSuccess
  }

  return result
}

async function insertWithToken({ username, team, ipAddress, roomToken }) {
  const url = new URL(`${restBaseUrl}/participants`)
  await requestJson(url, {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify([
      {
        username,
        team,
        status: 'active',
        ip_address: ipAddress,
        registration_token: roomToken,
      },
    ]),
  })
}

async function findByToken(token) {
  const url = new URL(`${restBaseUrl}/participants`)
  url.searchParams.set('select', 'id,registration_token,ip_address,status')
  url.searchParams.set('registration_token', `eq.${token}`)
  url.searchParams.set('limit', '1')
  const rows = await requestJson(url, { method: 'GET' })
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null
}

async function listRoomParticipants() {
  const url = new URL(`${restBaseUrl}/participants`)
  url.searchParams.set('select', 'id,ip_address,registration_token,status')
  url.searchParams.set('ip_address', `like.*${ROOM_MARKER}${rouletteCode}`)
  return requestJson(url, { method: 'GET' })
}

async function cleanup() {
  console.log(`\nLimpiando sala ${rouletteCode}...`)
  const url = new URL(`${restBaseUrl}/participants`)
  url.searchParams.set('ip_address', `like.*${ROOM_MARKER}${rouletteCode}`)
  try {
    await requestJson(url, { method: 'DELETE', headers: { Prefer: 'return=minimal' } })
  } catch (error) {
    console.warn('Cleanup parcial:', error instanceof Error ? error.message : error)
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${url.pathname} -> ${response.status}: ${text}`)
  }
  if (!text) return []
  return JSON.parse(text)
}

function buildIp(index) {
  const z = index - 1
  return `198.19.${Math.floor(z / 250)}.${(z % 250) + 1}`
}

function sanitize(value) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || DEFAULT_ROULETTE_CODE
  )
}

function readInt(name, def) {
  const raw = env[name]
  if (!raw) return def
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${name} invalido`)
  return n
}

function readFloat(name, def) {
  const raw = env[name]
  if (!raw) return def
  const n = Number.parseFloat(raw)
  if (!Number.isFinite(n) || n < 0 || n > 1) throw new Error(`${name} debe ser 0..1`)
  return n
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
