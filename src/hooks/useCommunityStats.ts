import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  COMMUNITY_STATS_KEY,
  DEFAULT_COMMUNITY_STATS,
  getLiveCommunityStats,
  parseCommunityStats,
  setLiveCommunityStats,
  subscribeCommunityStats,
  type CommunityStats,
} from '@/app/utils/communityStats'
import { eventLog } from '@/app/utils/eventLog'

export function useCommunityStats() {
  const [stats, setStats] = useState<CommunityStats>(() => getLiveCommunityStats())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return subscribeCommunityStats(() => {
      setStats(getLiveCommunityStats())
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    const syncFromRemote = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', COMMUNITY_STATS_KEY)
          .maybeSingle()
        if (cancelled || fetchError) return
        if (!data?.value) return
        setLiveCommunityStats(parseCommunityStats(data.value))
      } catch {
        /* tabla opcional */
      }
    }

    void syncFromRemote()

    const channel = supabase
      .channel('community_stats_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings', filter: `key=eq.${COMMUNITY_STATS_KEY}` },
        (payload) => {
          const value = (payload.new as { value?: unknown } | null)?.value
          if (value == null) return
          setLiveCommunityStats(parseCommunityStats(value))
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [])

  const persist = useCallback(async (next: CommunityStats) => {
    setSaving(true)
    setLiveCommunityStats(next)
    try {
      const { error: upsertError } = await supabase.from('app_settings').upsert({
        key: COMMUNITY_STATS_KEY,
        value: next,
        updated_at: new Date().toISOString(),
      })
      if (upsertError) throw upsertError
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar en el servidor'
      eventLog.warn('community_stats', 'persist failed; quedó en este dispositivo', { message })
      setError('Guardado en este teléfono. Si falla en otros, revisa app_settings en Supabase.')
    } finally {
      setSaving(false)
    }
  }, [])

  const save = useCallback(
    async (next: CommunityStats) => {
      await persist(parseCommunityStats(next))
    },
    [persist],
  )

  const reset = useCallback(async () => {
    await persist({ ...DEFAULT_COMMUNITY_STATS })
  }, [persist])

  return {
    stats,
    saving,
    error,
    save,
    reset,
  }
}
