import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface CommunityEvent {
  id: string
  title: string
  description: string
  pokemon_image_url: string
  starts_at: string
  ends_at: string
  has_stamp: boolean
  location_name: string
  location_maps_url: string
  location_lat: number | null
  location_lng: number | null
  wild_iv_cp: number | null
  research_iv_cp: number | null
  special_research_tasks: string[]
  created_at: string
}

export type CommunityEventInput = Omit<CommunityEvent, 'id' | 'created_at'>

const DEFAULT_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=20.680624,-103.340587'

export function useEvents() {
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase
      .from('community_events')
      .select('*')
      .order('starts_at', { ascending: true })

    if (!error && data) setEvents(data as CommunityEvent[])
    else if (error) console.error('community_events:', error.message)
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchData()
    const channel = supabase
      .channel('community_events_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_events' }, () => {
        void fetchData()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [fetchData])

  const createEvent = async (input: CommunityEventInput) => {
    const { error } = await supabase.from('community_events').insert([input])
    if (error) throw error
    await fetchData()
  }

  const updateEvent = async (id: string, input: Partial<CommunityEventInput>) => {
    const { error } = await supabase.from('community_events').update(input).eq('id', id)
    if (error) throw error
    await fetchData()
  }

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('community_events').delete().eq('id', id)
    if (error) throw error
    await fetchData()
  }

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    defaultMapsUrl: DEFAULT_MAPS_URL,
  }
}
