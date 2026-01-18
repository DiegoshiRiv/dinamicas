import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface Participant {
  id: string
  username: string
  team: 'blue' | 'yellow' | 'red'
  status: 'active' | 'winner' | 'discarded'
}

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setParticipants(data as Participant[])
    } catch (error) {
      console.error('Error cargando:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 1. Carga inicial
    fetchParticipants()

    // 2. Suscripción a cambios (REALTIME)
    // Escucha cualquier cambio (INSERT, UPDATE, DELETE) en la tabla 'participants'
    const channel = supabase
      .channel('public:participants')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
        },
        (payload) => {
          console.log('Cambio detectado:', payload)
          // Al detectar cambio, recargamos la lista completa
          fetchParticipants()
        }
      )
      .subscribe()

    // Limpieza al salir
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Acciones
  const addParticipant = async (username: string, team: string) => {
    const { error } = await supabase.from('participants').insert([{ 
      username, 
      team, 
      status: 'active' 
    }])
    if (error) {
      if (error.code === '23505') throw new Error('El usuario ya está registrado')
      throw error
    }
  }

  const deleteParticipant = async (id: string) => {
    await supabase.from('participants').delete().eq('id', id)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('participants').update({ status }).eq('id', id)
  }

  // NUEVA FUNCIÓN: Reiniciar Juego
  // Pone a TODOS los participantes (ganadores o descartados) de nuevo como 'active'
  const resetGame = async () => {
    const { error } = await supabase
      .from('participants')
      .update({ status: 'active' })
      .neq('status', 'active') // Solo actualiza los que no estén activos ya
    
    if (error) console.error('Error al reiniciar juego:', error)
  }

  const clearAll = async () => {
    const { error } = await supabase.rpc('truncate_participants')
    if (error) console.error('Error al limpiar:', error)
  }

  return {
    participants,
    loading,
    addParticipant,
    deleteParticipant,
    updateStatus,
    resetGame, // Exportamos la nueva función
    clearAll
  }
}