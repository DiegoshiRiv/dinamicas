import superBallImg from '@/assets/objetos del juego/Super_Ball_GO.png'
import ultraBallImg from '@/assets/objetos del juego/Ultra_Ball_GO.png'
import pinapImg from '@/assets/objetos del juego/baya_pinia.png'
import stardustImg from '@/assets/objetos del juego/Pokemon-Go-Stardust.png'
import { CALENDAR_GIFS } from '@/app/utils/driveGifs'
import { CD_SOBBLE_HOURS } from '@/app/utils/formatTime'

const SOBBLE_IMG = 'https://img.pokemondb.net/sprites/home/normal/sobble.png'
const INTELEON_HEAD = 'https://img.pokemondb.net/sprites/home/normal/inteleon.png'

export { SOBBLE_IMG, INTELEON_HEAD }

/** Día de la Comunidad Sobble — julio 2026. */
export const SOBBLE_CD_IV = {
  image: CALENDAR_GIFS.sobble,
  imageShiny: CALENDAR_GIFS.sobbleShiny,
}

export const SOBBLE_FIELD_RESEARCH_INTRO =
  '¡Habrá una investigación de campo con la temática del Día de la Comunidad de julio! Captura Sobble para conseguir Polvos Estrella, Ultrabolas, encuentros adicionales con Sobble y más. Incluso podrías encontrar una investigación que culmina con Sobble con fondo especial… ¡con un poco de suerte!'

export type SobbleFieldResearchReward = {
  label: string
  icon?: string
  sobbleEncounter?: boolean
  specialBackground?: boolean
}

export const SOBBLE_FIELD_RESEARCH_STANDARD = {
  task: 'Capturar 3 Sobble',
  rewards: [
    { label: 'Sobble', icon: CALENDAR_GIFS.sobble, sobbleEncounter: true },
    { label: 'Superball ×5', icon: superBallImg },
    { label: 'Ultraball ×2', icon: ultraBallImg },
    { label: 'Baya Pinia ×2', icon: pinapImg },
    { label: 'Polvo estelar ×500', icon: stardustImg },
  ] satisfies SobbleFieldResearchReward[],
}

export const SOBBLE_FIELD_RESEARCH_SPECIAL_BG = [
  { task: 'Capturar 5 Pokémon en un grupo', reward: 'Sobble con fondo especial' },
  { task: 'Capturar 50 Pokémon', reward: 'Sobble con fondo especial' },
]

export type SobbleSpecialBgSourceId =
  | 'wild'
  | 'fieldResearch'
  | 'lureModule'

export const SOBBLE_SPECIAL_BACKGROUND_SOURCES: {
  id: SobbleSpecialBgSourceId
  label: string
  detail: string
}[] = [
  { id: 'wild', label: 'Salvaje', detail: 'Encuentros en el mapa durante el CD' },
  { id: 'fieldResearch', label: 'Investigación de campo', detail: 'Tareas rotativas del evento' },
  { id: 'lureModule', label: 'Módulos señuelo', detail: 'Atraen Sobble con fondo especial' },
]

export const SOBBLE_SNAPSHOT_INTRO =
  '¡Toma instantáneas durante el Día de la Comunidad si quieres llevarte una sorpresa! Puedes conseguir los 5 encuentros sorpresa de forma consecutiva tan pronto como empiece el evento.'

export const SOBBLE_SNAPSHOT_STEPS = [
  'Toma una foto en modo Instantánea (Snapshot) a cualquier Pokémon de tu almacenamiento.',
  'Sal de la cámara y verás la animación del Pokémon del día «colándose» en tu foto (photobomb).',
  'Regresa al mapa: el Pokémon aparecerá salvaje a tu lado listo para capturarlo.',
  'Tras capturarlo (o si huye), vuelve a abrir la cámara y repite el proceso.',
  'Puedes hacer los 5 encuentros seguidos en menos de 5 minutos.',
]

export const SOBBLE_SNAPSHOT_TIPS = [
  `Hazlos entre las ${CD_SOBBLE_HOURS.event} (hora local). Fuera de ese horario solo cuenta el encuentro diario normal.`,
  'Un encuentro por sesión de fotos: toma una foto, sal al mapa, captura al Pokémon y vuelve a entrar a la cámara para la siguiente.',
]

/** Inteleon — resumen para el modal del CD. */
export const INTELEON_INFO = {
  image: CALENDAR_GIFS.inteleon,
  number: 818,
  types: ['Agua'] as const,
  communityDayMove: {
    name: 'Hidrocañón',
    type: 'Agua',
    intro:
      'Evoluciona un Drizzile (la evolución de Sobble) durante el evento o hasta cuatro horas después de que termine para conseguir un Inteleon que conozca el ataque cargado Hidrocañón.',
  },
  permanentMove: {
    name: 'Disparo Certero',
    type: 'Lucha',
    intro:
      'Del evento en adelante, Inteleon podrá aprender Disparo Certero. Combates de Entrenador: 65 de daño y posibilidad de aumentar el ataque en dos tramos. Gimnasios e incursiones: 100 de daño.',
  },
  evolution: {
    fromName: 'Drizzile',
    toName: 'Inteleon',
    fromImage: CALENDAR_GIFS.drizzile,
    candyCost: 100,
    description:
      'Evoluciona un Drizzile a Inteleon durante el evento (o hasta 4 h después) para que aprenda Hidrocañón automáticamente.',
  },
}
