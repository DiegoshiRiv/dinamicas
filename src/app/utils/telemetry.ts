/**
 * Punto de enganche para telemetría (Sentry u otro).
 * Hoy solo registra métricas locales; cuando tengas DSN:
 *   VITE_SENTRY_DSN=... y sustituye emit() por Sentry.captureMessage / metrics.
 */
import { diagnostics } from '@/app/utils/runtimeDiagnostics'

type Metric = {
  name: string
  value?: number
  tags?: Record<string, string | number | boolean | undefined>
}

const buffer: Metric[] = []

function emit(metric: Metric) {
  buffer.push({ ...metric, tags: { ...metric.tags, t: Date.now() } })
  if (import.meta.env.DEV) {
    console.debug('[telemetry]', metric.name, metric.value ?? '', metric.tags ?? {})
  }
}

export type ConsistencySample = {
  localCount: number
  serverCount: number
  difference: number
  syncMs: number
  reason: string
}

export const telemetry = {
  registrationDuration(ms: number, ok: boolean) {
    emit({ name: 'registration.duration_ms', value: ms, tags: { ok } })
  },
  syncDuration(ms: number, reason: string, count: number) {
    emit({ name: 'roulette.sync_ms', value: ms, tags: { reason, count } })
  },
  uniqueConflict(kind: 'token' | 'ip' | 'unknown') {
    emit({ name: 'registration.unique_conflict', tags: { kind } })
  },
  /** Tras cada reconciliación: local vs servidor. */
  consistency(sample: ConsistencySample) {
    emit({
      name: 'roulette.consistency',
      value: sample.difference,
      tags: {
        local: sample.localCount,
        server: sample.serverCount,
        difference: sample.difference,
        sync_ms: sample.syncMs,
        reason: sample.reason,
        mismatched: sample.difference !== 0,
      },
    })
    diagnostics.patch({
      lastConsistencyLocal: sample.localCount,
      lastConsistencyServer: sample.serverCount,
      lastConsistencyDiff: sample.difference,
      lastConsistencyMs: sample.syncMs,
      lastConsistencyAt: Date.now(),
      lastConsistencyReason: sample.reason,
    })
    if (sample.difference !== 0) {
      console.info('[dinamicas:consistency]', sample)
    }
  },
  spinReconcile(localCount: number, serverCount: number, syncMs = 0, reason = 'before_spin') {
    this.consistency({
      localCount,
      serverCount,
      difference: Math.abs(serverCount - localCount),
      syncMs,
      reason,
    })
  },
  snapshot() {
    return buffer.slice(-50)
  },
}
