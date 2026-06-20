import { createClient } from '@supabase/supabase-js'

// Asegúrate de tener estas variables en tu archivo .env en la raíz (junto a package.json)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_REQUEST_TIMEOUT_MS = 12000

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
}

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), SUPABASE_REQUEST_TIMEOUT_MS)

  try {
    return await globalThis.fetch(input, { ...init, signal: controller.signal })
  } finally {
    window.clearTimeout(timeout)
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: fetchWithTimeout,
  },
})
