import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface Participant {
  id: string
  username: string
  team: 'blue' | 'yellow' | 'red'
  status: 'active' | 'winner' | 'discarded'
  ip_address?: string
}

export interface BannedUser {
  id: string
  ip_address: string
  username: string
  expires_at: string
}

export interface RecentWinner {
  id: string
  username: string
  ip_address: string
  won_at: string
}

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const { data: pData } = await supabase.from('participants').select('*').order('created_at', { ascending: true })
      if (pData) setParticipants(pData as Participant[])

      const { data: bData } = await supabase.from('banned_ips').select('*').order('created_at', { ascending: false })
      if (bData) setBannedUsers(bData as BannedUser[])

      // Buscar ganadores de los últimos 14 días
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

      const { data: rwData } = await supabase
        .from('recent_winners')
        .select('*')
        .gte('won_at', twoWeeksAgo.toISOString())
      
      if (rwData) setRecentWinners(rwData as RecentWinner[])

    } catch (error) {
      console.error('Error cargando:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('public:db_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banned_ips' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recent_winners' }, () => fetchData())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const addParticipant = async (username: string, team: string, ip: string, isAdminBypass: boolean = false) => {
    if (!isAdminBypass) {
      const { data: banned } = await supabase.from('banned_ips').select('expires_at').eq('ip_address', ip).single()
      if (banned) {
        if (new Date(banned.expires_at) > new Date()) throw new Error('Estás vetado de las dinámicas.')
        else await supabase.from('banned_ips').delete().eq('ip_address', ip)
      }

      const { data: existingIp } = await supabase.from('participants').select('id').eq('ip_address', ip).single()
      if (existingIp) throw new Error('Solo se permite un registro.')
    }

    const finalIp = isAdminBypass ? `admin-bypass-${Date.now()}` : ip
    const { error } = await supabase.from('participants').insert([{ username, team, status: 'active', ip_address: finalIp }])
    
    if (error) {
      if (error.code === '23505') throw new Error('El usuario ya está registrado')
      throw error
    }
    
    await fetchData() // <-- Actualiza UI al instante
  }

  const deleteParticipant = async (id: string) => {
    await supabase.from('participants').delete().eq('id', id)
    await fetchData() // <-- Actualiza UI al instante
  }

  const deleteMultiple = async (ids: string[]) => {
    await supabase.from('participants').delete().in('id', ids)
    await fetchData() // <-- Actualiza UI al instante
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('participants').update({ status }).eq('id', id)

    if (status === 'winner') {
      const { data: user } = await supabase
        .from('participants')
        .select('username, ip_address')
        .eq('id', id)
        .single()
        
      if (user) {
        const { error } = await supabase.from('recent_winners').insert([{
          username: user.username,
          ip_address: user.ip_address || '',
          won_at: new Date().toISOString()
        }])
        if (error) console.error('Error al guardar ganador:', error.message)
      }
    }
    await fetchData() // <-- Actualiza UI al instante
  }

  const banUser = async (id: string, durationInDays: number) => {
    const user = participants.find(p => p.id === id)
    if (!user || !user.ip_address) return

    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + durationInDays)

    const { error } = await supabase.from('banned_ips').insert([{
      ip_address: user.ip_address,
      username: user.username,
      expires_at: expirationDate.toISOString()
    }])

    if (!error) await deleteParticipant(id)
    // deleteParticipant ya llama a fetchData() por lo que se actualizará aquí
  }

  const unbanUser = async (id: string) => {
    await supabase.from('banned_ips').delete().eq('id', id)
    await fetchData() // <-- Actualiza UI al instante
  }

  const resetGame = async () => {
    const { error } = await supabase.from('participants').update({ status: 'active' }).neq('status', 'active')
    if (error) console.error('Error al reiniciar:', error)
    await fetchData() // <-- Actualiza UI al instante
  }

  const clearAll = async () => {
    const { error } = await supabase.rpc('truncate_participants')
    if (error) console.error('Error al limpiar:', error)
    await fetchData() // <-- Actualiza UI al instante
  }

  return {
    participants,
    bannedUsers,
    recentWinners,
    loading,
    addParticipant,
    deleteParticipant,
    deleteMultiple,
    updateStatus,
    banUser,
    unbanUser,
    resetGame,
    clearAll
  }
}