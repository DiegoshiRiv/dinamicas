import typeNormal from '@/assets/pokemon tipos/normal.png'
import typeLucha from '@/assets/pokemon tipos/lucha.png'
import typeVolador from '@/assets/pokemon tipos/volador.png'
import typeVeneno from '@/assets/pokemon tipos/veneno.png'
import typeTierra from '@/assets/pokemon tipos/tierra.png'
import typeRoca from '@/assets/pokemon tipos/roca.png'
import typeBicho from '@/assets/pokemon tipos/bicho.png'
import typeFantasma from '@/assets/pokemon tipos/fantasma.png'
import typeAcero from '@/assets/pokemon tipos/acero.png'
import typeFuego from '@/assets/pokemon tipos/fuego.png'
import typeAgua from '@/assets/pokemon tipos/agua.png'
import typePlanta from '@/assets/pokemon tipos/planta.png'
import typeElectrico from '@/assets/pokemon tipos/electrico.png'
import typePsiquico from '@/assets/pokemon tipos/psiquico.png'
import typeHielo from '@/assets/pokemon tipos/hielo.png'
import typeDragon from '@/assets/pokemon tipos/dragon.png'
import typeSiniestro from '@/assets/pokemon tipos/siniestro.png'
import typeHada from '@/assets/pokemon tipos/hada.png'

/** Iconos de tipo (mismos que en Torneos). */
export const POKEMON_TYPE_ICONS: Record<string, string> = {
  Normal: typeNormal,
  Fuego: typeFuego,
  Agua: typeAgua,
  Planta: typePlanta,
  Eléctrico: typeElectrico,
  Hielo: typeHielo,
  Lucha: typeLucha,
  Veneno: typeVeneno,
  Tierra: typeTierra,
  Volador: typeVolador,
  Psíquico: typePsiquico,
  Bicho: typeBicho,
  Roca: typeRoca,
  Fantasma: typeFantasma,
  Dragón: typeDragon,
  Siniestro: typeSiniestro,
  Acero: typeAcero,
  Hada: typeHada,
}

export const POKEMON_TYPES_LIST = Object.keys(POKEMON_TYPE_ICONS).map((name) => ({
  name,
  icon: POKEMON_TYPE_ICONS[name],
}))

export function getTypeIcon(typeName: string): string | undefined {
  return POKEMON_TYPE_ICONS[typeName]
}
