import type { PokemonGoEvent } from '@/app/data/pokemonGoEvents'
import { VIERNES_AMIGOS } from '@/app/data/communitySchedule'
import type { CommunityEvent } from '@/hooks/useEvents'

// —— Fondos y líderes ——
import fondoSabiduria from '@/assets/fondo especial/Fondo_equipo_Sabiduría.png'
import fondoInstinto from '@/assets/fondo especial/Fondo_equipo_Instinto.png'
import fondoValor from '@/assets/fondo especial/Fondo_equipo_Valor.png'
import { FONDO_CD_DYNAMIC } from '@/app/utils/alternatingFondoCd'
import fondoFestMew from '@/assets/wallpaper/proyectomewtwo.jpg'
import fondoFestMewtwo from '@/assets/wallpaper/bannnerFest.png'
import fondoRelleno from '@/assets/wallpaper/fondoderellenobasicodepokemongo.jpg'
import blancheImg from '@/assets/Humanos/blanche.png'
import laprasBlanche from '@/assets/Pokemon/laprasblanche.png'
import sparkImg from '@/assets/Humanos/spark.png'
import elekidSpark from '@/assets/Pokemon/elekidspark.png'
import candelaImg from '@/assets/Humanos/candela.png'
import ponytaCandela from '@/assets/Pokemon/ponytacandela.png'

// —— Comunidad / CD ——
import cdParqueMorelos from '@/assets/dia de la comunidad frigibax parque morelos.png'
import frigibaxGif from '@/assets/pokemon gif/Frigibax.gif'
import frigibaxShinyGif from '@/assets/pokemon gif/Frigibax_Shiny.gif'
import frigibaxImg from '@/assets/Pokemon/996-frigibax-shiny.png'
import arctibaxImg from '@/assets/Pokemon/997-arctibax.png'
import baxcaliburHeadImg from '@/assets/cabeza pokemon/34_baxcalibur.png'
import cdLogo from '@/assets/logos/diadelacomunidad.png'
import comunidadFoto from '@/assets/fotos/misterhomiefoto.png'
import tiempoLibreFoto from '@/assets/fotos/tiempolibrefoto.png'
import tiempoLibreLogo from '@/assets/logos/tiempolibre.png'

// —— GO Fest ——
import logoFest from '@/assets/logos/LogoFest.png'
import mewtwoImg from '@/assets/Pokemon/mewtwo.png'
import mewtwoMegaX from '@/assets/Pokemon/150-mewtwo-mega-x.png'
import mewtwoMegaY from '@/assets/Pokemon/150-mewtwo-mega-y.png'
import zeraoraImg from '@/assets/Pokemon/Zeraora.png'
import pikachuFest from '@/assets/Pokemon/25-pikachu-anniversary.png'
import bulbasaurFest from '@/assets/Pokemon/1-bulbasaur-spring-2020.png'
import charmanderFest from '@/assets/Pokemon/4-charmander-spring-2020.png'
import squirtleFest from '@/assets/Pokemon/7-squirtle-spring-2020.png'

// —— Incursiones 5★ ——
import reshiramImg from '@/assets/Pokemon/643-reshiram.png'
import zekromImg from '@/assets/Pokemon/644-zekrom.png'
import necrozmaImg from '@/assets/Pokemon/800-necrozma.png'
import celesteelaImg from '@/assets/Pokemon/797-celesteela.png'
import kartanaImg from '@/assets/Pokemon/798-kartana.png'
import raidDiaImg from '@/assets/wallpaper/dia de incursiones.jpg'
import superMegaRaidBanner from '@/assets/wallpaper/super-mega-raid.png'
import raidOscuraImg from '@/assets/recursos/raid_oscura.png'
import cresseliaGiovanni from '@/assets/wallpaper/Creselia oscuro y Giovanni.png'
import giovanniImg from '@/assets/Humanos/p_gogiovanni.png'
import cresseliaImg from '@/assets/Pokemon/488-cresselia.png'

// —— Megas ——
import megaAudino from '@/assets/Pokemon/531-audino-mega.png'
import megaLopunny from '@/assets/Pokemon/428-lopunny-mega.png'
import megaScizor from '@/assets/Pokemon/212-scizor-mega.png'
import megaPidgeot from '@/assets/Pokemon/18-pidgeot-mega.png'
import megaMedicham from '@/assets/Pokemon/308-medicham-mega.png'
import megaEvIcon from '@/assets/iconos/megaev.png'
import paseGratisImg from '@/assets/objetos del juego/Pase_de_incursión_GO_Gratis.png'
import paseRemotoImg from '@/assets/objetos del juego/pase_remoto.png'

