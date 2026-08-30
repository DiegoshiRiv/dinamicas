import { RegistroDO } from './registro_do.js'

export { RegistroDO }

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/registrations')) {
      const id = env.REGISTRO_DO.idFromName('main')
      return env.REGISTRO_DO.get(id).fetch(request)
    }
    return new Response('Hello from Worker')
  },
}
