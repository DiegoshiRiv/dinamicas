import skarmoryShinyHero from '@/assets/pokemon gif/Mega Skarmory shiny.gif'
import { CALENDAR_GIFS } from '@/app/utils/driveGifs'
import megaSkarmoryPng from '@/assets/cabeza pokemon/Mega-Skarmory_icono_LPZA.png'
import houndoomPng from '@/assets/cabeza pokemon/092_houndoom.png'
import pasePremiumImg from '@/assets/objetos del juego/pase_premium.png'
import { formatClockLabel, formatTimeRangeLabel } from '@/app/utils/formatTime'

/** Día de Supermegaincursiones de Skarmory — junio 2026. */
export const SKARMORY_SUPERMEGA_HOURS = {
  event: formatTimeRangeLabel(14, 0, 17, 0),
} as const

export const SKARMORY_SUPERMEGA_SCHEDULE =
  `Sábado 27 de junio de 2026 · ${SKARMORY_SUPERMEGA_HOURS.event}`

export const SKARMORY_SUPERMEGA_IMAGES = {
  mega: CALENDAR_GIFS.megaSkarmory,
  shiny: skarmoryShinyHero,
  megaIcon: megaSkarmoryPng,
  houndoom: houndoomPng,
  premiumPass: pasePremiumImg,
} as const

export const SKARMORY_DEBUT_INTRO =
  '¡El siguiente Pokémon hará su debut en las super mega incursiones!'

export const SKARMORY_SHINY_FOOTNOTE =
  'Con un poco de suerte, ¡podrán encontrarse con un Skarmory shiny!'

export const SKARMORY_REMOTE_PASS_WINDOW =
  `El límite de pases de incursión remota aumenta a 20 desde el viernes 26 de junio, a las ${formatClockLabel(19, 0)}, hasta el sábado 27 de junio de 2026, a las ${formatClockLabel(22, 0)} (hora local).`

export const SKARMORY_TEMPORAL_RESEARCH_INTRO =
  '¡Los Entrenadores tendrán disponible una Investigación Temporal durante el evento! Completen las tareas de la investigación para ganar un Pase de Combate Prémium y un encuentro con Houndoom.'

export const SKARMORY_TEMPORAL_RESEARCH_NOTE =
  'La Investigación Temporal caduca. Deberán completar las tareas asociadas y reclamar sus recompensas antes de que termine.'

export const SKARMORY_TEMPORAL_RESEARCH_REWARDS = [
  { label: 'Pase de Combate Prémium', icon: pasePremiumImg },
  { label: 'Houndoom', icon: houndoomPng },
] as const