// —— Taxi Volador / voladores ——
import tropiusImg from '@/assets/Pokemon/357-tropius.png'
import bouffalantImg from '@/assets/Pokemon/626-bouffalant.png'

// —— Team Rocket ——
import rocketLogo from '@/assets/iconos/Team_Rocket_Logo.png'
import rocketImg from '@/assets/wallpaper/team-rocket-169.png'
import reclutasRocket from '@/assets/Humanos/reclutasrocket.png'

// —— Objetos / UI ——
import sellodexImg from '@/assets/recursos/sellodex.png'
import intercambioImg from '@/assets/iconos/intercambio.png'
import carameloImg from '@/assets/iconos/caramelo.png'
import polvoImg from '@/assets/iconos/polvo.png'
import shinyImg from '@/assets/iconos/shiny.png'
import inciensoImg from '@/assets/iconos/incienso.png'
import moduloImg from '@/assets/iconos/modulo.png'
import stardustGoImg from '@/assets/objetos del juego/Pokemon-Go-Stardust.png'
import inciensoGoImg from '@/assets/objetos del juego/incienso.png'
import lureModuleGoImg from '@/assets/objetos del juego/cebo.png'
import investigacionImg from '@/assets/iconos/investigacion.png'
import fondoEspecial from '@/assets/fondo especial/fondoespecial.webp'
import grupoImg from '@/assets/iconos/grupo.png'
import regaloImg from '@/assets/iconos/regalo.png'
import huevoImg from '@/assets/iconos/huevo.png'
import campfireImg from '@/assets/recursos/campfire.png'
import pokeparadaImg from '@/assets/iconos/pokeparada.png'
import iv100Img from '@/assets/iconos/100_ivs.png'
import nodoImg from '@/assets/recursos/nodo_energetico.png'
import megaMaxImg from '@/assets/recursos/Maxinodo.png'
import gigamaxImg from '@/assets/iconos/gigamax.png'
import globalImg from '@/assets/iconos/global.png'
import { FRIGIBAX_CANDY } from '@/app/data/cdFrigibax'
import {
  SKARMORY_DEBUT_INTRO,
  SKARMORY_REMOTE_PASS_WINDOW,
  SKARMORY_SHINY_FOOTNOTE,
  SKARMORY_SUPERMEGA_HOURS,
  SKARMORY_SUPERMEGA_IMAGES,
  SKARMORY_SUPERMEGA_SCHEDULE,
  SKARMORY_TEMPORAL_RESEARCH_NOTE,
} from '@/app/data/supermegaSkarmory'
import { CD_FRIGIBAX_HOURS, formatClockLabel, formatTimeRangeLabel } from '@/app/utils/formatTime'

/** Iconos claros/blancos → fondo oscuro (`light`). Iconos oscuros/coloreados → fondo claro (`dark`). */
export type BannerPerkDetail =
  | 'iv100'
  | 'specialBackground'
  | 'fieldResearch'
  | 'baxcalibur'
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
  /** Icono en #0d3b66 (mismo tono que la cámara de GO Snapshot). */
  iconNavy?: boolean
}

export type EventBannerConfig = {
  id: string
  title: string
  subtitle?: string
  schedule: string
  /** Duración / fechas (cabecera del modal). */
  duration?: string
  description: string
  banner: string
  heroImage?: string
  /** Versión shiny del hero; al tocar alterna con `heroImage`. */
  heroImageShiny?: string
  heroImageSecondary?: string
  /** Foto de fondo + logo; sin gradiente de color del evento. */
  photoHero?: boolean
  badge?: string
  accent: string
  perks?: BannerPerk[]
  footerNote?: string
  lureModuleNote?: string
  /** Texto al tocar el perk de SelloDex (junto a la imagen). */
  sellodexNote?: string
  mapsUrl?: string
  locationName?: string
  /** Color del chip SelloDex en el hero (evita confundirlo con el teal de la app). */
  selloDexBadgeColor?: string
  /** Si false, la línea de schedule no usa capitalize. */
  scheduleCapitalize?: boolean
  /** Título del modal (p. ej. fecha del evento). */
  modalTitle?: string
  /** Color de la línea «Bonus del evento». */
  scheduleColor?: string
  /** PNG con fondo negro: mezcla con el gradiente del banner. */
  heroBlendScreen?: boolean
  /** Evento con sello SelloDex en reunión presencial. */
  selloDex?: boolean
}

