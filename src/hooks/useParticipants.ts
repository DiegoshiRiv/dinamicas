import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface Participant { id: string; username: string; team: 'blue' | 'yellow' | 'red'; status: 'active' | 'winner' | 'discarded'; ip_address?: string }
export interface BannedUser { id: string; ip_address: string; username: string; expires_at: string }
export interface RecentWinner { id: string; username: string; ip_address: string; won_at: string }
export interface Sponsor { id: string; name: string; url: string; image_url: string; order_index: number }

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const { data: pData } = await supabase.from('participants').select('*').order('created_at', { ascending: true })
      if (pData) setParticipants(pData as Participant[])

      const { data: bData } = await supabase.from('banned_ips').select('*').order('created_at', { ascending: false })
      if (bData) setBannedUsers(bData as BannedUser[])

      const { data: sData } = await supabase.from('sponsors').select('*').order('order_index', { ascending: true })
      if (sData) setSponsors(sData as Sponsor[])

      const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      const { data: rwData } = await supabase.from('recent_winners').select('*').gte('won_at', twoWeeksAgo.toISOString())
      if (rwData) setRecentWinners(rwData as RecentWinner[])
    } catch (error) { console.error('Error cargando:', error) } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchData()
    const channel = supabase.channel('public:db_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banned_ips' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recent_winners' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsors' }, () => fetchData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const addParticipant = async (username: string, team: string, ip: string, isAdminBypass: boolean = false) => {
    if (!isAdminBypass) {
      const now = new Date()

      // 1. Buscamos TODOS los registros de ban para esta IP y este Nombre
      const { data: bannedIps } = await supabase.from('banned_ips').select('expires_at').eq('ip_address', ip)
      const { data: bannedNames } = await supabase.from('banned_ips').select('expires_at').ilike('username', username)

      // 2. Verificamos si AL MENOS UNO sigue activo
      const isBannedIp = bannedIps && bannedIps.some(ban => new Date(ban.expires_at) > now)
      const isBannedName = bannedNames && bannedNames.some(ban => new Date(ban.expires_at) > now)

      // 3. SHADOWBAN DEFINITIVO
      if (isBannedIp || isBannedName) {
        // Simulamos un retraso de red para que parezca que realmente se está registrando
        await new Promise(resolve => setTimeout(resolve, 800))
        return; 
      }

      // 4. Evitamos el doble registro de gente limpia (usamos limit para evitar el mismo error de maybeSingle)
      const { data: existingIp } = await supabase.from('participants').select('id').eq('ip_address', ip).limit(1)
      if (existingIp && existingIp.length > 0) {
        throw new Error('Solo se permite un registro por dispositivo.')
      }
    }

    const finalIp = isAdminBypass ? `admin-bypass-${Date.now()}` : ip
    const { error } = await supabase.from('participants').insert([{ username, team, status: 'active', ip_address: finalIp }])
    if (error) { 
      if (error.code === '23505') throw new Error('Este usuario ya está registrado en la ruleta.')
      throw error 
    }
    await fetchData()
  }

  const deleteParticipant = async (id: string) => { await supabase.from('participants').delete().eq('id', id); await fetchData() }
  const deleteMultiple = async (ids: string[]) => { await supabase.from('participants').delete().in('id', ids); await fetchData() }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('participants').update({ status }).eq('id', id)
    if (status === 'winner') {
      const { data: user } = await supabase.from('participants').select('username, ip_address').eq('id', id).single()
      if (user) await supabase.from('recent_winners').insert([{ username: user.username, ip_address: user.ip_address || '', won_at: new Date().toISOString() }])
    }
    await fetchData()
  }

  const banUser = async (id: string, durationInDays: number) => {
    const user = participants.find(p => p.id === id)
    if (!user || !user.ip_address) return
    const expirationDate = new Date(); expirationDate.setDate(expirationDate.getDate() + durationInDays)
    const { error } = await supabase.from('banned_ips').insert([{ ip_address: user.ip_address, username: user.username, expires_at: expirationDate.toISOString() }])
    if (!error) await deleteParticipant(id)
  }

  const unbanUser = async (id: string) => { await supabase.from('banned_ips').delete().eq('id', id); await fetchData() }
  const resetGame = async () => { await supabase.from('participants').update({ status: 'active' }).neq('status', 'active'); await fetchData() }
  const clearAll = async () => { await supabase.rpc('truncate_participants'); await fetchData() }

  const addSponsor = async (rawUrl: string) => {
    let username = rawUrl.trim().replace('@', '')
    const match = rawUrl.match(/(?:instagram\.com\/)([^/?]+)/i)
    if (match && match[1]) username = match[1]
    
    const finalUrl = rawUrl.includes('instagram.com') ? rawUrl : `https://instagram.com/${username}`
    const image_url = `https://unavatar.io/instagram/${username}`
    const nextOrder = sponsors.length > 0 ? Math.max(...sponsors.map(s => s.order_index || 0)) + 1 : 0

    await supabase.from('sponsors').insert([{ name: username, url: finalUrl, image_url, order_index: nextOrder }])
    await fetchData()
  }

  const deleteSponsor = async (id: string) => { await supabase.from('sponsors').delete().eq('id', id); await fetchData() }
  const deleteMultipleSponsors = async (ids: string[]) => { await supabase.from('sponsors').delete().in('id', ids); await fetchData() }

  const updateSponsorsOrder = async (reorderedList: Sponsor[]) => {
    setSponsors(reorderedList) 
    const updates = reorderedList.map((s, idx) => ({
      id: s.id, name: s.name, url: s.url, image_url: s.image_url, order_index: idx
    }))
    await supabase.from('sponsors').upsert(updates)
  }

  const updateSponsorImage = async (id: string, image_url: string) => {
    await supabase.from('sponsors').update({ image_url }).eq('id', id)
    await fetchData()
  }

  return {
    participants, bannedUsers, recentWinners, sponsors, loading,
    addParticipant, deleteParticipant, deleteMultiple, updateStatus,
    banUser, unbanUser, resetGame, clearAll, 
    addSponsor, deleteSponsor, deleteMultipleSponsors, updateSponsorsOrder, updateSponsorImage
  }
}