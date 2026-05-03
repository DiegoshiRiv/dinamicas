import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface FriendProfile {
  id: string;
  username: string;
  game_codes: Record<string, string>;
  social_ig?: string;
  social_x?: string;
  social_discord?: string;
  created_at: string;
}

export function useFriends() {
  const [friends, setFriends] = useState<FriendProfile[]>([])

  const fetchFriends = async () => {
    const { data } = await supabase.from('friend_board').select('*').order('created_at', { ascending: false })
    if (data) setFriends(data)
  }

  useEffect(() => {
    fetchFriends()
    const channel = supabase.channel('friends_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_board' }, () => fetchFriends())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const addFriendProfile = async (profile: Omit<FriendProfile, 'id' | 'created_at'>) => {
    await supabase.from('friend_board').insert([profile])
    await fetchFriends()
  }

  const deleteFriendProfile = async (id: string) => {
    await supabase.from('friend_board').delete().eq('id', id)
    await fetchFriends()
  }

  return { friends, addFriendProfile, deleteFriendProfile }
}