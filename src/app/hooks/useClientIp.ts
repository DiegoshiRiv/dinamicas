import { useCallback, useEffect, useState } from 'react'

const IP_CACHE_KEY = 'client-public-ip'
const PER_PROVIDER_MS = 3500
const MAX_ROUNDS = 2

type IpProvider = (signal: AbortSignal) => Promise<string>

function readCachedIp(): string | null {
  try {
    const cached = sessionStorage.getItem(IP_CACHE_KEY)
    return cached && isValidPublicIp(cached) ? cached : null
  } catch {
    return null
  }
}

function writeCachedIp(ip: string) {
  try {
    sessionStorage.setItem(IP_CACHE_KEY, ip)
  } catch {
    // ignore
  }
}

/** Rechaza IPs de respaldo locales que romperían el límite de 1 registro por persona. */
export function isValidPublicIp(ip: string): boolean {
  if (!ip || ip.startsWith('session-') || ip.startsWith('admin-bypass-')) return false
  const trimmed = ip.trim()
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(trimmed)) return true
  // IPv6 (incl. Cloudflare / Private Relay)
  if (trimmed.includes(':') && /^[0-9a-fA-F:.]+$/.test(trimmed)) return true
  return false
}

async function fetchWithTimeout(
  provider: IpProvider,
  ms: number = PER_PROVIDER_MS,
): Promise<string> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), ms)
  try {
    return await provider(controller.signal)
  } finally {
    window.clearTimeout(timeout)
  }
}

async function fetchFromIpify(signal: AbortSignal): Promise<string> {
  const res = await fetch('https://api.ipify.org?format=json', { signal })
  if (!res.ok) throw new Error('ipify failed')
  const data = (await res.json()) as { ip?: string }
  const ip = data.ip?.trim() ?? ''
  if (!isValidPublicIp(ip)) throw new Error('invalid ipify response')
  return ip
}

async function fetchFromCloudflareTrace(signal: AbortSignal): Promise<string> {
  const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { signal })
  if (!res.ok) throw new Error('cf trace failed')
  const text = await res.text()
  const match = text.match(/^ip=(.+)$/m)
  const ip = match?.[1]?.trim() ?? ''
  if (!isValidPublicIp(ip)) throw new Error('invalid cf ip')
  return ip
}

async function fetchFromIcanhazip(signal: AbortSignal): Promise<string> {
  const res = await fetch('https://ipv4.icanhazip.com', { signal })
  if (!res.ok) throw new Error('icanhazip failed')
  const ip = (await res.text()).trim()
  if (!isValidPublicIp(ip)) throw new Error('invalid icanhazip response')
  return ip
}

const PROVIDERS: IpProvider[] = [
  fetchFromIpify,
  fetchFromCloudflareTrace,
  fetchFromIcanhazip,
]

async function resolvePublicIp(): Promise<string> {
  let lastError: unknown

  for (let round = 0; round < MAX_ROUNDS; round++) {
    for (const provider of PROVIDERS) {
      try {
        return await fetchWithTimeout(provider)
      } catch (error) {
        lastError = error
      }
    }
    if (round < MAX_ROUNDS - 1) {
      await new Promise((r) => setTimeout(r, 300 * (round + 1)))
    }
  }

  throw lastError instanceof Error ? lastError : new Error('No se pudo obtener tu IP')
}

let inflight: Promise<string> | null = null

/** Precarga IP al abrir la app para que el registro no espere en el submit. */
export function prefetchClientIp(): Promise<string> {
  const cached = readCachedIp()
  if (cached) return Promise.resolve(cached)

  if (!inflight) {
    inflight = resolvePublicIp()
      .then((ip) => {
        writeCachedIp(ip)
        return ip
      })
      .finally(() => {
        inflight = null
      })
  }

  return inflight
}

/** Fuerza un nuevo intento (borra caché fallida / permite reintentar tras error). */
export function retryClientIp(): Promise<string> {
  try {
    sessionStorage.removeItem(IP_CACHE_KEY)
  } catch {
    // ignore
  }
  inflight = null
  return prefetchClientIp()
}

export function useClientIp() {
  const [ip, setIp] = useState<string | null>(() => readCachedIp())
  const [ready, setReady] = useState(() => Boolean(readCachedIp()))
  const [failed, setFailed] = useState(false)

  const applySuccess = useCallback((resolved: string) => {
    setIp(resolved)
    setReady(true)
    setFailed(false)
  }, [])

  const applyFailure = useCallback(() => {
    setFailed(true)
    setReady(false)
  }, [])

  useEffect(() => {
    if (ip) {
      setReady(true)
      setFailed(false)
      return
    }

    let cancelled = false
    void prefetchClientIp()
      .then((resolved) => {
        if (cancelled) return
        applySuccess(resolved)
      })
      .catch(() => {
        if (cancelled) return
        applyFailure()
      })

    return () => {
      cancelled = true
    }
  }, [ip, applySuccess, applyFailure])

  const retry = useCallback(async () => {
    setFailed(false)
    setReady(false)
    try {
      const resolved = await retryClientIp()
      applySuccess(resolved)
      return resolved
    } catch {
      applyFailure()
      throw new Error('No pudimos verificar tu conexión')
    }
  }, [applySuccess, applyFailure])

  return { ip, ready, failed, retry }
}
