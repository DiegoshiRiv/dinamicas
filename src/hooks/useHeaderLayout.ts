import { useCallback, useEffect, useState } from 'react'
import {
  createDefaultHeaderLayoutsStore,
  HEADER_LAYOUT_SETTINGS_KEY,
  loadHeaderLayoutsFromStorage,
  parseHeaderLayoutsStore,
  saveHeaderLayoutsToStorage,
  type HeaderLayoutsStore,
} from '@/app/config/headerLayout'
import type { FondoCdId } from '@/app/utils/alternatingFondoCd'
import { supabase } from '@/lib/supabaseClient'

export function useHeaderLayout() {
  const [store, setStore] = useState<HeaderLayoutsStore>(() => loadHeaderLayoutsFromStorage())

  useEffect(() => {
    let cancelled = false

    async function syncFromRemote() {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', HEADER_LAYOUT_SETTINGS_KEY)
          .maybeSingle()

        if (!cancelled && !error && data?.value) {
          const remote = parseHeaderLayoutsStore(data.value)
          setStore(remote)
          saveHeaderLayoutsToStorage(remote)
        }
      } catch {
        // Tabla opcional; se usa localStorage como respaldo.
      }
    }

    const schedule =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(() => {
            if (!cancelled) void syncFromRemote()
          }, { timeout: 3000 })
        : window.setTimeout(() => {
            if (!cancelled) void syncFromRemote()
          }, 1500)

    return () => {
      cancelled = true
      if (typeof schedule === 'number') {
        window.clearTimeout(schedule)
      } else if (typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(schedule)
      }
    }
  }, [])

  const persistStore = useCallback(async (next: HeaderLayoutsStore) => {
    setStore(next)
    saveHeaderLayoutsToStorage(next)

    try {
      await supabase.from('app_settings').upsert({
        key: HEADER_LAYOUT_SETTINGS_KEY,
        value: next,
        updated_at: new Date().toISOString(),
      })
    } catch {
      // Persistencia local suficiente si Supabase no está configurado.
    }
  }, [])

  const resetFondo = useCallback(
    (fondoId: FondoCdId) => {
      const defaults = createDefaultHeaderLayoutsStore()
      void persistStore({
        fondos: {
          ...store.fondos,
          [fondoId]: { ...defaults.fondos[fondoId] },
        },
      })
    },
    [persistStore, store.fondos],
  )

  const resetAll = useCallback(() => {
    void persistStore(createDefaultHeaderLayoutsStore())
  }, [persistStore])

  return {
    store,
    setStore,
    persistStore,
    resetFondo,
    resetAll,
  }
}
