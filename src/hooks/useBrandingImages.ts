import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  BRANDING_IMAGES_KEY,
  emptyBrandingImages,
  getLiveBrandingImages,
  parseBrandingImages,
  setLiveBrandingImages,
  subscribeBrandingImages,
  type BrandingImageSlot,
  type BrandingImages,
} from '@/app/utils/brandingImages'
import { setFondoCdOverrides } from '@/app/utils/alternatingFondoCd'
import { eventLog } from '@/app/utils/eventLog'

function applyFondoOverrides(images: BrandingImages) {
  setFondoCdOverrides({
    fondoCD: images.fondoCD || null,
    fondoCD2: images.fondoCD2 || null,
  })
}

export function useBrandingImages() {
  const [images, setImages] = useState<BrandingImages>(() => getLiveBrandingImages())
  const [savingSlot, setSavingSlot] = useState<BrandingImageSlot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    applyFondoOverrides(getLiveBrandingImages())
    return subscribeBrandingImages(() => {
      const next = getLiveBrandingImages()
      setImages(next)
      applyFondoOverrides(next)
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    const syncFromRemote = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', BRANDING_IMAGES_KEY)
          .maybeSingle()
        if (cancelled || fetchError) return
        if (!data?.value) return
        const remote = parseBrandingImages(data.value)
        setLiveBrandingImages(remote)
      } catch {
        /* tabla opcional */
      }
    }

    void syncFromRemote()

    const channel = supabase
      .channel('branding_images_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings', filter: `key=eq.${BRANDING_IMAGES_KEY}` },
        (payload) => {
          const value = (payload.new as { value?: unknown } | null)?.value
          if (value == null) return
          setLiveBrandingImages(parseBrandingImages(value))
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [])

  const persist = useCallback(async (next: BrandingImages) => {
    setLiveBrandingImages(next)
    applyFondoOverrides(next)
    try {
      const { error: upsertError } = await supabase.from('app_settings').upsert({
        key: BRANDING_IMAGES_KEY,
        value: next,
        updated_at: new Date().toISOString(),
      })
      if (upsertError) throw upsertError
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar en el servidor'
      eventLog.warn('branding', 'persist failed; quedó en este dispositivo', { message })
      setError('Guardado en este teléfono. Si falla en otros, revisa app_settings en Supabase.')
    }
  }, [])

  const setSlot = useCallback(
    async (slot: BrandingImageSlot, dataUrl: string | null) => {
      setSavingSlot(slot)
      try {
        const next: BrandingImages = { ...getLiveBrandingImages(), [slot]: dataUrl }
        await persist(next)
      } finally {
        setSavingSlot(null)
      }
    },
    [persist],
  )

  const resetSlot = useCallback(
    async (slot: BrandingImageSlot) => {
      await setSlot(slot, null)
    },
    [setSlot],
  )

  const resetAll = useCallback(async () => {
    setSavingSlot('fondoCD')
    try {
      await persist(emptyBrandingImages())
    } finally {
      setSavingSlot(null)
    }
  }, [persist])

  return {
    images,
    savingSlot,
    error,
    setSlot,
    resetSlot,
    resetAll,
  }
}
