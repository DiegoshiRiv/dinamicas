import piplupImg from '@/assets/eventos pasados/piplup.png'
import grookeyImg from '@/assets/eventos pasados/grookey.png'
import vulpixImg from '@/assets/eventos pasados/vulpix.png'
import meowthGigaImg from '@/assets/eventos pasados/meowth giga.png'
import goTourDia1Img from '@/assets/eventos pasados/go tour dia 1.png'
import goTourDia2Img from '@/assets/eventos pasados/go tour dia 2.png'
import scorbunnyImg from '@/assets/eventos pasados/scorbunny.png'
import tinkatinkImg from '@/assets/eventos pasados/rinkatink.png'
import gigamaxGrandeImg from '@/assets/eventos pasados/a lo grande.png'
import lechonkImg from '@/assets/eventos pasados/lecjonk.png'
import deinoImg from '@/assets/eventos pasados/deino.png'
import megaFalinksImg from '@/assets/eventos pasados/mega falinks.png'
import pikachuGigaImg from '@/assets/eventos pasados/pikachu giga.png'

export interface StampRecoveryLink {
  id: string
  title: string
  url: string
  image?: string
}

/** Enlaces Campfire para recuperar sellos del SelloDex. */
export const STAMP_RECOVERY_LINKS: StampRecoveryLink[] = [
  {
    id: 'piplup-clasico',
    title: 'Día de la comunidad clásico Piplup',
    url: 'https://cmpf.re/6b0cXH',
    image: piplupImg,
  },
  {
    id: 'grookey',
    title: 'Día de la comunidad Grookey',
    url: 'https://cmpf.re/ieBhcg',
    image: grookeyImg,
  },
  {
    id: 'vulpix',
    title: 'Día de la comunidad Vulpix',
    url: 'https://cmpf.re/3MgYgS',
    image: vulpixImg,
  },
  {
    id: 'meowth-gigamax',
    title: 'Meowth Gigamax',
    url: 'https://cmpf.re/TEerkA',
    image: meowthGigaImg,
  },
  {
    id: 'go-tour-dia-1',
    title: 'GO Tour día 1',
    url: 'https://cmpf.re/AYiCor',
    image: goTourDia1Img,
  },
  {
    id: 'go-tour-dia-2',
    title: 'GO Tour día 2',
    url: 'https://cmpf.re/MO4AUw',
    image: goTourDia2Img,
  },
  {
    id: 'scorbunny',
    title: 'Día de la comunidad Scorbunny',
    url: 'https://cmpf.re/k6ds5X',
    image: scorbunnyImg,
  },
  {
    id: 'tinkatink',
    title: 'Día de la comunidad Tinkatink',
    url: 'https://cmpf.re/gT3nJc',
    image: tinkatinkImg,
  },
  {
    id: 'pikachu-gigamax',
    title: 'Pikachu Gigamax',
    url: 'https://cmpf.re/uMPTPp',
    image: pikachuGigaImg,
  },
  {
    id: 'gigamax-grande',
    title: 'A lo grande Gigamax',
    url: 'https://cmpf.re/MqSVpo',
    image: gigamaxGrandeImg,
  },
  {
    id: 'lechonk',
    title: 'Día de la comunidad de Lechonk',
    url: 'https://cmpf.re/8VeNHd',
    image: lechonkImg,
  },
  {
    id: 'deino',
    title: 'Día de la comunidad Deino',
    url: 'https://cmpf.re/t8AI1C',
    image: deinoImg,
  },
  {
    id: 'mega-falinks',
    title: 'Mega Falinks',
    url: 'https://cmpf.re/cgWBwK',
    image: megaFalinksImg,
  },
]