const TEAM_PERKS_BASE: BannerPerk[] = [
  { icon: investigacionImg, label: 'Tareas de investigación', tone: 'dark' },
  { icon: pokeparadaImg, label: 'Más apariciones salvajes', tone: 'dark' },
  { icon: carameloImg, label: 'Pase de GO del equipo', tone: 'light' },
]

const CD_PERKS: BannerPerk[] = [
  { icon: frigibaxImg, label: 'Frigibax con más posibilidad de salir Shiny.', tone: 'dark' },
  { icon: baxcaliburHeadImg, label: 'Baxcalibur Aprenderá Asalto Espadón.', tone: 'dark' },
  { icon: polvoImg, label: 'Triple polvo al capturar', tone: 'dark' },
  { icon: carameloImg, label: '2X Doble caramelos', tone: 'light' },
  { icon: inciensoImg, label: 'El incienso durará 3 horas', tone: 'dark' },
  { icon: moduloImg, label: 'Módulos señuelo durarán 1 hora', tone: 'dark' },
  { icon: fondoEspecial, label: 'Fondo especial', tone: 'dark' },
]

const CD_FRIGIBAX_PERKS: BannerPerk[] = [
  { icon: stardustGoImg, label: '×3 polvo estelar al capturar', tone: 'dark' },
  { icon: FRIGIBAX_CANDY.candy, label: '×2 caramelos al capturar', tone: 'dark' },
  { icon: FRIGIBAX_CANDY.candyXl, label: '×2 probabilidad de Caramelos XL', tone: 'dark' },
  { icon: inciensoGoImg, label: 'Incienso activo 3 horas', tone: 'dark' },
  { icon: lureModuleGoImg, label: 'Módulos señuelo: 1 hora', tone: 'dark', detail: 'lureModule' },
  { icon: intercambioImg, label: '+1 intercambio especial (máx 2)', tone: 'dark', iconNavy: true },
  { icon: stardustGoImg, label: '50 % menos polvo al intercambiar', tone: 'dark' },
  {
    icon: investigacionImg,
    label: 'Investigación de campo',
    tone: 'dark',
    detail: 'fieldResearch',
    iconNavy: true,
  },
  { icon: iv100Img, label: 'PC de 100% IVs', tone: 'dark', detail: 'iv100' },
  { icon: baxcaliburHeadImg, label: 'Baxcalibur: Asalto Espadón', tone: 'dark', detail: 'baxcalibur' },
  { icon: shinyImg, label: 'Foto GO Snapshot', tone: 'dark', useCameraIcon: true, detail: 'snapshot' },
  { icon: fondoEspecial, label: 'Fondo especial', tone: 'dark', detail: 'specialBackground' },
  { icon: sellodexImg, label: 'SELLODEX', tone: 'dark', detail: 'sellodex' },
]

const FEST_PERKS: BannerPerk[] = [
  { icon: logoFest, label: 'GO Fest Global gratis', tone: 'dark' },
  { icon: mewtwoMegaX, label: 'Mega-Mewtwo X', tone: 'dark' },
  { icon: mewtwoMegaY, label: 'Mega-Mewtwo Y', tone: 'dark' },
  { icon: zeraoraImg, label: 'Zeraora debut', tone: 'dark' },
  { icon: pikachuFest, label: 'Pikachu con gorras', tone: 'dark' },
  { icon: bulbasaurFest, label: 'Bulbasaur con visera', tone: 'dark' },
  { icon: charmanderFest, label: 'Charmander con visera', tone: 'dark' },
  { icon: squirtleFest, label: 'Squirtle con visera', tone: 'dark' },
]

/** Sábado 11 jul — según Festival GO 2026 Global. */
const FEST_SABADO_PERKS: BannerPerk[] = [
  { icon: sellodexImg, label: 'Sello SelloDex (sábado)', tone: 'dark' },
  { icon: logoFest, label: 'GO Fest gratis · 9 h de juego', tone: 'dark' },
  { icon: mewtwoMegaX, label: 'Supermegainc. Mega-Mewtwo X', tone: 'dark' },
  { icon: mewtwoImg, label: 'Mewtwo: ataque Contraataque', tone: 'dark' },
  { icon: pikachuFest, label: 'Pikachu con gorras de equipo', tone: 'dark' },
  { icon: charmanderFest, label: 'Starters con visera Pikachu', tone: 'dark' },
  { icon: investigacionImg, label: 'Investig. temporal Mega X/Y', tone: 'dark' },
  { icon: moduloImg, label: 'Módulos señuelo 1 h', tone: 'dark' },
  { icon: inciensoImg, label: 'Incienso: Unown, Tropius…', tone: 'dark' },
  { icon: shinyImg, label: 'Más Pokémon brillantes', tone: 'dark' },
]

