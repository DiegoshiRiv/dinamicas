export type AdminRole = 'super' | 'admin'

export interface AdminSession {
  username: string
  role: AdminRole
}

const ADMIN_ACCOUNTS: { username: string; password: string; role: AdminRole }[] = [
  { username: 'fuecoco', password: 'master', role: 'super' },
  { username: 'pawmot', password: 'sellodex2026', role: 'admin' },
  { username: 'bidoof', password: 'sellodex2026', role: 'admin' },
  { username: 'ditto', password: 'sellodex2026', role: 'admin' },
]

export function authenticateAdmin(username: string, password: string): AdminSession | null {
  const normalized = username.trim().toLowerCase()
  const match = ADMIN_ACCOUNTS.find(
    (account) => account.username === normalized && account.password === password
  )
  if (!match) return null
  return { username: match.username, role: match.role }
}

export function isSuperAdmin(session: AdminSession | null | undefined): boolean {
  return session?.role === 'super'
}

export const ADMIN_SESSION_STORAGE_KEY = 'adminSession'

export function loadAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AdminSession
    if (!parsed?.username || (parsed.role !== 'super' && parsed.role !== 'admin')) return null
    return parsed
  } catch {
    return null
  }
}

export function saveAdminSession(session: AdminSession | null) {
  if (typeof window === 'undefined') return
  if (!session) {
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
    localStorage.removeItem('isAdmin')
    return
  }
  localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session))
  localStorage.setItem('isAdmin', 'true')
}
