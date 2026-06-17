import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface Poll { id: string; question: string; options: string[]; is_active: boolean; created_at: string; }
export interface PollVote { id: string; poll_id: string; option_index: number; ip_address: string; }

export function usePolls(enabled = true) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [votes, setVotes] = useState<PollVote[]>([])

  const fetchData = useCallback(async () => {
    const { data: pData } = await supabase.from('polls').select('*').order('created_at', { ascending: false })
    if (pData) setPolls(pData as Poll[])
    const { data: vData } = await supabase.from('poll_votes').select('*')
    if (vData) setVotes(vData as PollVote[])
  }, [])

  useEffect(() => {
    if (!enabled) return

    void fetchData()
    const channel = supabase.channel('polls_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, () => {
        void fetchData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => {
        void fetchData()
      })
      .subscribe()

    const fallbackInterval = window.setInterval(() => {
      void fetchData()
    }, 15000)

    return () => {
      window.clearInterval(fallbackInterval)
      void supabase.removeChannel(channel)
    }
  }, [enabled, fetchData])

  const createPoll = async (question: string, options: string[]) => {
    await supabase.from('polls').insert([{ question, options }])
  }

  const closePoll = async (id: string) => {
    await supabase.from('polls').update({ is_active: false }).eq('id', id)
  }

  const deletePoll = async (id: string) => {
    await supabase.from('polls').delete().eq('id', id)
  }

  const castVote = async (poll_id: string, option_index: number, ip: string) => {
    const { error } = await supabase.from('poll_votes').insert([{ poll_id, option_index, ip_address: ip }])
    if (error) throw new Error('Ya has votado en esta encuesta.')
    // Refleja el voto al instante en este cliente, incluso antes
    // de que llegue el evento realtime.
    setVotes((prev) => [...prev, { id: `local-${Date.now()}`, poll_id, option_index, ip_address: ip }])
    void fetchData()
  }

  return { polls, votes, createPoll, closePoll, deletePoll, castVote }
}