/** Domingo 12 jul — tipos y megas distintos al sábado. */
const FEST_DOMINGO_PERKS: BannerPerk[] = [
  { icon: sellodexImg, label: 'Sello SelloDex (domingo)', tone: 'dark' },
  { icon: logoFest, label: 'GO Fest gratis · 9 h de juego', tone: 'dark' },
  { icon: mewtwoMegaY, label: 'Supermegainc. Mega-Mewtwo Y', tone: 'dark' },
  { icon: zeraoraImg, label: 'Debut Zeraora (Fulgor)', tone: 'dark' },
  { icon: investigacionImg, label: 'Investigación especial Zeraora', tone: 'dark' },
  { icon: pikachuFest, label: 'Pikachu con gorras de equipo', tone: 'dark' },
  { icon: charmanderFest, label: 'Charmander sombrero fiesta*', tone: 'dark' },
  { icon: moduloImg, label: 'Módulos señuelo 1 h', tone: 'dark' },
  { icon: inciensoImg, label: 'Incienso: Unown, Tropius…', tone: 'dark' },
  { icon: shinyImg, label: 'Más Pokémon brillantes', tone: 'dark' },
]

const VIERNES_PERKS: BannerPerk[] = [
  { icon: intercambioImg, label: '2 intercambios especiales extra', tone: 'dark' },
  { icon: shinyImg, label: 'Más suerte en intercambios', tone: 'dark' },
  { icon: polvoImg, label: '−10 % polvo estelar', tone: 'dark' },
  { icon: carameloImg, label: '2 Caramelos ++ al intercambiar', tone: 'dark' },
  { icon: tiempoLibreLogo, label: 'Convivir con la comunidad', tone: 'dark' },
]

const SKARMORY_SUPERMEGA_PERKS: BannerPerk[] = [
  { icon: SKARMORY_SUPERMEGA_IMAGES.megaIcon, label: 'Debut de Mega-Skarmory', tone: 'dark' },
  { icon: shinyImg, label: 'Más probabilidad de salir shiny en super mega incursiones', tone: 'dark' },
  { icon: paseRemotoImg, label: 'Límite de pases remotos será de 20', tone: 'dark' },
  { icon: paseGratisImg, label: 'Hasta 6 pases gratis al girar fotodiscos de gimnasios.', tone: 'dark' },
  { icon: investigacionImg, label: 'Investigación temporal', tone: 'dark', detail: 'temporalResearch' },
  { icon: sellodexImg, label: 'SELLODEX', tone: 'dark', detail: 'sellodex' },
]

