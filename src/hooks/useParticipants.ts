import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  loadCachedSponsorBanners,
  preloadSponsorBannerImages,
  saveCachedSponsorBanners,
} from '@/app/utils/sponsorBannersCache'
import {
  DEFAULT_ROULETTE_CODE,
  encodeIpForRoulette,
  extractBaseIp,
  extractRouletteCodeFromIp,
  sanitizeRouletteCode,
} from '@/app/utils/rouletteCode'

export interface Participant { id: string; username: string; team: 'blue' | 'yellow' | 'red'; status: 'active' | 'winner' | 'discarded'; ip_address?: string }
export interface BannedUser {
  id: string
  ip_address: string
  username: string
  expires_at: string
  banned_by?: string | null
  created_at?: string
}
export interface RecentWinner { id: string; username: string; ip_address: string; won_at: string }
export interface Sponsor { id: string; name: string; url: string; image_url: string; order_index: number }
export interface Banner { id: string; image_url: string; link_url?: string }

export function useParticipants(activeRouletteCode: string = DEFAULT_ROULETTE_CODE) {
  const rouletteCode = sanitizeRouletteCode(activeRouletteCode)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [banners, setBanners] = useState<Banner[]>(() => loadCachedSponsorBanners())
  const [loading, setLoading] = useState(true)

  const [spectatorView, setSpectatorView] = useState<'main' | 'roulette'>('main')
  const [incomingSpin, setIncomingSpin] = useState<{ rotation: number, winnerId: string, localReceivedAt: number } | null>(null)
  
  const [rouletteConfig, setRouletteConfig] = useState({ penaltyMonths: 2, penaltyPercent: 70 })
  const channelRef = useRef<any>(null)

  const fetchBanners = async () => {
    try {
      const { data } = await supabase
        .from('sponsor_banners')
        .select('id, image_url, link_url')
        .order('created_at', { ascending: true })
      if (data?.length) {
        const next = data as Banner[]
        setBanners(next)
        saveCachedSponsorBanners(next)
        preloadSponsorBannerImages(next)
      }
    } catch (error) {
      console.error('Error cargando banners:', error)
    }
  }

  const fetchData = async () => {
    try {
      const [
        { data: pData },
        { data: bData },
        { data: sData },
        { data: banData },
        { data: rwData },
      ] = await Promise.all([
        supabase.from('participants').select('*').order('created_at', { ascending: true }),
        supabase.from('banned_ips').select('*').order('created_at', { ascending: false }),
        supabase.from('sponsors').select('*').order('order_index', { ascending: true }),
        supabase.from('sponsor_banners').select('id, image_url, link_url').order('created_at', { ascending: true }),
        supabase.from('recent_winners').select('*').order('won_at', { ascending: false }),
      ])

      if (pData) {
        const filtered = (pData as Participant[]).filter(
          (p) => extractRouletteCodeFromIp(p.ip_address) === rouletteCode
        )
        setParticipants(filtered)
      }

      if (bData) {
        const filtered = (bData as BannedUser[]).filter(
          (b) => extractRouletteCodeFromIp(b.ip_address) === rouletteCode
        )
        setBannedUsers(filtered)
      }

      if (sData) setSponsors(sData as Sponsor[])

      if (banData?.length) {
        const next = banData as Banner[]
        setBanners(next)
        saveCachedSponsorBanners(next)
        preloadSponsorBannerImages(next)
      }

      if (rwData) {
        const filtered = (rwData as RecentWinner[]).filter(
          (w) => extractRouletteCodeFromIp(w.ip_address) === rouletteCode
        )
        setRecentWinners(filtered)
      }
    } catch (error) { console.error('Error cargando:', error) } finally { setLoading(false) }
  }

  useEffect(() => {
    const cached = loadCachedSponsorBanners()
    if (cached.length > 0) preloadSponsorBannerImages(cached)
    void fetchBanners()
    fetchData()
    const dbChannel = supabase.channel('public:db_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banned_ips' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recent_winners' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsor_banners' }, () => fetchBanners())
      .subscribe()

    const syncChannel = supabase.channel(`roulette_sync_${rouletteCode}`, { config: { broadcast: { self: false } } })
    
    syncChannel.on('broadcast', { event: 'set_view' }, (payload) => {
      setSpectatorView(payload.payload.view)
      if (payload.payload.config) setRouletteConfig(payload.payload.config)
    })
    
    syncChannel.on('broadcast', { event: 'spin' }, (payload) => {
      setIncomingSpin({ rotation: payload.payload.rotation, winnerId: payload.payload.winnerId, localReceivedAt: Date.now() })
    })
    
    syncChannel.subscribe()
    channelRef.current = syncChannel

    return () => { 
      supabase.removeChannel(dbChannel)
      supabase.removeChannel(syncChannel)
    }
  }, [rouletteCode])

  const broadcastView = async (view: 'main' | 'roulette', config?: any) => {
    if (channelRef.current) await channelRef.current.send({ type: 'broadcast', event: 'set_view', payload: { view, config } })
  }

  const broadcastSpin = async (rotation: number, winnerId: string) => {
    if (channelRef.current) await channelRef.current.send({ type: 'broadcast', event: 'spin', payload: { rotation, winnerId } })
  }

  const addParticipant = async (username: string, team: string, ip: string, isAdminBypass: boolean = false) => {
    if (!isAdminBypass) {
      const now = new Date()
      const { data: bannedIps } = await supabase.from('banned_ips').select('expires_at, ip_address')
      if (
        bannedIps &&
        bannedIps.some((ban) => {
          const sameRoulette = extractRouletteCodeFromIp(ban.ip_address) === rouletteCode
          const sameBaseIp = extractBaseIp(ban.ip_address) === ip
          return sameRoulette && sameBaseIp && new Date(ban.expires_at) > now
        })
      ) {
        await new Promise(resolve => setTimeout(resolve, 800))
        return
      }
      const { data: existingIp } = await supabase.from('participants').select('ip_address')
      if (
        existingIp &&
        existingIp.some((row) => {
          const sameRoulette = extractRouletteCodeFromIp(row.ip_address) === rouletteCode
          const sameBaseIp = extractBaseIp(row.ip_address) === ip
          return sameRoulette && sameBaseIp
        })
      ) {
        throw new Error('Solo se permite un registro por persona.')
      }
    }
    const rawIp = isAdminBypass ? `admin-bypass-${Date.now()}` : ip
    const finalIp = encodeIpForRoulette(rawIp, rouletteCode)
    const { error } = await supabase.from('participants').insert([{ username, team, status: 'active', ip_address: finalIp }])
    if (error) { if (error.code === '23505') throw new Error('Usuario ya registrado.'); throw error }
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

  const banUser = async (id: string, durationInDays: number, bannedBy?: string) => {
    const user = participants.find(p => p.id === id)
    if (!user || !user.ip_address) return
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + durationInDays)
    const payload: Record<string, string> = {
      ip_address: user.ip_address,
      username: user.username,
      expires_at: expirationDate.toISOString(),
    }
    if (bannedBy?.trim()) payload.banned_by = bannedBy.trim().toLowerCase()

    const { error } = await supabase.from('banned_ips').insert([payload])
    if (error) {
      console.error('Error al banear:', error)
      throw new Error('No se pudo banear al usuario. Verifica la columna banned_by en Supabase.')
    }
    await deleteParticipant(id)
  }

  const unbanUser = async (id: string) => { await supabase.from('banned_ips').delete().eq('id', id); await fetchData() }
  const resetGame = async () => {
    if (participants.length === 0) return
    await supabase
      .from('participants')
      .update({ status: 'active' })
      .in('id', participants.map((p) => p.id))
    await fetchData()
  }
  const clearAll = async () => {
    if (participants.length === 0) return
    await supabase.from('participants').delete().in('id', participants.map((p) => p.id))
    await fetchData()
  }

  // NUEVAS FUNCIONES PARA GANADORES RECIENTES
  const removeRecentWinner = async (id: string) => { await supabase.from('recent_winners').delete().eq('id', id); await fetchData() }
  const removeMultipleRecentWinners = async (ids: string[]) => { await supabase.from('recent_winners').delete().in('id', ids); await fetchData() }

  const addSponsor = async (rawUrl: string, customImageUrl?: string, customName?: string) => {
    let username = customName?.trim().replace('@', '') || rawUrl.trim().replace('@', '')
    const match = rawUrl.match(/(?:instagram\.com\/)([^/?]+)/i)
    if (match && match[1]) username = match[1]
    if (!username) username = 'patrocinador'
    const finalUrl = rawUrl
      ? rawUrl.includes('instagram.com')
        ? rawUrl
        : `https://instagram.com/${username}`
      : `https://instagram.com/${username}`
    const image_url = customImageUrl || `https://unavatar.io/instagram/${username}`
    const nextOrder = sponsors.length > 0 ? Math.max(...sponsors.map(s => s.order_index || 0)) + 1 : 0
    await supabase.from('sponsors').insert([{ name: username, url: finalUrl, image_url, order_index: nextOrder }]); await fetchData()
  }

  const deleteSponsor = async (id: string) => { await supabase.from('sponsors').delete().eq('id', id); await fetchData() }
  const deleteMultipleSponsors = async (ids: string[]) => { await supabase.from('sponsors').delete().in('id', ids); await fetchData() }
  const updateSponsorsOrder = async (reorderedList: Sponsor[]) => { setSponsors(reorderedList); const updates = reorderedList.map((s, idx) => ({ id: s.id, name: s.name, url: s.url, image_url: s.image_url, order_index: idx })); await supabase.from('sponsors').upsert(updates) }
  const updateSponsorDetails = async (id: string, image_url: string, url: string) => { await supabase.from('sponsors').update({ image_url, url }).eq('id', id); await fetchData() }

  const addBanner = async (image_url: string, link_url: string = '') => { await supabase.from('sponsor_banners').insert([{ image_url, link_url }]); await fetchData() }
  const updateBanner = async (id: string, image_url: string, link_url: string = '') => { await supabase.from('sponsor_banners').update({ image_url, link_url }).eq('id', id); await fetchData(); }
  const deleteBanner = async (id: string) => { await supabase.from('sponsor_banners').delete().eq('id', id); await fetchData() }

  const deleteRouletteData = async (targetRouletteCode: string) => {
    const targetCode = sanitizeRouletteCode(targetRouletteCode)
    if (targetCode === DEFAULT_ROULETTE_CODE) return

    const { data: participantRows } = await supabase.from('participants').select('id, ip_address')
    const participantIds =
      participantRows
        ?.filter((row) => extractRouletteCodeFromIp(row.ip_address) === targetCode)
        .map((row) => row.id) ?? []
    if (participantIds.length > 0) {
      await supabase.from('participants').delete().in('id', participantIds)
    }

    const { data: bannedRows } = await supabase.from('banned_ips').select('id, ip_address')
    const bannedIds =
      bannedRows
        ?.filter((row) => extractRouletteCodeFromIp(row.ip_address) === targetCode)
        .map((row) => row.id) ?? []
    if (bannedIds.length > 0) {
      await supabase.from('banned_ips').delete().in('id', bannedIds)
    }

    const { data: winnerRows } = await supabase.from('recent_winners').select('id, ip_address')
    const winnerIds =
      winnerRows
        ?.filter((row) => extractRouletteCodeFromIp(row.ip_address) === targetCode)
        .map((row) => row.id) ?? []
    if (winnerIds.length > 0) {
      await supabase.from('recent_winners').delete().in('id', winnerIds)
    }

    await fetchData()
  }

  return {
    participants, bannedUsers, recentWinners, sponsors, banners, loading,
    addParticipant, deleteParticipant, deleteMultiple, updateStatus,
    banUser, unbanUser, resetGame, clearAll, 
    removeRecentWinner, removeMultipleRecentWinners, // Exportamos las funciones
    addSponsor, deleteSponsor, deleteMultipleSponsors, updateSponsorsOrder, updateSponsorDetails,
    addBanner, updateBanner, deleteBanner,
    deleteRouletteData,
    spectatorView, incomingSpin, broadcastView, broadcastSpin, rouletteConfig
  }
}