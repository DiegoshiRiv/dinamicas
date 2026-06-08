import { dateToDayKey } from '@/app/utils/eventDates'

/** Eventos puntuales de la comunidad GDL (no están en Supabase). */
export interface StaticCommunityEvent {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  locationName: string
  locationMapsUrl: string
  locationDetail?: string
}

export const VIERNES_AMIGOS: StaticCommunityEvent = {
  id: 'viernes-amigos',
  title: 'Viernes de Amigos',
  description:
    'Únete a nuestras reuniones de comunidad: convivir, intercambiar y conectar. Actividades para la comunidad y momentos para conocer gente nueva.',
  date: '2026-05-29',
  startTime: '18:00',
  endTime: '22:00',
  locationName: 'Ubicación de Tiempo Libre',
  locationDetail: 'Próxima quedada: Tiempo libre Game Room',
  locationMapsUrl:
    'https://www.google.com/maps/search/?api=1&query=20.680624,-103.340587',
}

export function isViernesAmigosDay(date: Date): boolean {
  return dateToDayKey(date) === VIERNES_AMIGOS.date
}