const GO_BANNERS: Record<string, Omit<EventBannerConfig, 'id' | 'schedule'> & { schedule?: string }> = {
  blanche: {
    title: 'Blanche y la búsqueda del conocimiento',
    subtitle: 'Equipo Sabiduría',
    description:
      'Investigación, Incienso y encuentros salvajes. Lapras y Larvitar destacados. Pase de GO de Blanche.',
    banner: fondoSabiduria,
    heroImage: blancheImg,
    heroImageSecondary: laprasBlanche,
    badge: 'Evento de equipo',
    accent: '#0ea5e9',
    perks: [
      { icon: laprasBlanche, label: 'Lapras con accesorio Blanche', tone: 'dark' },
      { icon: investigacionImg, label: 'Investigación de campo', tone: 'dark' },
      { icon: inciensoImg, label: 'Encuentros por Incienso', tone: 'dark' },
      ...TEAM_PERKS_BASE,
    ],
  },
  spark: {
    title: 'Spark y la búsqueda de los cuidados',
    subtitle: 'Equipo Instinto',
    description: 'Eclosionar huevos y explorar. Huevos de 7 km con Pokémon especiales.',
    banner: fondoInstinto,
    heroImage: sparkImg,
    heroImageSecondary: elekidSpark,
    badge: 'Evento de equipo',
    accent: '#eab308',
    perks: [
      { icon: elekidSpark, label: 'Elekid con accesorio Spark', tone: 'dark' },
      { icon: huevoImg, label: 'Huevos de 7 km especiales', tone: 'light' },
      ...TEAM_PERKS_BASE,
    ],
  },
  candela: {
    title: 'Candela y la búsqueda de la victoria',
    subtitle: 'Equipo Valor',
    description: 'Incursiones y combates. Bonos de amigos en raids y pase de Candela.',
    banner: fondoValor,
    heroImage: candelaImg,
    heroImageSecondary: ponytaCandela,
    badge: 'Evento de equipo',
    accent: '#f97316',
    perks: [
      { icon: ponytaCandela, label: 'Ponyta con accesorio Candela', tone: 'dark' },
      { icon: reshiramImg, label: 'Incursiones temáticas', tone: 'dark' },
      ...TEAM_PERKS_BASE,
    ],
  },
  'cd-frigibax': {
    title: 'Día de la Comunidad: Frigibax',
    subtitle: CD_FRIGIBAX_HOURS.event,
    schedule: 'Bonus del evento',
    scheduleCapitalize: false,
    scheduleColor: '#06b6d4',
    modalTitle: 'Sábado 20 de junio de 2026',
    description:
      'Verás más Frigibax salvajes. Con suerte, pueden ser Shiny o traer el fondo especial del Día de la Comunidad.',
    banner: cdParqueMorelos,
    heroImage: frigibaxGif,
    heroImageShiny: frigibaxShinyGif,
    badge: 'Día de la Comunidad',
    accent: '#06b6d4',
    selloDexBadgeColor: '#1d4ed8',
    perks: CD_FRIGIBAX_PERKS,
    footerNote:
      `Los bonus del Día de la Comunidad aplican de ${CD_FRIGIBAX_HOURS.event} los módulos señuelo y algunos bonus se extienden hasta las ${formatClockLabel(21, 0)}`,
    lureModuleNote:
      `De ${CD_FRIGIBAX_HOURS.lure} los Módulos Señuelo normales atraerán Frigibax que pueden ser Shiny, tener fondo especial aunque ya haya terminado el evento.`,
    sellodexNote:
      `¡Trae tu SELLODEX a la quedada! Al hacer tu registro en Campfire podrás obtener el sello del evento y una investigación temporal en el juego con las recompensas que ves abajo.`,
  },
  'cd-julio': {
    title: 'Día de la Comunidad (julio)',
    subtitle: 'SELLODEX',
    description: 'Día de la Comunidad de julio. Reunión de comunidad con SelloDex.',
    banner: FONDO_CD_DYNAMIC,
    heroImage: cdLogo,
    badge: 'Día de la Comunidad',
    accent: '#06b6d4',
    perks: [
      { icon: sellodexImg, label: 'SELLODEX', tone: 'dark' },
      { icon: polvoImg, label: 'Bonos de captura', tone: 'dark' },
      { icon: carameloImg, label: 'Doble caramelos', tone: 'light' },
      { icon: moduloImg, label: 'Módulos señuelo', tone: 'dark' },
    ],
  },
  'cd-agosto': {
    title: 'Día de la Comunidad (agosto)',
    subtitle: 'SELLODEX',
    description: 'Día de la Comunidad de agosto. Reunión de comunidad con SELLODEX.',
    banner: FONDO_CD_DYNAMIC,
    heroImage: cdLogo,
    badge: 'Día de la Comunidad',
    accent: '#06b6d4',
    perks: [
      { icon: sellodexImg, label: 'SELLODEX', tone: 'dark' },
      { icon: huevoImg, label: 'Bonos de eclosión', tone: 'light' },
      { icon: polvoImg, label: 'Bonos de captura', tone: 'dark' },
    ],
  },
  'fest-global-sabado': {
    title: 'GO Fest Global — Sábado',
    subtitle: 'SelloDex · 11 de julio',
    description:
      'Evento mundial gratis, 10:00–19:00 (9 h de juego). Debut de Mega-Mewtwo X en supermegaincursiones; Mewtwo capturados conocen Contraataque. Salvajes por bloques: Hielo, Eléctrico, Fuego (10–13 h) · Psíquico, Fantasma, Agua (13–16 h) · Volador, Roca, Dragón (16–19 h). Camino a Zeraora con investigación especial.',
    banner: fondoFestMewtwo,
    heroImage: mewtwoMegaX,
    heroImageSecondary: logoFest,
    badge: 'GO Fest · Sábado',
    accent: '#d946ef',
    perks: FEST_SABADO_PERKS,
    footerNote:
      'SelloDex sábado en reunión · Hasta 9 pases de incursión y 6 intercambios especiales al día (00:00–23:59)',
  },
  'fest-global-domingo': {
    title: 'GO Fest Global — Domingo',
    subtitle: 'SelloDex · 12 de julio',
    description:
      'Segundo día gratis, 10:00–19:00. Mega-Mewtwo Y en supermegaincursiones; Mewtwo capturados conocen Onda Mental. Salvajes por bloques: Tierra, Acero, Normal (10–13 h) · Veneno, Bicho, Planta (13–16 h) · Oscuro, Hada, Lucha (16–19 h). Clímax del evento: debut de Zeraora (Fulgor) en investigación especial.',
    banner: fondoFestMewtwo,
    heroImage: mewtwoMegaY,
    heroImageSecondary: logoFest,
    badge: 'GO Fest · Domingo',
    accent: '#a855f7',
    perks: FEST_DOMINGO_PERKS,
    footerNote:
      'SelloDex domingo (distinto al sábado) · Investigación de campo renovada cada hora según tipo',
  },
  'fest-chicago': {
    title: 'Festival Pokémon GO: Chicago',
    description: 'Evento presencial en Chicago.',
    banner: fondoFestMew,
    heroImage: logoFest,
    heroImageSecondary: mewtwoMegaX,
    badge: 'GO Fest',
    accent: '#c026d3',
    perks: [{ icon: mewtwoMegaX, label: 'Mega-Mewtwo X', tone: 'dark' }],
  },
  'fest-copenhagen': {
    title: 'Festival Pokémon GO: Copenhague',
    description: 'Evento presencial en Copenhague.',
    banner: fondoFestMew,
    heroImage: logoFest,
    heroImageSecondary: mewtwoMegaY,
    badge: 'GO Fest',
    accent: '#c026d3',
    perks: [{ icon: mewtwoMegaY, label: 'Mega-Mewtwo Y', tone: 'dark' }],
  },
  'supermega-skarmory': {
    title: 'Día de Super Mega Incursiones de Skarmory',
    subtitle: SKARMORY_SUPERMEGA_HOURS.event,
    schedule: SKARMORY_SUPERMEGA_SCHEDULE,
    scheduleCapitalize: false,
    scheduleColor: '#475569',
    modalTitle: 'Sábado 27 de junio de 2026',
    description: `${SKARMORY_DEBUT_INTRO} ${SKARMORY_SHINY_FOOTNOTE}`,
    banner: superMegaRaidBanner,
    heroImage: SKARMORY_SUPERMEGA_IMAGES.mega,
    heroImageShiny: SKARMORY_SUPERMEGA_IMAGES.shiny,
    badge: 'Supermegaincursiones',
    accent: '#64748b',
    selloDex: true,
    selloDexBadgeColor: '#64748b',
    sellodexNote:
      '¡Trae tu SELLODEX a la quedada! Al registrarte en Campfire obtendrás el sello del evento y la investigación temporal con las recompensas que ves abajo.',
    perks: SKARMORY_SUPERMEGA_PERKS,
    footerNote: `${SKARMORY_REMOTE_PASS_WINDOW} ${SKARMORY_TEMPORAL_RESEARCH_NOTE}`,
  },
  'evento-julio-18': {
    title: '??',
    description: 'Por confirmar. Mantente atento a las redes de la comunidad.',
    banner: fondoRelleno,
    heroImage: globalImg,
    badge: 'Próximamente',
    accent: '#94a3b8',
  },
  'taxi-volador': {
    title: 'Taxi Volador',
    description: 'Pokémon voladores destacados. Tropius y Bouffalant por Incienso.',
    banner: fondoInstinto,
    heroImage: tropiusImg,
    heroImageSecondary: bouffalantImg,
    badge: 'Taxi Volador',
    accent: '#38bdf8',
    perks: [
      { icon: tropiusImg, label: 'Tropius por Incienso', tone: 'dark' },
      { icon: bouffalantImg, label: 'Bouffalant por Incienso', tone: 'dark' },
      { icon: investigacionImg, label: 'Investigación temática', tone: 'dark' },
    ],
  },
  'taxi-invasion': {
    title: 'Taxi Volador: Invasión',
    description: 'Invasión del Team GO Rocket durante el evento.',
    banner: fondoValor,
    heroImage: cresseliaGiovanni,
    heroImageSecondary: giovanniImg,
    badge: 'Invasión Rocket',
    accent: '#0284c7',
    perks: [
      { icon: giovanniImg, label: 'Giovanni en incursiones', tone: 'dark' },
      { icon: cresseliaImg, label: 'Cresselia oscura', tone: 'dark' },
      { icon: rocketImg, label: 'Team GO Rocket', tone: 'dark' },
    ],
  },
  'eclosiones-agosto': {
    title: 'Día de Eclosiones',
    description: 'Bonificaciones por eclosionar huevos.',
    banner: fondoInstinto,
    heroImage: huevoImg,
    heroImageSecondary: nodoImg,
    badge: 'Día de Eclosiones',
    accent: '#84cc16',
    perks: [
      { icon: huevoImg, label: 'Bonos de eclosión', tone: 'light' },
      { icon: nodoImg, label: 'Nodos energéticos', tone: 'dark' },
      { icon: megaMaxImg, label: 'Combates Max', tone: 'dark' },
    ],
  },
  'raid-day-ago': {
    title: 'Día de incursiones',
    description: 'Incursiones destacadas durante el día.',
    banner: raidDiaImg,
    heroImage: reshiramImg,
    heroImageSecondary: zekromImg,
    badge: 'Día de incursiones',
    accent: '#e11d48',
    perks: [
      { icon: reshiramImg, label: 'Reshiram', tone: 'dark' },
      { icon: zekromImg, label: 'Zekrom', tone: 'dark' },
      { icon: necrozmaImg, label: 'Necrozma', tone: 'dark' },
    ],
  },
  'raid-reshiram': {
    title: 'Incursiones 5★: Reshiram',
    description: 'Reshiram en incursiones de 5 estrellas.',
    banner: fondoValor,
    heroImage: reshiramImg,
    badge: 'Incursiones 5★',
    accent: '#ef4444',
    perks: [{ icon: reshiramImg, label: 'Reshiram', tone: 'dark' }],
  },
  'raid-zekrom': {
    title: 'Incursiones 5★: Zekrom',
    description: 'Zekrom en incursiones de 5 estrellas.',
    banner: fondoInstinto,
    heroImage: zekromImg,
    badge: 'Incursiones 5★',
    accent: '#1e293b',
    perks: [{ icon: zekromImg, label: 'Zekrom', tone: 'dark' }],
  },
  'raid-necrozma': {
    title: 'Incursiones 5★: Necrozma',
    description: 'Necrozma en incursiones de 5 estrellas.',
    banner: fondoSabiduria,
    heroImage: necrozmaImg,
    badge: 'Incursiones 5★',
    accent: '#a855f7',
    perks: [{ icon: necrozmaImg, label: 'Necrozma', tone: 'dark' }],
  },
  'raid-ultra': {
    title: 'Incursiones 5★: Celesteela / Kartana',
    description: 'Ultraentes en incursiones según hemisferio.',
    banner: fondoSabiduria,
    heroImage: celesteelaImg,
    heroImageSecondary: kartanaImg,
    badge: 'Incursiones 5★',
    accent: '#1fb988',
    perks: [
      { icon: celesteelaImg, label: 'Celesteela (Sur)', tone: 'dark' },
      { icon: kartanaImg, label: 'Kartana (Norte)', tone: 'dark' },
    ],
  },
  'dialga-oscuro': {
    title: 'Dialga Oscuro en incursiones',
    description: 'Dialga Oscuro en incursiones oscuras todo el mes.',
    banner: fondoValor,
    heroImage: raidOscuraImg,
    heroImageSecondary: cresseliaGiovanni,
    badge: 'Incursiones oscuras',
    accent: '#475569',
    perks: [
      { icon: raidOscuraImg, label: 'Incursiones oscuras', tone: 'dark' },
      { icon: giovanniImg, label: 'Equipo GO Rocket', tone: 'dark' },
    ],
  },
  'mega-audino': {
    title: 'Megaincursiones: Mega-Audino',
    description: 'Mega-Audino en megaincursiones.',
    banner: raidDiaImg,
    heroImage: megaAudino,
    badge: 'Megaincursiones',
    accent: '#ec4899',
    perks: [{ icon: megaAudino, label: 'Mega-Audino', tone: 'dark' }],
  },
  'mega-lopunny': {
    title: 'Megaincursiones: Mega-Lopunny',
    description: 'Mega-Lopunny en megaincursiones.',
    banner: raidDiaImg,
    heroImage: megaLopunny,
    badge: 'Megaincursiones',
    accent: '#f472b6',
    perks: [{ icon: megaLopunny, label: 'Mega-Lopunny', tone: 'dark' }],
  },
  'mega-scizor': {
    title: 'Megaincursiones: Mega-Scizor',
    description: 'Mega-Scizor en megaincursiones.',
    banner: raidDiaImg,
    heroImage: megaScizor,
    badge: 'Megaincursiones',
    accent: '#dc2626',
    perks: [{ icon: megaScizor, label: 'Mega-Scizor', tone: 'dark' }],
  },
  'mega-pidgeot': {
    title: 'Megaincursiones: Mega-Pidgeot',
    description: 'Mega-Pidgeot en megaincursiones.',
    banner: raidDiaImg,
    heroImage: megaPidgeot,
    badge: 'Megaincursiones',
    accent: '#1fb988',
    perks: [{ icon: megaPidgeot, label: 'Mega-Pidgeot', tone: 'dark' }],
  },
}

