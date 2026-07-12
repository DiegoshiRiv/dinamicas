import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  label?: string
}

type State = {
  hasError: boolean
  message: string
}

/**
 * Evita pantalla blanca total: captura errores de render y ofrece recarga.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Error inesperado',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[dinamicas:ErrorBoundary]', this.props.label ?? 'app', error, info.componentStack)
  }

  private handleReload = () => {
    // Limpia SW cache vieja si existe, luego recarga dura.
    const reload = () => window.location.reload()
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(() => {
          if ('caches' in window) {
            return caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
          }
        })
        .finally(reload)
      return
    }
    reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
          background: 'linear-gradient(180deg, #e8f4fc 0%, #ffffff 60%)',
          color: '#0d3b66',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Algo salió mal</h1>
        <p style={{ margin: 0, maxWidth: 360, lineHeight: 1.45, opacity: 0.85 }}>
          La app se recuperó de un error. Pulsa recargar para continuar (útil si acabamos de
          actualizar el sitio).
        </p>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.55, maxWidth: 360, wordBreak: 'break-word' }}>
          {this.state.message}
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            marginTop: 8,
            padding: '14px 28px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
            color: '#fff',
            fontWeight: 800,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Recargar aplicación
        </button>
      </div>
    )
  }
}
