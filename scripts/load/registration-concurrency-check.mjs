#!/usr/bin/env node
import { performance } from 'node:perf_hooks'

const ROOM_MARKER = '::r:'
const DEFAULT_ROULETTE_CODE = 'general'
const DEFAULT_CONCURRENT_REGISTRATIONS = 500
const DEFAULT_P95_MS = 1000
const DEFAULT_MAX_MS = 5000
const DEFAULT_TIMEOUT_MS = 15000
const DEFAULT_CLEANUP_BATCH_SIZE = 100

const help = `
Verifica el registro simultaneo contra Supabase REST API.

Uso:
  VITE_SUPABASE_URL=https://<project>.supabase.co \\
  VITE_SUPABASE_ANON_KEY=<key> \\
  npm run check:registration-load

Variables opcionales:
  CONCURRENT_REGISTRATIONS       Registros simultaneos (default: 500)
  REGISTRATION_LOAD_P95_MS       Umbral p95 en ms (default: 1000)
  REGISTRATION_LOAD_MAX_MS       Umbral maximo por registro en ms (default: 5000)
  REGISTRATION_LOAD_TIMEOUT_MS   Timeout por registro en ms (default: 15000)
  REGISTRATION_LOAD_CLEANUP      Borra los registros creados (default: true)
  REGISTRATION_LOAD_FULL_FLOW    Replica lecturas previas + insert (default: true)
  REGISTRATION_LOAD_ROULETTE     Codigo de ruleta aislado (default: load-<timestamp>)
  REGISTRATION_LOAD_USERNAME     Prefijo de usuario (default: load-trainer)
`

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(help.trim())
  process.exit(0)
}

const env = process.env
const supabaseUrl = normalizeSupabaseUrl(env.SUPABASE_URL || env.VITE_SUPABASE_URL)
const supabaseKey =
  env.SUPABASE_KEY ||
  env.SUPABASE_ANON_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(help.trim())
  console.error('\nFaltan VITE_SUPABASE_URL/SUPABASE_URL y VITE_SUPABASE_ANON_KEY/SUPABASE_KEY.')
  process.exit(1)
}

const concurrentRegistrations = readPositiveInt(
  'CONCURRENT_REGISTRATIONS',
  DEFAULT_CONCURRENT_REGISTRATIONS,
)
const p95ThresholdMs = readPositiveInt('REGISTRATION_LOAD_P95_MS', DEFAULT_P95_MS)
const maxThresholdMs = readPositiveInt('REGISTRATION_LOAD_MAX_MS', DEFAULT_MAX_MS)
const timeoutMs = readPositiveInt('REGISTRATION_LOAD_TIMEOUT_MS', DEFAULT_TIMEOUT_MS)
const cleanupBatchSize = readPositiveInt(
  'REGISTRATION_LOAD_CLEANUP_BATCH_SIZE',
  DEFAULT_CLEANUP_BATCH_SIZE,
)
const cleanupEnabled = env.REGISTRATION_LOAD_CLEANUP !== 'false'
const fullFlowEnabled = env.REGISTRATION_LOAD_FULL_FLOW !== 'false'
const runId = buildRunId()
const rouletteCode = sanitizeRouletteCode(env.REGISTRATION_LOAD_ROULETTE || `load-${runId}`)
const usernamePrefix = sanitizeUsernamePrefix(env.REGISTRATION_LOAD_USERNAME || 'load-trainer')

const restBaseUrl = `${supabaseUrl}/rest/v1`
const successfulIpAddresses = []

console.log('Iniciando verificacion de registro simultaneo')
console.log(`- registros simultaneos: ${concurrentRegistrations}`)
console.log(`- flujo: ${fullFlowEnabled ? 'lecturas previas + insert' : 'insert directo'}`)
console.log(`- ruleta aislada: ${rouletteCode}`)
console.log(`- umbral p95: ${p95ThresholdMs} ms`)
console.log(`- umbral maximo: ${maxThresholdMs} ms`)
console.log(`- cleanup: ${cleanupEnabled ? 'activado' : 'desactivado'}`)

const wallStart = performance.now()
const results = await Promise.all(
  Array.from({ length: concurrentRegistrations }, (_, index) => registerParticipant(index + 1)),
)
const wallMs = performance.now() - wallStart

const successes = results.filter((result) => result.ok)
const failures = results.filter((result) => !result.ok)
const stats = buildLatencyStats(successes.map((result) => result.durationMs))
const throughput = successes.length / (wallMs / 1000)

printSummary({ failures, stats, throughput, wallMs })

if (cleanupEnabled && successfulIpAddresses.length > 0) {
  await cleanupParticipants(successfulIpAddresses)
}

const failedChecks = []
if (failures.length > 0) {
  failedChecks.push(`${failures.length} registros fallaron`)
}
if (!stats || stats.p95 > p95ThresholdMs) {
  failedChecks.push(`p95 ${stats ? formatMs(stats.p95) : 'N/A'} supera ${p95ThresholdMs} ms`)
}
if (!stats || stats.max > maxThresholdMs) {
  failedChecks.push(`max ${stats ? formatMs(stats.max) : 'N/A'} supera ${maxThresholdMs} ms`)
}

