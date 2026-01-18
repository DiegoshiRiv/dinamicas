export class RegistroDO {
    registrations: any[] = []
  
    constructor(private state: DurableObjectState) {
      this.state = state
    }
  
    async fetch(request: Request) {
      const url = new URL(request.url)
  
      // Cargar estado guardado si existe (para persistencia)
      await this.loadState()
  
      if (request.method === 'GET' && url.pathname === '/api/registrations') {
        return new Response(JSON.stringify(this.registrations), {
          headers: { 'Content-Type': 'application/json' },
        })
      }
  
      if (request.method === 'POST' && url.pathname === '/api/registrations') {
        try {
          const data = await request.json()
          if (!data.username || !data.team) {
            return new Response('Faltan datos', { status: 400 })
          }
  
          // Validar duplicados
          if (this.registrations.find(r => r.username.toLowerCase() === data.username.toLowerCase())) {
            return new Response('Usuario ya registrado', { status: 409 })
          }
  
          this.registrations.push({
            id: Date.now().toString(),
            username: data.username.trim(),
            team: data.team,
            status: 'active',
            registeredAt: new Date().toISOString(),
          })
  
          // Guardar el estado persistente
          await this.saveState()
  
          return new Response(JSON.stringify(this.registrations), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch {
          return new Response('Error en datos', { status: 400 })
        }
      }
  
      return new Response('No encontrado', { status: 404 })
    }
  
    async loadState() {
      try {
        const stored = await this.state.storage.get<string>('registrations')
        if (stored) {
          this.registrations = JSON.parse(stored)
        }
      } catch {
        this.registrations = []
      }
    }
  
    async saveState() {
      await this.state.storage.put('registrations', JSON.stringify(this.registrations))
    }
  }
  