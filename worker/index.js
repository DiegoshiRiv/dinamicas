export class RegistroDO {
    constructor(state, env) {
      this.state = state
      this.env = env
      this.registrations = []
    }
  
    async fetch(request) {
      const url = new URL(request.url)
  
      if (request.method === 'GET' && url.pathname === '/registrations') {
        return new Response(JSON.stringify(this.registrations), {
          headers: { 'Content-Type': 'application/json' },
        })
      }
  
      if (request.method === 'POST' && url.pathname === '/registrations') {
        const data = await request.json()
        this.registrations.push(data)
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }
  
      return new Response('Not found', { status: 404 })
    }
  }
  
  export default {
    async fetch(request, env) {
      const url = new URL(request.url)
      if (url.pathname.startsWith('/registrations')) {
        const id = env.REGISTRO_DO.idFromName('main')
        const obj = env.REGISTRO_DO.get(id)
        return obj.fetch(request)
      }
      return new Response('Hello from Worker')
    },
    RegistroDO,
  }
  