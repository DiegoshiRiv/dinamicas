import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { diagnostics } from '@/app/utils/runtimeDiagnostics'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
export const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigError =
  !supabaseUrl || !supabaseKey
    ? 'Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
    : null

diagnostics.patch({ supabaseConfigured: !supabaseConfigError })

/**
 * Cliente único. Si faltan env vars no lanzamos en import-time (evita pantalla blanca);
 * las llamadas fallarán con mensaje claro.
 */
export const supabase: SupabaseClient = supabaseConfigError
  ? (new Proxy(
      {},
      {
        get() {
          throw new Error(supabaseConfigError)
        },
      },
    ) as SupabaseClient)
  : createClient(supabaseUrl!, supabaseKey!)
