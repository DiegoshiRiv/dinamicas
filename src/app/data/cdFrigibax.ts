import frigibaxGif from '@/assets/pokemon gif/Frigibax.gif'
import frigibaxShinyGif from '@/assets/pokemon gif/Frigibax_Shiny.gif'
import frigibaxCandyImg from '@/assets/objetos del juego/caramelos de pokemon/0996-frigibax_candy.png'
import frigibaxCandyXlImg from '@/assets/objetos del juego/caramelos de pokemon/0996-frigibax-candyxl.png'
import superBallImg from '@/assets/objetos del juego/Super_Ball_GO.png'
import ultraBallImg from '@/assets/objetos del juego/Ultra_Ball_GO.png'
import pinapImg from '@/assets/objetos del juego/baya_pinia.png'
import stardustImg from '@/assets/objetos del juego/Pokemon-Go-Stardust.png'
import { CD_FRIGIBAX_HOURS } from '@/app/utils/formatTime'

/** Caramelos del Pokémon del CD (carpeta «caramelos de pokemon»). */
export const FRIGIBAX_CANDY = {
  candy: frigibaxCandyImg,
  candyXl: frigibaxCandyXlImg,
} as const

/** Día de la Comunidad Frigibax — junio 2026. */
export const FRIGIBAX_CD_IV = {
  image: frigibaxGif,
  imageShiny: frigibaxShinyGif,
  wildCp: 1410,
  researchCp: 534,
  wildLabel: 'Salvaje (100% IV)',
  researchLabel: 'Investigación de campo (100% IV)',
}

export const FRIGIBAX_FIELD_RESEARCH_INTRO =
  'Habrá investigaciones de campo del CD. Captura Frigibax y gana polvo estelar, Ultraball, más encuentros con Frigibax y más. Con suerte, alguna investigación te dará un Frigibax con fondo especial.'

export type FrigibaxFieldResearchReward = {
  label: string
  icon?: string
  frigibaxEncounter?: boolean
  specialBackground?: boolean
}

export const FRIGIBAX_FIELD_RESEARCH_STANDARD = {
  task: 'Capturar 3 Frigibax',
  rewards: [
    { label: 'Frigibax', icon: frigibaxGif, frigibaxEncounter: true },
    { label: 'Superball ×5', icon: superBallImg },
    { label: 'Ultraball ×2', icon: ultraBallImg },
    { label: 'Baya Pinia ×2', icon: pinapImg },
    { label: 'Polvo estelar ×500', icon: stardustImg },
  ] satisfies FrigibaxFieldResearchReward[],
}

/** Investigaciones que pueden dar Frigibax con fondo especial. */
export const FRIGIBAX_FIELD_RESEARCH_SPECIAL_BG = [
  { task: 'Capturar 5 Pokémon en un grupo', reward: 'Frigibax con fondo especial' },
  { task: 'Capturar 50 Pokémon', reward: 'Frigibax con fondo especial' },
]

export type FrigibaxSpecialBgSourceId =
  | 'wild'
  | 'fieldResearch'
  | 'paidResearch'
  | 'campfireResearch'
  | 'lureModule'

export const FRIGIBAX_SPECIAL_BACKGROUND_SOURCES: {
  id: FrigibaxSpecialBgSourceId
  label: string
  detail: string
}[] = [
  { id: 'wild', label: 'Salvaje', detail: 'Encuentros en el mapa durante el CD' },
  { id: 'fieldResearch', label: 'Investigación de campo', detail: 'Tareas rotativas del evento' },
  { id: 'paidResearch', label: 'Investigación de pago', detail: 'Especial premium del CD' },
  { id: 'campfireResearch', label: 'Registro Campfire', detail: 'Investigación temporal al registrarte' },
  { id: 'lureModule', label: 'Módulos señuelo', detail: 'Atraen Frigibax con fondo especial' },
]

export const FRIGIBAX_SNAPSHOT_INTRO =
  'Durante el Día de la Comunidad puedes conseguir los 5 encuentros sorpresa de forma consecutiva, uno detrás de otro, tan pronto como empiece el evento.'

export const FRIGIBAX_SNAPSHOT_STEPS = [
  'Toma una foto en modo Instantánea (Snapshot) a cualquier Pokémon de tu almacenamiento.',
  'Sal de la cámara y verás la animación del Pokémon del día «colándose» en tu foto (photobomb).',
  'Regresa al mapa: el Pokémon aparecerá salvaje a tu lado listo para capturarlo.',
  'Tras capturarlo (o si huye), vuelve a abrir la cámara y repite el proceso.',
  'Puedes hacer los 5 encuentros seguidos en menos de 5 minutos.',
]

export const FRIGIBAX_SNAPSHOT_TIPS = [
  `Hazlos entre las ${CD_FRIGIBAX_HOURS.event} (hora local). Fuera de ese horario solo cuenta el encuentro diario normal.`,
  'Un encuentro por sesión de fotos: toma una foto, sal al mapa, captura al Pokémon y vuelve a entrar a la cámara para la siguiente.',
]