export function bannerForViernesAmigos(): EventBannerConfig {
  return {
    id: VIERNES_AMIGOS.id,
    title: VIERNES_AMIGOS.title,
    subtitle: 'Tiempo Libre',
    duration: `Viernes 29 de Mayo a partir de las ${formatClockLabel(18, 0)}`,
    schedule: `Viernes 29 de Mayo a partir de las ${formatClockLabel(18, 0)}`,
    description: VIERNES_AMIGOS.description,
    banner: tiempoLibreFoto,
    heroImage: tiempoLibreLogo,
    photoHero: true,
    badge: 'Viernes de Amigos',
    accent: '#2563eb',
    perks: VIERNES_PERKS,
    locationName: VIERNES_AMIGOS.locationName,
    mapsUrl: VIERNES_AMIGOS.locationMapsUrl,
    footerNote: VIERNES_AMIGOS.locationDetail,
  }
}

export const FEST_GLOBAL_SABADO = '2026-07-11'
export const FEST_GLOBAL_DOMINGO = '2026-07-12'

export function isFestGlobalDay(dayKey: string): boolean {
  return dayKey === FEST_GLOBAL_SABADO || dayKey === FEST_GLOBAL_DOMINGO
}

export function festBannerPageIndex(dayKey: string): number {
  return dayKey === FEST_GLOBAL_DOMINGO ? 1 : 0
}

