const REGISTRATIONS_PATH = '/registrations'

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export class RegistroDO {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.registrations = null
  }

  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname !== REGISTRATIONS_PATH) {
      return new Response('No encontrado', { status: 404 })
    }

    const registrations = await this.load()

    if (request.method === 'GET') {
      return json(registrations)
    }

    if (request.method !== 'POST') {
      return new Response('Método no permitido', { status: 405 })
    }

    let data
    try {
      data = await request.json()
    } catch {
      return json({ error: 'Cuerpo inválido' }, 400)
    }

    const username = typeof data?.username === 'string' ? data.username.trim() : ''
    if (!username) {
      return json({ error: 'Falta el nombre de usuario' }, 400)
    }

    const key = username.toLowerCase()
    const existing = registrations.find((r) => r.username.toLowerCase() === key)
    if (existing) {
      // Idempotente: reintentos y doble toque no deben fallar.
      return json(existing, 200)
    }

    const row = {
      id: crypto.randomUUID(),
      username,
      status: 'active',
      registeredAt: new Date().toISOString(),
    }
    registrations.push(row)
    await this.state.storage.put('registrations', registrations)

    return json(row, 201)
  }

  async load() {
    if (this.registrations) return this.registrations
    const stored = await this.state.storage.get('registrations')
    this.registrations = Array.isArray(stored) ? stored : []
    return this.registrations
  }
}
