import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface Pokemon { species: string; state: string; regional: string; cp: string; fast: string; fastType: string; charge1: string; charge1Type: string; charge2: string; charge2Type: string; }
export interface Tournament { id: string; name: string; status: 'open' | 'active' | 'finished'; current_round: number; league: 'super' | 'ultra' | 'master'; }
export interface TournamentPlayer { id: string; tournament_id: string; player_name: string; avatar_dex?: string; team: Pokemon[]; }
export interface TournamentMatch { id: string; tournament_id: string; round: number; player1_id: string; player2_id: string | null; winner_id: string | null; }

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [players, setPlayers] = useState<TournamentPlayer[]>([])
  const [matches, setMatches] = useState<TournamentMatch[]>([])

  const fetchData = async () => {
    const [t, p, m] = await Promise.all([
      supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
      supabase.from('tournament_players').select('*'),
      supabase.from('tournament_matches').select('*')
    ])
    if (t.data) setTournaments(t.data as Tournament[])
    if (p.data) setPlayers(p.data as TournamentPlayer[])
    if (m.data) setMatches(m.data as TournamentMatch[])
  }

  useEffect(() => {
    fetchData()
    const channel = supabase.channel('tournaments_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_players' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_matches' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const createTournament = async (name: string, league: 'super' | 'ultra' | 'master') => { 
    await supabase.from('tournaments').insert([{ name, league }]); 
    await fetchData(); 
  }
  
  const updateTournamentStatus = async (id: string, status: string, round?: number) => { 
    await supabase.from('tournaments').update(round ? { status, current_round: round } : { status }).eq('id', id); await fetchData(); 
  }
  
  const deleteTournament = async (id: string) => { await supabase.from('tournaments').delete().eq('id', id); await fetchData(); }
  
  const registerPlayer = async (tournament_id: string, player_name: string, avatar_dex: string, team: Pokemon[]) => {
    const { data, error } = await supabase
      .from('tournament_players')
      .insert([{ tournament_id, player_name, avatar_dex, team }])
      .select('*')
      .single()
    if (error) throw error
    await fetchData()
    return data as TournamentPlayer
  }

  const generateRound = async (tournament_id: string, round: number) => {
    let eligiblePlayers = [];
    
    if (round === 1) {
      eligiblePlayers = players.filter(p => p.tournament_id === tournament_id);
    } else {
      const prevMatches = matches.filter(m => m.tournament_id === tournament_id && m.round === round - 1);
      
      if (prevMatches.some(m => !m.winner_id)) {
        return { error: "Todavía hay combates sin ganador en la ronda actual. Confirma todos los resultados antes de avanzar." };
      }

      const winnerIds = prevMatches.map(m => m.winner_id).filter(id => id !== null);
      eligiblePlayers = players.filter(p => winnerIds.includes(p.id));

      if (eligiblePlayers.length <= 1) {
        await updateTournamentStatus(tournament_id, 'finished');
        return { champion: true, message: "¡El torneo ha terminado! Ya tenemos a un campeón definitivo." };
      }
    }

    const tPlayers = eligiblePlayers.sort(() => 0.5 - Math.random())
    const newMatches = []
    
    for (let i = 0; i < tPlayers.length; i += 2) {
      newMatches.push({
        tournament_id, 
        round, 
        player1_id: tPlayers[i].id, 
        player2_id: tPlayers[i + 1] ? tPlayers[i + 1].id : null, 
        winner_id: tPlayers[i + 1] ? null : tPlayers[i].id
      })
    }
    
    await supabase.from('tournament_matches').insert(newMatches)
    await updateTournamentStatus(tournament_id, 'active', round)
    return { success: true };
  }

  const setWinner = async (match_id: string, winner_id: string) => {
    await supabase.from('tournament_matches').update({ winner_id }).eq('id', match_id); await fetchData();
  }

  return { tournaments, players, matches, createTournament, updateTournamentStatus, deleteTournament, registerPlayer, generateRound, setWinner }
}