export function bannersForFestGlobal(): EventBannerConfig[] {
  const sabado = GO_BANNERS['fest-global-sabado']
  const domingo = GO_BANNERS['fest-global-domingo']
  return [
    {
      id: 'fest-global-sabado',
      duration: `Sábado 11 de julio de 2026 · ${formatTimeRangeLabel(10, 0, 19, 0)}`,
      schedule: `Sábado 11 de julio de 2026 · ${formatTimeRangeLabel(10, 0, 19, 0)}`,
      ...sabado,
      title: sabado.title ?? 'Pokémon GO Fest 2026: Global',
      description: sabado.description ?? '',
    },
    {
      id: 'fest-global-domingo',
      duration: `Domingo 12 de julio de 2026 · ${formatTimeRangeLabel(10, 0, 19, 0)}`,
      schedule: `Domingo 12 de julio de 2026 · ${formatTimeRangeLabel(10, 0, 19, 0)}`,
      ...domingo,
      title: domingo.title ?? 'Pokémon GO Fest 2026: Global',
      description: domingo.description ?? '',
    },
  ]
}

export function isFestPagerBanners(banners: EventBannerConfig[]): boolean {
  return (
    banners.length === 2 &&
    banners[0]?.id === 'fest-global-sabado' &&
    banners[1]?.id === 'fest-global-domingo'
  )
}

