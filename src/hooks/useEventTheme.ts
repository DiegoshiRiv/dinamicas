import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  EVENT_THEME_KEY,
  getEventThemeImage,
  getLiveEventTheme,
  parseEventThemeId,
  setLiveEventTheme,
  subscribeEventTheme,
  type EventThemeId,
} from '@/app/utils/eventTheme'
import { eventLog } from '@/app/utils/eventLog'

export function useEventTheme() {
  const [themeId, setThemeId] = useState<EventThemeId>(() => getLiveEventTheme())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return subscribeEventTheme(() => {
      setThemeId(getLiveEventTheme())
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    const syncFromRemote = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', EVENT_THEME_KEY)
          .maybeSingle()
        if (cancelled || fetchError) return
        if (!data?.value) return
        setLiveEventTheme(parseEventThemeId(data.value))
      } catch {
        /* tabla opcional */
      }
    }

    void syncFromRemote()

    const channel = supabase
      .channel('event_theme_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings', filter: `key=eq.${EVENT_THEME_KEY}` },
        (payload) => {
          const value = (payload.new as { value?: unknown } | null)?.value
          if (value == null) return
          setLiveEventTheme(parseEventThemeId(value))
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [])

  const setTheme = useCallback(async (id: EventThemeId) => {
    setSaving(true)
    setLiveEventTheme(id)
    try {
      const { error: upsertError } = await supabase.from('app_settings').upsert({
        key: EVENT_THEME_KEY,
        value: { id },
        updated_at: new Date().toISOString(),
      })
      if (upsertError) throw upsertError
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar en el servidor'
      eventLog.warn('event_theme', 'persist failed; quedó en este dispositivo', { message })
      setError('Guardado en este teléfono. Si falla en otros, revisa app_settings en Supabase.')
    } finally {
      setSaving(false)
    }
  }, [])

  return {
    themeId,
    imageUrl: getEventThemeImage(themeId),
    saving,
    error,
    setTheme,
  }
}
