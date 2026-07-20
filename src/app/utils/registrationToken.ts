import { encodeIpForRoulette, sanitizeRouletteCode } from '@/app/utils/rouletteCode'

const STORAGE_KEY = 'dinamicas-registration-token-v1'
const COOKIE_KEY = 'dinamicas_reg'
const IDB_NAME = 'dinamicas-identity'
const IDB_STORE = 'keys'
const IDB_KEY = 'registration-token'
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 400 // ~13 meses

function newUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  try {
    const match = document.cookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
    if (!match) return null
    const value = decodeURIComponent(match.slice(name.length + 1)).trim()
    return value || null
  } catch {
    return null
  }
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  try {
    const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`
  } catch {
    /* ignore */
  }
}

function readLocal(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() || null
  } catch {
    return null
  }
}

function writeLocal(token: string) {
  try {
    localStorage.setItem(STORAGE_KEY, token)
  } catch {
    /* ignore */
  }
}

function readSession(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)?.trim() || null
  } catch {
    return null
  }
}

function writeSession(token: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, token)
  } catch {
    /* ignore */
  }
}

function openIdentityDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function readIdb(): Promise<string | null> {
  const db = await openIdentityDb()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY)
      req.onsuccess = () => {
        const value = typeof req.result === 'string' ? req.result.trim() : ''
        resolve(value || null)
      }
      req.onerror = () => resolve(null)
      tx.oncomplete = () => db.close()
    } catch {
      resolve(null)
    }
  })
}

async function writeIdb(token: string): Promise<void> {
  const db = await openIdentityDb()
  if (!db) return
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).put(token, IDB_KEY)
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}

function persistTokenSync(token: string) {
  writeLocal(token)
  writeSession(token)
  writeCookie(COOKIE_KEY, token)
  const g = globalThis as { __dinamicasRegToken?: string }
  g.__dinamicasRegToken = token
}

/**
 * UUID estable por dispositivo.
 * Se guarda en localStorage + sessionStorage + cookie para que sea más difícil
 * borrar “solo una cosa” y volver a registrarse.
 */
export function getOrCreateDeviceToken(): string {
  const g = globalThis as { __dinamicasRegToken?: string }
  const existing =
    readLocal() ||
    readCookie(COOKIE_KEY) ||
    readSession() ||
    g.__dinamicasRegToken?.trim() ||
    null

  if (existing) {
    persistTokenSync(existing)
    void writeIdb(existing)
    return existing
  }

  const created = newUuid()
  persistTokenSync(created)
  void writeIdb(created)
  return created
}

/**
 * Restaura el token desde IndexedDB si otras capas se borraron
 * (p. ej. limpia cookies pero no IndexedDB, o viceversa).
 */
export async function hydrateDeviceToken(): Promise<string> {
  const syncToken = getOrCreateDeviceToken()
  const idbToken = await readIdb()
  if (idbToken && idbToken !== syncToken) {
    // Preferir el token más antiguo conocido en IDB si el sync se regeneró.
    const local = readLocal()
    const cookie = readCookie(COOKIE_KEY)
    if (!local && !cookie) {
      persistTokenSync(idbToken)
      return idbToken
    }
  }
  if (idbToken !== syncToken) await writeIdb(syncToken)
  return syncToken
}

/**
 * Token de registro acotado a la sala/evento (equivalente a UNIQUE(event_id, token)).
 * Formato: {uuid}::r:{rouletteCode}
 */
export function encodeRegistrationToken(deviceToken: string, rouletteCode: string): string {
  return encodeIpForRoulette(deviceToken, sanitizeRouletteCode(rouletteCode))
}

/** Clave estable del username de Pokémon GO dentro de la sala. */
export function normalizeRegistrationUsername(username: string): string {
  return username
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

export function encodeUsernameKey(username: string, rouletteCode: string): string {
  return encodeIpForRoulette(
    normalizeRegistrationUsername(username),
    sanitizeRouletteCode(rouletteCode),
  )
}
