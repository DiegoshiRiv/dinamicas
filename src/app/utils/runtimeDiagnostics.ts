/** Diagnóstico en vivo para ?debug=1 (sin dependencias). */
export type DiagnosticsSnapshot = {
  updatedAt: number
  supabaseConfigured: boolean
  realtimeStatus: string
  participantCount: number
  lastSyncAt: number | null
  lastSyncReason: string | null
  lastSyncCount: number | null
  lastSyncMs: number | null
  lastRegisterAt: number | null
  lastRegisterOk: boolean | null
  lastError: string | null
}

const state: DiagnosticsSnapshot = {
  updatedAt: Date.now(),
  supabaseConfigured: true,
  realtimeStatus: 'idle',
  participantCount: 0,
  lastSyncAt: null,
  lastSyncReason: null,
  lastSyncCount: null,
  lastSyncMs: null,
  lastRegisterAt: null,
  lastRegisterOk: null,
  lastError: null,
}

const listeners = new Set<() => void>()

function notify() {
  state.updatedAt = Date.now()
  listeners.forEach((l) => l())
}

export const diagnostics = {
  get(): DiagnosticsSnapshot {
    return { ...state }
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  patch(partial: Partial<DiagnosticsSnapshot>) {
    Object.assign(state, partial)
    notify()
  },
}
