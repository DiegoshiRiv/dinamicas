import arctibaxAnim from '@/assets/pokemon gif/Arctibax_EP.gif'
import baxcaliburGif from '@/assets/pokemon gif/Baxcalibur.gif'
import baxcaliburShinyGif from '@/assets/pokemon gif/Baxcalibur shiny.gif'

/** Baxcalibur — resumen para el modal del CD. */
export const BAXCALIBUR_INFO = {
  image: baxcaliburGif,
  imageShiny: baxcaliburShinyGif,
  number: 998,
  types: ['Dragón', 'Hielo'] as const,
  stats: {
    attack: 254,
    defense: 168,
    stamina: 229,
  },
  communityDayMove: {
    name: 'Asalto Espadón',
    type: 'Dragón',
    intro:
      'Ataque cargado de tipo Dragón.',
  },
  evolution: {
    fromName: 'Arctibax',
    toName: 'Baxcalibur',
    fromImage: arctibaxAnim,
    candyCost: 100,
    description:
      'Evoluciona un Arctibax a Baxcalibur durante el Día de la Comunidad para que aprenda Asalto Espadón automáticamente.',
  },
  eliteTm:
    'Si ya tienes un Baxcalibur, usa una MT de ataque cargado para enseñarle Asalto Espadón.',
}
