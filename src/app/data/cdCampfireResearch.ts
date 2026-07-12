import { FRIGIBAX_CANDY, FRIGIBAX_CD_IV } from '@/app/data/cdFrigibax'
import starPieceImg from '@/assets/objetos del juego/star-piece-pokemon-go.png'
import luckyEggImg from '@/assets/objetos del juego/Lucky-Eggs.png'
import ultraBallImg from '@/assets/objetos del juego/Ultra_Ball_GO.png'
import lureModuleImg from '@/assets/objetos del juego/cebo.png'
import rareCandyImg from '@/assets/objetos del juego/rare-candy.png'
import premiumPassImg from '@/assets/objetos del juego/pase_premium.png'
import pinapBerryImg from '@/assets/objetos del juego/baya_pinia.png'
import stardustImg from '@/assets/objetos del juego/Pokemon-Go-Stardust.png'
import expImg from '@/assets/objetos del juego/exp.png'

export type CampfireResearchReward = {
  label: string
  icon?: string
  /** Muestra toggle shiny (Frigibax normal / shiny). */
  frigibaxEncounter?: boolean
  specialBackground?: boolean
}

export type CampfireResearchTask = {
  task: string
  rewards: CampfireResearchReward[]
}

export type CampfireResearchPage = {
  title: string
  tasks: CampfireResearchTask[]
  pageComplete: CampfireResearchReward[]
}

const FRIGIBAX_ENCOUNTER: CampfireResearchReward = {
  label: 'Encuentro con Frigibax',
  icon: FRIGIBAX_CD_IV.image,
  frigibaxEncounter: true,
  specialBackground: true,
}

/** Investigación temporal al registrarte en Campfire (Día de la Comunidad Frigibax). */
export const FRIGIBAX_CAMPFIRE_REGISTRATION: {
  intro: string
  pages: CampfireResearchPage[]
} = {
  intro:
    'Al registrarte en Campfire durante el Día de la Comunidad recibes esta investigación temporal en Pokémon GO.',
  pages: [
    {
      title: 'Tareas en grupo',
      tasks: [
        {
          task: 'Captura 10 Pokémon en grupo',
          rewards: [FRIGIBAX_ENCOUNTER],
        },
        {
          task: 'Explora 1 km en grupo',
          rewards: [{ label: '1 Pieza estrella', icon: starPieceImg }],
        },
        {
          task: 'Gira 10 Poképaradas en grupo',
          rewards: [{ label: '1 Huevo suerte', icon: luckyEggImg }],
        },
      ],
      pageComplete: [
        FRIGIBAX_ENCOUNTER,
        { label: '200 caramelos Frigibax', icon: FRIGIBAX_CANDY.candy },
        { label: '30 caramelos Frigibax XL', icon: FRIGIBAX_CANDY.candyXl },
      ],
    },
    {
      title: 'Tareas de captura',
      tasks: [
        {
          task: 'Captura 10 Pokémon',
          rewards: [FRIGIBAX_ENCOUNTER],
        },
        {
          task: 'Captura 20 Pokémon',
          rewards: [{ label: '50 Ultraballs', icon: ultraBallImg }],
        },
        {
          task: 'Captura 30 Pokémon',
          rewards: [{ label: '1 Módulo señuelo', icon: lureModuleImg }],
        },
      ],
      pageComplete: [
        FRIGIBAX_ENCOUNTER,
        { label: '25 caramelos raros', icon: rareCandyImg },
        { label: '1 Pase de batalla premium', icon: premiumPassImg },
      ],
    },
  ],
}

/** Investigación temporal al registrarte en Campfire (Día de Supermegaincursiones de Raichu). */
export const RAICHU_CAMPFIRE_REGISTRATION: {
  intro: string
  pages: CampfireResearchPage[]
} = {
  intro:
    'Al registrarte en Campfire durante el evento recibes esta investigación temporal en Pokémon GO.',
  pages: [
    {
      title: 'Incursiones / Día de incursiones',
      tasks: [
        {
          task: 'Usa 12 bayas para capturar Pokémon',
          rewards: [{ label: '×10 Bayas Pinia', icon: pinapBerryImg }],
        },
        {
          task: 'Gana 2 incursiones',
          rewards: [{ label: '5000 XP', icon: expImg }],
        },
        {
          task: 'Usa 3 ataques cargados supereficaces',
          rewards: [{ label: '1500 polvo estelar', icon: stardustImg }],
        },
      ],
      pageComplete: [{ label: '×1 Pase de Combate Prémium', icon: premiumPassImg }],
    },
  ],
}

/** Investigación temporal al registrarte en Campfire (Día de Supermegaincursiones de Skarmory). */
export const SKARMORY_CAMPFIRE_REGISTRATION: {
  intro: string
  pages: CampfireResearchPage[]
} = {
  intro:
    'Al registrarte en Campfire durante el evento recibes esta investigación temporal en Pokémon GO.',
  pages: [
    {
      title: 'Incursiones / Día de incursiones',
      tasks: [
        {
          task: 'Usa 12 bayas para capturar Pokémon',
          rewards: [{ label: '×10 Bayas Pinia', icon: pinapBerryImg }],
        },
        {
          task: 'Gana 2 incursiones',
          rewards: [{ label: '5000 XP', icon: expImg }],
        },
        {
          task: 'Usa 3 ataques cargados supereficaces',
          rewards: [{ label: '1500 polvo estelar', icon: stardustImg }],
        },
      ],
      pageComplete: [{ label: '×1 Pase de Combate Prémium', icon: premiumPassImg }],
    },
  ],
}
