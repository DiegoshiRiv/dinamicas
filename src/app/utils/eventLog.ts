/** Logs de producción ligeros (registro / ruleta / supabase). */
type LogLevel = 'info' | 'warn' | 'error'

function emit(level: LogLevel, scope: string, message: string, data?: Record<string, unknown>) {
  const payload = {
    t: new Date().toISOString(),
    scope,
    message,
    ...data,
  }
  const line = `[dinamicas:${scope}] ${message}`
  if (level === 'error') console.error(line, payload)
  else if (level === 'warn') console.warn(line, payload)
  else console.info(line, payload)
}

export const eventLog = {
  info: (scope: string, message: string, data?: Record<string, unknown>) =>
    emit('info', scope, message, data),
  warn: (scope: string, message: string, data?: Record<string, unknown>) =>
    emit('warn', scope, message, data),
  error: (scope: string, message: string, data?: Record<string, unknown>) =>
    emit('error', scope, message, data),
  timed(scope: string, message: string) {
    const started = performance.now()
    return {
      end: (extra?: Record<string, unknown>) => {
        emit('info', scope, message, {
          ms: Math.round(performance.now() - started),
          ...extra,
        })
      },
      fail: (error: unknown, extra?: Record<string, unknown>) => {
        emit('error', scope, message, {
          ms: Math.round(performance.now() - started),
          error: error instanceof Error ? error.message : String(error),
          ...extra,
        })
      },
    }
  },
}
