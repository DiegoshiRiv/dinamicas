import megaRaichuBanner from '@/assets/wallpaper/MegaRaichu.png'
import megaRaichuX from '@/assets/Pokemon/mega-raichu-x.png'
import megaRaichuY from '@/assets/Pokemon/mega-raichu-y.png'
import pasePremiumImg from '@/assets/objetos del juego/pase_premium.png'
import { formatClockLabel, formatTimeRangeLabel } from '@/app/utils/formatTime'

const STEELIX_IMG = 'https://img.pokemondb.net/sprites/home/normal/steelix.png'

/** Día de Supermegaincursiones de Raichu — julio 2026. */
export const RAICHU_SUPERMEGA_HOURS = {
  event: formatTimeRangeLabel(14, 0, 17, 0),
} as const

export const RAICHU_SUPERMEGA_SCHEDULE =
  `Sábado 18 de julio de 2026 · ${RAICHU_SUPERMEGA_HOURS.event}`

export const RAICHU_SUPERMEGA_IMAGES = {
  /** Wallpaper del banner principal. */
  banner: megaRaichuBanner,
  mega: megaRaichuX,
  megaY: megaRaichuY,
  megaIcon: megaRaichuBanner,
  premiumPass: pasePremiumImg,
  steelix: STEELIX_IMG,
} as const

export const RAICHU_DEBUT_INTRO =
  '¡Los Pokémon siguientes harán su debut en las supermegaincursiones de Pokémon GO! Mega-Raichu X y Mega-Raichu Y.'

export const RAICHU_SHINY_FOOTNOTE =
  'Con un poco de suerte, ¡podrán encontrarse con un Raichu brillante!'

export const RAICHU_REMOTE_PASS_WINDOW =
  `El límite de pases de incursión remota aumenta a 20 desde el viernes 17 de julio, a las ${formatClockLabel(19, 0)}, hasta el sábado 18 de julio de 2026, a las ${formatClockLabel(22, 0)} (hora local).`

export const RAICHU_TEMPORAL_RESEARCH_INTRO =
  '¡Los Entrenadores tendrán disponible una Investigación Temporal durante el evento! Completen las tareas de la investigación para ganar un Pase de Combate Prémium y un encuentro con Steelix.'

export const RAICHU_TEMPORAL_RESEARCH_NOTE =
  'La Investigación Temporal caduca. Deberán completar las tareas asociadas y reclamar sus recompensas antes de que termine.'

export const RAICHU_TEMPORAL_RESEARCH_REWARDS = [
  { label: 'Pase de Combate Prémium', icon: pasePremiumImg },
  { label: 'Steelix', icon: STEELIX_IMG },
] as const
