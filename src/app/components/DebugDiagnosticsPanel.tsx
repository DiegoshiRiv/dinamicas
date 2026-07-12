import { useEffect, useState } from 'react'
import { diagnostics, type DiagnosticsSnapshot } from '@/app/utils/runtimeDiagnostics'

function useDebugEnabled() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    return new URLSearchParams(window.location.search).get('debug') === '1'
  })

  useEffect(() => {
    const onPop = () => {
      setEnabled(new URLSearchParams(window.location.search).get('debug') === '1')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return enabled
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ opacity: 0.75 }}>{label}</span>
      <span style={{ fontWeight: 700, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}

function fmtTime(ts: number | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('es-MX', { hour12: false })
}

/** Panel oculto: activa con ?debug=1 */
export function DebugDiagnosticsPanel({
  participantCount,
  realtimeReady,
  syncError,
}: {
  participantCount: number
  realtimeReady: boolean
  syncError?: string | null
}) {
  const enabled = useDebugEnabled()
  const [snap, setSnap] = useState<DiagnosticsSnapshot>(() => diagnostics.get())
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (!enabled) return
    return diagnostics.subscribe(() => setSnap(diagnostics.get()))
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    diagnostics.patch({
      participantCount,
      realtimeStatus: realtimeReady ? 'SUBSCRIBED' : snap.realtimeStatus || 'connecting',
      lastError: syncError ?? snap.lastError,
    })
  }, [enabled, participantCount, realtimeReady, syncError, snap.realtimeStatus, snap.lastError])

  if (!enabled || !open) {
    if (!enabled) return null
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          right: 8,
          bottom: 8,
          zIndex: 99999,
          fontSize: 11,
          fontWeight: 800,
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid #0d3b66',
          background: '#fff',
          color: '#0d3b66',
        }}
      >
        DEBUG
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 8,
        bottom: 8,
        zIndex: 99999,
        width: 280,
        maxWidth: '92vw',
        background: 'rgba(13,59,102,0.95)',
        color: '#fff',
        borderRadius: 12,
        padding: 12,
        fontSize: 11,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        lineHeight: 1.45,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong>Diagnóstico</strong>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', fontWeight: 800 }}
        >
          ✕
        </button>
      </div>
      <div style={{ display: 'grid', gap: 4 }}>
        <Row label="Supabase" value={snap.supabaseConfigured ? 'OK' : 'SIN ENV'} />
        <Row label="Realtime" value={snap.realtimeStatus} />
        <Row label="Participantes" value={String(participantCount)} />
        <Row label="Última sync" value={fmtTime(snap.lastSyncAt)} />
        <Row label="Sync reason" value={snap.lastSyncReason ?? '—'} />
        <Row label="Sync count" value={snap.lastSyncCount != null ? String(snap.lastSyncCount) : '—'} />
        <Row label="Sync ms" value={snap.lastSyncMs != null ? String(snap.lastSyncMs) : '—'} />
        <Row label="Último registro" value={fmtTime(snap.lastRegisterAt)} />
        <Row
          label="Registro OK"
          value={snap.lastRegisterOk == null ? '—' : snap.lastRegisterOk ? 'sí' : 'no'}
        />
        <Row label="Error" value={snap.lastError ?? '—'} />
      </div>
    </div>
  )
}
