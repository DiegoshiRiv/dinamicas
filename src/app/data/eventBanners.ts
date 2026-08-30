import type { PokemonGoEvent } from '@/app/data/pokemonGoEvents'
import type { CommunityEvent } from '@/hooks/useEvents'
import { FONDO_CD_DYNAMIC } from '@/app/utils/alternatingFondoCd'
import {
  cdLogo,
  tiempoLibreLogo,
  misterhomieLogo,
  fondoRelleno,
  pokeIcon,
  megaEvIcon,
  sellodexImg,
  campfireImg,
  pokeparadaImg,
  iv100Img,
} from '@/app/data/lightAssets'

export type BannerPerkDetail =
  | 'iv100'
  | 'specialBackground'
  | 'fieldResearch'
  | 'snapshot'
  | 'lureModule'
  | 'sellodex'
  | 'temporalResearch'

export type BannerPerk = {
  icon: string
  label: string
  tone?: 'light' | 'dark'
  detail?: BannerPerkDetail
  useCameraIcon?: boolean
  iconNavy?: boolean
}

export type EventBannerConfig = {
  id: string
  title: string
  subtitle?: string
  schedule: string
  duration?: string
  description: string
  banner: string
  heroImage?: string
  heroImageShiny?: string
  heroImageSecondary?: string
  photoHero?: boolean
  badge?: string
  accent: string
  perks?: BannerPerk[]
  footerNote?: string
  lureModuleNote?: string
  sellodexNote?: string
  mapsUrl?: string
  locationName?: string
  selloDexBadgeColor?: string
  scheduleCapitalize?: boolean
  modalTitle?: string
  scheduleColor?: string
  heroBlendScreen?: boolean
  selloDex?: boolean
  temporalResearch?: {
    intro: string
    note: string
    rewards: readonly { label: string; icon: string }[]
  }
}

const GO_BANNERS: Record<string, Omit<EventBannerConfig, 'id' | 'schedule'> & { schedule?: string }> = {}

export function isFestGlobalDay(_dayKey: string): boolean {
  return false
}

export function festBannerPageIndex(_dayKey: string): number {
  return 0
}

export function bannersForFestGlobal(): EventBannerConfig[] {
  return []
}

export function isFestPagerBanners(_banners: EventBannerConfig[]): boolean {
  return false
}

export function bannerForGoEvent(event: PokemonGoEvent, schedule: string): EventBannerConfig {
  const base = GO_BANNERS[event.id]
  if (base) {
    return {
      id: event.id,
      duration: schedule,
      schedule: base.schedule ?? schedule,
      ...base,
      title: base.title ?? event.title,
      description: base.description ?? event.description ?? '',
    }
  }
  return {
    id: event.id,
    title: event.title,
    duration: schedule,
    schedule,
    description: event.description ?? 'Evento en Pokémon GO.',
    banner: fondoRelleno,
    heroImage: event.logo ?? megaEvIcon,
    badge: 'Pokémon GO',
    accent: event.accent,
  }
}

export function bannerForCommunityEvent(
  event: CommunityEvent,
  schedule: string,
): EventBannerConfig {
  const isCd = event.has_stamp || /comunidad/i.test(event.title)
  return {
    id: `community-${event.id}`,
    title: event.title,
    subtitle: event.has_stamp ? 'SelloDex' : 'Comunidad GDL',
    duration: schedule,
    schedule,
    description: event.description,
    banner: isCd ? FONDO_CD_DYNAMIC : tiempoLibreLogo,
    heroImage: event.pokemon_image_url || (isCd ? cdLogo : misterhomieLogo),
    heroImageSecondary: isCd ? pokeIcon : tiempoLibreLogo,
    badge: isCd ? 'Día de la Comunidad' : 'Comunidad',
    accent: '#f97316',
    selloDex: event.has_stamp,
    perks: event.has_stamp
      ? [
          { icon: sellodexImg, label: 'Trae tu SelloDex', tone: 'dark' },
          { icon: campfireImg, label: 'Registro en Campfire', tone: 'dark' },
          { icon: pokeparadaImg, label: 'Reunión en Poképarada', tone: 'dark' },
          { icon: iv100Img, label: 'IV 100% posibles', tone: 'dark' },
        ]
      : [
          { icon: misterhomieLogo, label: 'Reunión de comunidad', tone: 'dark' },
          { icon: pokeparadaImg, label: 'Punto de encuentro', tone: 'dark' },
        ],
    mapsUrl: event.location_maps_url,
    locationName: event.location_name,
    footerNote: event.has_stamp ? 'Recuerda registrar tu sello en Campfire' : undefined,
  }
}