if (failedChecks.length > 0) {
  console.error('\nVerificacion fallida:')
  for (const check of failedChecks) console.error(`- ${check}`)
  process.exit(1)
}

console.log('\nVerificacion exitosa: el registro cumple los umbrales configurados.')

async function registerParticipant(index) {
  const startedAt = performance.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const rawIp = buildSyntheticIp(index)
  const ipAddress = encodeIpForRoulette(rawIp, rouletteCode)
  const username = `${usernamePrefix}-${runId}-${String(index).padStart(4, '0')}`
  const team = ['blue', 'yellow', 'red'][(index - 1) % 3]

  try {
    if (fullFlowEnabled) {
      const [banRows, participantRows] = await Promise.all([
        selectRows('banned_ips', 'expires_at', 'ip_address', ipAddress, controller.signal),
        selectRows('participants', 'id', 'ip_address', ipAddress, controller.signal),
      ])

      const now = Date.now()
      const activeBan = banRows.some((row) => row.expires_at && Date.parse(row.expires_at) > now)
      if (activeBan) throw new Error(`La IP sintetica ${rawIp} aparece baneada`)
      if (participantRows.length > 0) throw new Error(`La IP sintetica ${rawIp} ya esta registrada`)
    }

    await insertParticipant({ username, team, ipAddress, signal: controller.signal })
    successfulIpAddresses.push(ipAddress)

    return {
      ok: true,
      index,
      durationMs: performance.now() - startedAt,
    }
  } catch (error) {
    return {
      ok: false,
      index,
      durationMs: performance.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function selectRows(table, select, column, value, signal) {
  const url = new URL(`${restBaseUrl}/${table}`)
  url.searchParams.set('select', select)
  url.searchParams.set(column, `eq.${value}`)
  return requestJson(url, { method: 'GET', signal })
}

async function insertParticipant({ username, team, ipAddress, signal }) {
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
      },
    ]),
    signal,
  })
}

async function cleanupParticipants(ipAddresses) {
  console.log(`\nLimpiando ${ipAddresses.length} registros de prueba...`)
  const batches = chunk(ipAddresses, cleanupBatchSize)

  for (const batch of batches) {
    const url = new URL(`${restBaseUrl}/participants`)
    url.searchParams.set('ip_address', buildInFilter(batch))

    try {
      await requestJson(url, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      })
    } catch (error) {
      console.warn(
        `No se pudo limpiar un lote de registros. Ruleta para limpieza manual: ${rouletteCode}`,
      )
      console.warn(error instanceof Error ? error.message : String(error))
      return
    }
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

function buildLatencyStats(values) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const sum = sorted.reduce((total, value) => total + value, 0)

  return {
    min: sorted[0],
    avg: sum / sorted.length,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    max: sorted[sorted.length - 1],
  }
}

function percentile(sortedValues, percentileValue) {
  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))]
}

function printSummary({ failures, stats, throughput, wallMs }) {
  console.log('\nResumen')
  console.log(`- duracion total: ${formatMs(wallMs)}`)
  console.log(`- throughput: ${throughput.toFixed(2)} registros/s`)
  console.log(`- exitosos: ${successfulIpAddresses.length}`)
  console.log(`- fallidos: ${failures.length}`)

  if (stats) {
    console.log(`- latencia min: ${formatMs(stats.min)}`)
    console.log(`- latencia avg: ${formatMs(stats.avg)}`)
    console.log(`- latencia p50: ${formatMs(stats.p50)}`)
    console.log(`- latencia p95: ${formatMs(stats.p95)}`)
    console.log(`- latencia p99: ${formatMs(stats.p99)}`)
    console.log(`- latencia max: ${formatMs(stats.max)}`)
  }

  if (failures.length > 0) {
    console.log('\nPrimeros errores:')
    for (const failure of failures.slice(0, 5)) {
      console.log(`- #${failure.index}: ${failure.error}`)
    }
  }
}

function buildSyntheticIp(index) {
  const zeroBased = index - 1
  const thirdOctet = Math.floor(zeroBased / 250)
  const fourthOctet = (zeroBased % 250) + 1
  return `198.18.${thirdOctet}.${fourthOctet}`
}

function buildInFilter(values) {
  return `in.(${values.map((value) => `"${value.replace(/"/g, '\\"')}"`).join(',')})`
}

function encodeIpForRoulette(rawIp, activeRouletteCode) {
  return `${rawIp}${ROOM_MARKER}${sanitizeRouletteCode(activeRouletteCode)}`
}

function sanitizeRouletteCode(value) {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return cleaned || DEFAULT_ROULETTE_CODE
}

function sanitizeUsernamePrefix(value) {
  return value.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '') || 'load-trainer'
}

function normalizeSupabaseUrl(value) {
  if (!value) return ''
  return value.replace(/\/+$/, '')
}

function readPositiveInt(name, defaultValue) {
  const rawValue = env[name]
  if (!rawValue) return defaultValue
  const value = Number.parseInt(rawValue, 10)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} debe ser un entero positivo`)
  }
  return value
}

function buildRunId() {
  return new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
}

function chunk(values, size) {
  const chunks = []
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size))
  }
  return chunks
}

function formatMs(value) {
  return `${value.toFixed(1)} ms`
}
