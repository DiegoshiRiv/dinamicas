import pokeIcon from '@/assets/iconos/pokemondeejemplo.png'

/** Icono único ligero para todos los tipos (carpeta pokemon tipos eliminada). */
export const POKEMON_TYPE_ICONS: Record<string, string> = {
  Normal: pokeIcon,
  Fuego: pokeIcon,
  Agua: pokeIcon,
  Planta: pokeIcon,
  Eléctrico: pokeIcon,
  Hielo: pokeIcon,
  Lucha: pokeIcon,
  Veneno: pokeIcon,
  Tierra: pokeIcon,
  Volador: pokeIcon,
  Psíquico: pokeIcon,
  Bicho: pokeIcon,
  Roca: pokeIcon,
  Fantasma: pokeIcon,
  Dragón: pokeIcon,
  Siniestro: pokeIcon,
  Acero: pokeIcon,
  Hada: pokeIcon,
}

export const POKEMON_TYPES_LIST = Object.keys(POKEMON_TYPE_ICONS).map((name) => ({
  name,
  icon: POKEMON_TYPE_ICONS[name],
}))

export function getTypeIcon(typeName: string): string | undefined {
  return POKEMON_TYPE_ICONS[typeName]
}