export function bannerForGoEvent(event: PokemonGoEvent, schedule: string): EventBannerConfig {
  if (event.id === 'fest-global') {
    return bannersForFestGlobal()[0]
  }
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
    banner: fondoFestMew,
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
    banner: isCd ? cdParqueMorelos : tiempoLibreFoto,
    heroImage: event.pokemon_image_url || (isCd ? frigibaxGif : comunidadFoto),
    heroImageSecondary: isCd ? frigibaxImg : tiempoLibreLogo,
    badge: isCd ? 'Día de la Comunidad' : 'Comunidad',
    accent: '#f97316',
    perks: event.has_stamp
      ? [
          { icon: sellodexImg, label: 'Trae tu SelloDex', tone: 'dark' },
          { icon: campfireImg, label: 'Registro en Campfire', tone: 'dark' },
          { icon: pokeparadaImg, label: 'Reunión en Poképarada', tone: 'dark' },
          { icon: iv100Img, label: 'IV 100% posibles', tone: 'dark' },
        ]
      : [
          { icon: comunidadFoto, label: 'Reunión de comunidad', tone: 'dark' },
          { icon: pokeparadaImg, label: 'Punto de encuentro', tone: 'dark' },
        ],
    mapsUrl: event.location_maps_url,
    locationName: event.location_name,
    footerNote: event.has_stamp ? 'Recuerda registrar tu sello en Campfire' : undefined,
  }
}
