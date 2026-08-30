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
  : createClient(supabaseUrl!, supabaseKey!, {
      global: {
        /**
         * Sin límite, una petición en el Wi‑Fi saturado del evento se queda
         * colgada para siempre: el alta no llegaba a reintentar y la carga
         * inicial se quedaba en «Cargando…» sin salida. Al abortar, el error
         * sí entra por los caminos de reintento que ya existen.
         */
        fetch: (input, init) => {
          // Móviles antiguos sin AbortSignal.timeout: se queda como estaba.
          const canTimeout =
            typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
          if (init?.signal || !canTimeout) return fetch(input, init)
          return fetch(input, { ...init, signal: AbortSignal.timeout(12000) })
        },
      },
    })
