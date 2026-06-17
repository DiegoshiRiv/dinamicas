import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type NavAvailability = {
  polls: boolean
  tournaments: boolean
  ready: boolean
}

export function useNavAvailability(): NavAvailability {
  const [state, setState] = useState<NavAvailability>({
    polls: false,
    tournaments: false,
    ready: false,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [pollsRes, tournamentsRes] = await Promise.all([
          supabase.from('polls').select('id').eq('is_active', true).limit(1),
          supabase
            .from('tournaments')
            .select('id')
            .in('status', ['open', 'active'])
            .limit(1),
        ])

        if (cancelled) return
        setState({
          polls: (pollsRes.data?.length ?? 0) > 0,
          tournaments: (tournamentsRes.data?.length ?? 0) > 0,
          ready: true,
        })
      } catch {
        if (!cancelled) setState((prev) => ({ ...prev, ready: true }))
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
