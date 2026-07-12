import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Camera, ChevronRight, Clock, ExternalLink, MapPin, X } from 'lucide-react'
import { TypeBadgeRow, TypeIcon } from '@/app/components/TypeBadge'
import { BAXCALIBUR_INFO } from '@/app/data/cdBaxcalibur'
import {
  FRIGIBAX_CANDY,
  FRIGIBAX_CD_IV,
  FRIGIBAX_FIELD_RESEARCH_INTRO,
  FRIGIBAX_FIELD_RESEARCH_SPECIAL_BG,
  FRIGIBAX_FIELD_RESEARCH_STANDARD,
  FRIGIBAX_SPECIAL_BACKGROUND_SOURCES,
  FRIGIBAX_SNAPSHOT_INTRO,
  FRIGIBAX_SNAPSHOT_STEPS,
  FRIGIBAX_SNAPSHOT_TIPS,
} from '@/app/data/cdFrigibax'
import {
  INTELEON_INFO,
  SOBBLE_CD_IV,
  SOBBLE_FIELD_RESEARCH_INTRO,
  SOBBLE_FIELD_RESEARCH_SPECIAL_BG,
  SOBBLE_FIELD_RESEARCH_STANDARD,
  SOBBLE_SNAPSHOT_INTRO,
  SOBBLE_SNAPSHOT_STEPS,
  SOBBLE_SNAPSHOT_TIPS,
  SOBBLE_SPECIAL_BACKGROUND_SOURCES,
} from '@/app/data/cdSobble'
import {
  FRIGIBAX_CAMPFIRE_REGISTRATION,
  RAICHU_CAMPFIRE_REGISTRATION,
  SKARMORY_CAMPFIRE_REGISTRATION,
  type CampfireResearchPage,
} from '@/app/data/cdCampfireResearch'
import {
  isFestPagerBanners,
  type EventBannerConfig,
  type BannerPerk,
  type BannerPerkDetail,
} from '@/app/data/eventBanners'
import { VIERNES_AMIGOS, isViernesAmigosDay } from '@/app/data/communitySchedule'
import { FONDO_CD_DYNAMIC } from '@/app/utils/alternatingFondoCd'
import { useFondoCdUrl } from '@/hooks/useFondoCdUrl'
import sellodexImg from '@/assets/recursos/sellodex.png'
import shinyIcon from '@/assets/iconos/shiny.png'
import investigacionIcon from '@/assets/iconos/investigacion.png'
import salvajeIcon from '@/assets/iconos/salvaje.png'
import fondoEspecialImg from '@/assets/fondo especial/fondoespecial.webp'
import camaraGoImg from '@/assets/objetos del juego/camaraRA.png'
import cdCommunityTicketImg from '@/assets/objetos del juego/ticket-dia-de-la-comunidad.png'
import lureModuleGoImg from '@/assets/objetos del juego/cebo.png'
import campfireVectorImg from '@/assets/iconos/campfirevector.png'
import iv100Img from '@/assets/iconos/100_ivs.png'
import evolucionIcon from '@/assets/iconos/evolucion.png'
import mtIcon from '@/assets/iconos/mt.png'
import { CAMPFIRE_JOIN_URL } from '@/app/data/communityLinks'
import {
  modalOverlayClass,
  modalOverlayNestedClass,
  modalSheetBodyClass,
  modalSheetLightFlexClass,
  modalSheetNestedClass,
  modalSheetNestedMdClass,
} from '@/app/layout/mobileShellLayout'

import { formatClockLabel } from '@/app/utils/formatTime'

const VIERNES_MODAL_SCHEDULE = `Viernes 29 de Mayo a partir de las ${formatClockLabel(18, 0)}`

const PERK_DETAILS_WITH_VER_HINT: BannerPerkDetail[] = [
  'fieldResearch',
  'iv100',
  'snapshot',
  'specialBackground',
  'baxcalibur',
  'inteleon',
  'temporalResearch',
]

function cdPresentation(eventId: string) {
  if (eventId === 'cd-julio') {
    return {
      pokemonName: 'Sobble',
      iv: SOBBLE_CD_IV,
      fieldResearchIntro: SOBBLE_FIELD_RESEARCH_INTRO,
      fieldResearchStandard: SOBBLE_FIELD_RESEARCH_STANDARD,
      fieldResearchSpecialBg: SOBBLE_FIELD_RESEARCH_SPECIAL_BG,
      specialBackgroundSources: SOBBLE_SPECIAL_BACKGROUND_SOURCES,
      snapshotIntro: SOBBLE_SNAPSHOT_INTRO,
      snapshotSteps: SOBBLE_SNAPSHOT_STEPS,
      snapshotTips: SOBBLE_SNAPSHOT_TIPS,
      isSobble: true as const,
    }
  }
  return {
    pokemonName: 'Frigibax',
    iv: FRIGIBAX_CD_IV,
    fieldResearchIntro: FRIGIBAX_FIELD_RESEARCH_INTRO,
    fieldResearchStandard: FRIGIBAX_FIELD_RESEARCH_STANDARD,
    fieldResearchSpecialBg: FRIGIBAX_FIELD_RESEARCH_SPECIAL_BG,
    specialBackgroundSources: FRIGIBAX_SPECIAL_BACKGROUND_SOURCES,
    snapshotIntro: FRIGIBAX_SNAPSHOT_INTRO,
    snapshotSteps: FRIGIBAX_SNAPSHOT_STEPS,
    snapshotTips: FRIGIBAX_SNAPSHOT_TIPS,
    isSobble: false as const,
  }
}

/** Clicables con estilo blanco (sin degradado ni «Ver ›»). */
const PLAIN_CLICKABLE_PERK_DETAILS: BannerPerkDetail[] = ['lureModule', 'sellodex']

const CAMPFIRE_CTA_CLASS =
  'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#1fb988] hover:bg-[#18a97b] text-white text-[12px] font-black shadow-sm active:scale-[0.98] transition-colors'

type ShinyToggleSize = 'xs' | 'sm' | 'md'

function ShinyToggleButton({
  active,
  onToggle,
  size = 'sm',
  className = '',
  ariaPrefix = 'Ver',
}: {
  active: boolean
  onToggle: () => void
  size?: ShinyToggleSize
  className?: string
  ariaPrefix?: string
}) {
  const shell =
    size === 'xs' ? 'w-5 h-5' : size === 'md' ? 'w-7 h-7' : 'w-6 h-6'
  const icon = size === 'xs' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className={`rounded-full flex items-center justify-center shadow border transition-all active:scale-95 ${
        active ? 'bg-amber-400 border-amber-500' : 'bg-white/95 border-white/90'
      } ${shell} ${className}`}
      aria-label={active ? `${ariaPrefix} versión normal` : `${ariaPrefix} versión shiny`}
    >
      <img src={shinyIcon} alt="" className={`${icon} object-contain`} />
    </button>
  )
}

function PerkNavyIcon({ src, size = 'md' }: { src: string; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'
  return (
    <span
      className={`${dim} shrink-0 inline-block bg-[#0d3b66] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]`}
      style={{ maskImage: `url(${src})`, WebkitMaskImage: `url(${src})` }}
      aria-hidden
    />
  )
}

function CampfireRewardChip({
  reward,
  size = 'md',
  eventId,
}: {
  reward: {
    label: string
    icon?: string
    frigibaxEncounter?: boolean
    sobbleEncounter?: boolean
    specialBackground?: boolean
  }
  size?: 'md' | 'sm'
  eventId?: string
}) {
  const [shiny, setShiny] = useState(false)
  const iconClass = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'
  const cd = cdPresentation(eventId ?? 'cd-frigibax')
  const isFeatured = reward.frigibaxEncounter || reward.sobbleEncounter
  const spriteSrc = isFeatured && shiny ? cd.iv.imageShiny : reward.icon

  return (
    <span className="flex flex-col items-center gap-1 min-w-[4.5rem] max-w-[5.75rem]">
      {spriteSrc && (
        <span className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-sm border border-[#0d3b66]/8">
          {isFeatured && reward.specialBackground && (
            <img src={fondoEspecialImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <img src={spriteSrc} alt="" className={`relative z-[1] ${iconClass} object-contain`} />
          {isFeatured && (
            <ShinyToggleButton
              active={shiny}
              onToggle={() => setShiny((s) => !s)}
              size="xs"
              className="absolute -top-1 -right-1 z-[2]"
              ariaPrefix={cd.pokemonName}
            />
          )}
        </span>
      )}
      <span className="text-[7px] font-bold text-[#0d3b66]/80 text-center leading-tight">{reward.label}</span>
    </span>
  )
}

function CampfireResearchPageBlock({ page }: { page: CampfireResearchPage }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-[#0d3b66]/10 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-[#0d3b66] via-[#0d3b66] to-[#0c4a6e]">
        <p className="text-[10px] font-black uppercase tracking-wide text-white">{page.title}</p>
        <span className="text-[8px] font-black uppercase text-[#0d3b66] shrink-0 bg-white/95 px-2 py-0.5 rounded-full shadow-sm">
          Página completa
        </span>
      </div>
      <div className="p-2 space-y-1.5 bg-gradient-to-b from-teal-50/90 to-white">
        {page.tasks.map((row) => (
          <div
            key={row.task}
            className="flex flex-col gap-2 rounded-xl border border-[#0d3b66]/8 bg-white px-2.5 py-2.5 shadow-sm"
          >
            <p className="text-[10px] font-semibold text-[#0d3b66] leading-snug">{row.task}</p>
            <div className="flex flex-wrap gap-2 justify-end">
              {row.rewards.map((reward) => (
                <CampfireRewardChip key={reward.label} reward={reward} size="sm" />
              ))}
            </div>
          </div>
        ))}
        <div className="rounded-xl border border-[#2563eb]/30 bg-[#2563eb]/10 p-2.5">
          <p className="text-[8px] font-black uppercase text-center text-[#0d3b66]/70 mb-2 tracking-wide">
            Recompensas al completar la página
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {page.pageComplete.map((reward) => (
              <CampfireRewardChip key={reward.label} reward={reward} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CampfireRegistrationResearch({
  registration = FRIGIBAX_CAMPFIRE_REGISTRATION,
}: {
  registration?: { intro: string; pages: CampfireResearchPage[] }
}) {
  const { intro, pages } = registration

  return (
    <div className="space-y-2.5 rounded-2xl border border-[#0d3b66]/10 bg-[#f0f7fc]/80 p-2.5">
      <p className="text-[10px] font-black uppercase tracking-wide text-[#0d3b66]">
        Investigación temporal · Campfire
      </p>
      <p className="text-[11px] font-semibold text-[#0d3b66]/85 leading-relaxed">{intro}</p>
      {pages.map((page) => (
        <CampfireResearchPageBlock key={page.title} page={page} />
      ))}
    </div>
  )
}

function Iv100DetailBody() {
  const [shiny, setShiny] = useState(false)
  const spriteSrc = shiny ? FRIGIBAX_CD_IV.imageShiny : FRIGIBAX_CD_IV.image

  const cpCards = [
    {
      icon: salvajeIcon,
      iconNavy: true,
      context: 'Salvaje',
      cp: FRIGIBAX_CD_IV.wildCp,
      tone: 'from-sky-50 to-blue-100 border-blue-200/70',
    },
    {
      icon: investigacionIcon,
      iconNavy: true,
      context: 'Investigación de campo',
      cp: FRIGIBAX_CD_IV.researchCp,
      tone: 'from-indigo-50 to-violet-100 border-violet-200/70',
    },
  ] as const

  return (
    <div className="space-y-3">
      <div className="rounded-2xl overflow-hidden border border-blue-300/45 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img src={spriteSrc} alt="" className="w-[4.5rem] h-[4.5rem] object-contain drop-shadow" />
            <ShinyToggleButton
              active={shiny}
              onToggle={() => setShiny((s) => !s)}
              size="sm"
              className="absolute top-0 right-0"
              ariaPrefix="Frigibax"
            />
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-2.5">
            <img src={iv100Img} alt="" className="w-11 h-11 object-contain shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase text-blue-950/90 tracking-wide">
                100% IVs
              </p>
              <p className="text-[10px] font-semibold text-[#0d3b66]/75 leading-snug mt-0.5">
                El PC debe coincidir con los siguientes:
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {cpCards.map((card) => (
          <div
            key={card.context}
            className={`rounded-xl border bg-gradient-to-br ${card.tone} p-2.5 flex flex-col items-center text-center shadow-sm`}
          >
            {card.iconNavy ? (
              <PerkNavyIcon src={card.icon} />
            ) : (
              <img src={card.icon} alt="" className="w-9 h-9 object-contain" />
            )}
            <p className="text-[8px] font-black uppercase text-[#0d3b66]/65 tracking-wide mt-1.5 leading-tight">
              {card.context}
            </p>
            <p className="text-[26px] font-black text-[#1fb988] leading-none mt-1 tabular-nums">
              {card.cp.toLocaleString('es-MX')}
            </p>
            <p className="text-[9px] font-black uppercase text-[#0d3b66]/55 mt-0.5">PC</p>
            <span className="mt-1.5 text-[7px] font-black uppercase px-2 py-0.5 rounded-full bg-white/80 text-[#0d3b66]/70 border border-[#0d3b66]/10">
              100% IV
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BaxcaliburDetailBody() {
  const [shiny, setShiny] = useState(false)
  const info = BAXCALIBUR_INFO
  const spriteSrc = shiny ? info.imageShiny : info.image

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5 rounded-xl bg-[#e8f4fc] p-2.5">
        <div className="relative shrink-0">
          <img src={spriteSrc} alt="" className="w-16 h-16 object-contain" />
          <ShinyToggleButton
            active={shiny}
            onToggle={() => setShiny((s) => !s)}
            size="sm"
            className="absolute top-0 right-0"
            ariaPrefix="Baxcalibur"
          />
        </div>
        <div>
          <p className="text-[11px] font-black text-[#0d3b66]">#{info.number} Baxcalibur</p>
          <div className="mt-1">
            <TypeBadgeRow types={[...info.types]} />
          </div>
          <p className="text-[10px] font-semibold text-[#0d3b66]/70 mt-1">
            Ataque {info.stats.attack} · Defensa {info.stats.defense} · Resistencia {info.stats.stamina}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#1fb988]/40 bg-amber-50/80 p-2.5 space-y-1.5">
        <p className="text-[10px] font-black uppercase text-[#1fb988]">Ataque destacado</p>
        <div className="flex items-center gap-2">
          <TypeIcon type={info.communityDayMove.type} className="w-7 h-7" />
          <p className="text-[13px] font-black text-[#0d3b66]">{info.communityDayMove.name}</p>
        </div>
        <p className="text-[10px] font-semibold text-[#0d3b66]/85 leading-relaxed">
          {info.communityDayMove.intro}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase text-[#0d3b66]/70">¿Cómo conseguirlo?</p>

        <div className="rounded-xl border border-[#0d3b66]/10 bg-white p-2.5 space-y-2">
          <p className="text-[10px] font-black text-[#0d3b66]">Evolución</p>
          <div className="flex items-center justify-center gap-1.5 py-0.5">
            <img
              src={info.evolution.fromImage}
              alt=""
              className="h-14 w-14 object-contain"
            />
            <img src={evolucionIcon} alt="" className="h-7 w-7 object-contain shrink-0 opacity-90" />
            <img src={info.image} alt="" className="h-14 w-14 object-contain" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <img src={FRIGIBAX_CANDY.candy} alt="" className="w-5 h-5 object-contain" />
            <span className="text-[12px] font-black text-[#0d3b66]">
              {info.evolution.candyCost} caramelos
            </span>
            <span className="text-[10px] font-semibold text-[#0d3b66]/70">
              ({info.evolution.fromName} → {info.evolution.toName})
            </span>
          </div>
          <p className="text-[10px] font-semibold text-[#0d3b66]/85 leading-relaxed text-center">
            {info.evolution.description}
          </p>
        </div>

        <div className="rounded-xl border border-[#0d3b66]/10 bg-white p-2.5 flex gap-2 items-start">
          <img src={mtIcon} alt="" className="w-9 h-9 object-contain shrink-0" />
          <div>
            <p className="text-[10px] font-black text-[#0d3b66]">MT Élite</p>
            <p className="text-[10px] font-semibold text-[#0d3b66]/85 leading-relaxed mt-0.5">
              {info.eliteTm}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InteleonDetailBody() {
  const info = INTELEON_INFO

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5 rounded-xl bg-[#e8f4fc] p-2.5">
        <img src={info.image} alt="" className="w-16 h-16 object-contain shrink-0" />
        <div>
          <p className="text-[11px] font-black text-[#0d3b66]">#{info.number} Inteleon</p>
          <div className="mt-1">
            <TypeBadgeRow types={[...info.types]} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-400/40 bg-cyan-50/80 p-2.5 space-y-1.5">
        <p className="text-[10px] font-black uppercase text-cyan-700">Ataque destacado del CD</p>
        <div className="flex items-center gap-2">
          <TypeIcon type={info.communityDayMove.type} className="w-7 h-7" />
          <p className="text-[13px] font-black text-[#0d3b66]">{info.communityDayMove.name}</p>
        </div>
        <p className="text-[10px] font-semibold text-[#0d3b66]/85 leading-relaxed">
          {info.communityDayMove.intro}
        </p>
      </div>

      <div className="rounded-xl border border-[#0d3b66]/15 bg-slate-50/90 p-2.5 space-y-1.5">
        <p className="text-[10px] font-black uppercase text-[#0d3b66]/70">Actualización permanente</p>
        <div className="flex items-center gap-2">
          <TypeIcon type={info.permanentMove.type} className="w-7 h-7" />
          <p className="text-[13px] font-black text-[#0d3b66]">{info.permanentMove.name}</p>
        </div>
        <p className="text-[10px] font-semibold text-[#0d3b66]/85 leading-relaxed">
          {info.permanentMove.intro}
        </p>
      </div>

      <div className="rounded-xl border border-[#0d3b66]/10 bg-white p-2.5 space-y-2">
        <p className="text-[10px] font-black text-[#0d3b66]">Evolución</p>
        <div className="flex items-center justify-center gap-1.5 py-0.5">
          <img src={info.evolution.fromImage} alt="" className="h-14 w-14 object-contain" />
          <img src={evolucionIcon} alt="" className="h-7 w-7 object-contain shrink-0 opacity-90" />
          <img src={info.image} alt="" className="h-14 w-14 object-contain" />
        </div>
        <p className="text-[10px] font-semibold text-[#0d3b66]/85 leading-relaxed text-center">
          {info.evolution.description}
        </p>
      </div>
    </div>
  )
}

const SPECIAL_BG_SOURCE_ICONS: Record<string, string> = {
  wild: salvajeIcon,
  fieldResearch: investigacionIcon,
  paidResearch: cdCommunityTicketImg,
  campfireResearch: campfireVectorImg,
  lureModule: lureModuleGoImg,
}

const SPECIAL_BG_NAVY_ICON_IDS = new Set(['wild', 'fieldResearch', 'campfireResearch'])

function SpecialBackgroundDetailBody({
  onSwitchDetail,
  eventId = 'cd-frigibax',
}: {
  onSwitchDetail?: (detail: BannerPerkDetail) => void
  eventId?: string
}) {
  const cd = cdPresentation(eventId)
  const [shiny, setShiny] = useState(false)
  const spriteSrc = shiny ? cd.iv.imageShiny : cd.iv.image

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden border border-rose-300/45 shadow-md">
        <img
          src={fondoEspecialImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-70 brightness-[0.82]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-950/90 via-[#0d3b66]/75 to-[#0d3b66]/40" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative flex gap-3 items-center p-3">
          <div className="relative w-[4.5rem] h-[4.5rem] shrink-0 rounded-xl overflow-hidden border-2 border-white/40 shadow-lg bg-white/10">
            <img src={spriteSrc} alt="" className="w-full h-full object-contain p-1" />
            <ShinyToggleButton
              active={shiny}
              onToggle={() => setShiny((s) => !s)}
              size="xs"
              className="absolute top-0.5 right-0.5"
              ariaPrefix={cd.pokemonName}
            />
          </div>
          <p className="flex-1 min-w-0 text-[11px] font-semibold text-white leading-relaxed drop-shadow-sm">
            {cd.pokemonName} puede traer el <span className="font-black">fondo exclusivo</span> del Día de la
            Comunidad en cualquiera de estos casos:
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {cd.specialBackgroundSources.map((source) => {
          const icon = SPECIAL_BG_SOURCE_ICONS[source.id]
          const useNavy = SPECIAL_BG_NAVY_ICON_IDS.has(source.id)
          return (
            <div
              key={source.id}
              className="rounded-xl border border-[#0d3b66]/10 bg-white p-2.5 flex flex-col items-center text-center gap-1 shadow-sm"
            >
              {useNavy ? (
                <PerkNavyIcon src={icon} />
              ) : (
                <img src={icon} alt="" className="w-9 h-9 object-contain" />
              )}
              <p className="text-[10px] font-black text-[#0d3b66] leading-tight">{source.label}</p>
              <p className="text-[8px] font-semibold text-[#0d3b66]/65 leading-snug">{source.detail}</p>
            </div>
          )
        })}
      </div>

      {onSwitchDetail ? (
        <button
          type="button"
          onClick={() => onSwitchDetail('fieldResearch')}
          className="w-full flex items-center gap-2 rounded-xl border border-amber-300/60 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2.5 text-left active:scale-[0.99] transition-transform"
        >
          <PerkNavyIcon src={investigacionIcon} size="sm" />
          <span className="flex-1 min-w-0 text-[10px] font-black text-[#1fb988] leading-snug">
            Ver investigaciones de campo con fondo especial
          </span>
          <ChevronRight className="w-4 h-4 text-[#1fb988] shrink-0" />
        </button>
      ) : null}
    </div>
  )
}

function InfographicSectionHeader({
  label,
  tone = 'navy',
}: {
  label: string
  tone?: 'navy' | 'amber' | 'violet' | 'rose'
}) {
  const tones = {
    navy: 'from-[#0d3b66] to-[#0c4a6e]',
    amber: 'from-[#1fb988] to-[#f59e0b]',
    violet: 'from-violet-600 to-fuchsia-500',
    rose: 'from-rose-500 to-pink-500',
  }
  return (
    <div
      className={`rounded-lg px-2.5 py-1.5 bg-gradient-to-r ${tones[tone]} shadow-sm`}
    >
      <p className="text-[9px] font-black uppercase tracking-wide text-white">{label}</p>
    </div>
  )
}

function SnapshotDetailBody({ eventId = 'cd-frigibax' }: { eventId?: string }) {
  const cd = cdPresentation(eventId)
  const stepIcons = [Camera, Camera, MapPin, Camera, Clock] as const

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-violet-300/50 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-3 shadow-sm">
        <div className="flex items-start gap-3">
          <img src={camaraGoImg} alt="" className="w-12 h-12 object-contain shrink-0 drop-shadow" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase text-violet-800/90 tracking-wide">
              5 encuentros seguidos
            </p>
            <p className="text-[11px] font-semibold text-[#0d3b66]/90 leading-relaxed mt-1">
              {cd.snapshotIntro}
            </p>
            <div className="flex gap-1 mt-2.5 justify-center sm:justify-start">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className="w-7 h-7 rounded-full bg-violet-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <InfographicSectionHeader label="La mecánica · paso a paso" tone="violet" />

      <div className="rounded-2xl border border-[#0d3b66]/10 bg-white p-2.5 shadow-sm space-y-0">
        {cd.snapshotSteps.map((step, index) => {
          const StepIcon = stepIcons[index] ?? Camera
          const isLast = index === cd.snapshotSteps.length - 1
          return (
            <div key={step} className="flex gap-2.5">
              <div className="flex flex-col items-center shrink-0 w-8">
                <span className="w-7 h-7 rounded-full bg-[#0d3b66] text-white text-[11px] font-black flex items-center justify-center shadow">
                  {index + 1}
                </span>
                {!isLast && <span className="w-0.5 flex-1 min-h-3 my-0.5 bg-[#0d3b66]/12 rounded-full" />}
              </div>
              <div className={`flex-1 min-w-0 flex gap-2 ${isLast ? 'pb-0' : 'pb-2.5'}`}>
                <div className="w-8 h-8 shrink-0 rounded-lg bg-violet-50 border border-violet-200/60 flex items-center justify-center">
                  <StepIcon className="w-4 h-4 text-[#0d3b66]" strokeWidth={2} />
                </div>
                <p className="text-[10px] font-semibold text-[#0d3b66]/90 leading-relaxed pt-0.5">{step}</p>
              </div>
            </div>
          )
        })}
      </div>

      <InfographicSectionHeader label="Ten en cuenta" tone="amber" />

      <div className="space-y-2">
        {cd.snapshotTips.map((tip) => (
          <div
            key={tip}
            className="flex gap-2 rounded-xl border border-amber-200/70 bg-amber-50/90 px-2.5 py-2 shadow-sm"
          >
            <span className="w-5 h-5 shrink-0 rounded-full bg-[#1fb988] text-white text-[9px] font-black flex items-center justify-center mt-0.5">
              !
            </span>
            <p className="text-[10px] font-semibold text-[#0d3b66]/90 leading-relaxed">{tip}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-[#0d3b66]/5 border border-[#0d3b66]/10 px-3 py-2">
        <img src={FRIGIBAX_CD_IV.image} alt="" className="w-10 h-10 object-contain shrink-0" />
        <p className="text-[9px] font-bold text-[#0d3b66]/75 leading-snug">
          Photobomb del Pokémon del día → captura al lado en el mapa → repite hasta completar los 5.
        </p>
      </div>
    </div>
  )
}

function FieldResearchSpecialRow({ task, reward }: { task: string; reward: string }) {
  const [shiny, setShiny] = useState(false)
  const spriteSrc = shiny ? FRIGIBAX_CD_IV.imageShiny : FRIGIBAX_CD_IV.image

  return (
    <div className="rounded-xl border border-[#2563eb]/35 bg-[#e8f4fc]/60 p-2.5 flex items-center gap-2">
      <PerkNavyIcon src={investigacionIcon} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-[#0d3b66] leading-snug">{task}</p>
        <p className="text-[10px] font-semibold text-[#0d3b66]/75 mt-0.5">→ {reward}</p>
      </div>
      <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-[#0d3b66]/15 shadow-inner">
        <img src={fondoEspecialImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <img src={spriteSrc} alt="" className="absolute inset-0 w-full h-full object-contain z-[1] p-0.5" />
        <ShinyToggleButton
          active={shiny}
          onToggle={() => setShiny((s) => !s)}
          size="xs"
          className="absolute top-0 right-0 z-[2]"
          ariaPrefix="Frigibax"
        />
      </div>
    </div>
  )
}

const PERK_TILE_STYLES: Partial<
  Record<BannerPerkDetail, { box: string; label: string; hint: string }>
> = {
  fieldResearch: {
    box: 'bg-gradient-to-br from-teal-50 via-cyan-50 to-cyan-100 border-[#2563eb]/70 shadow-md hover:border-teal-500 hover:shadow-lg',
    label: 'text-[#0d3b66]',
    hint: 'text-teal-700',
  },
  iv100: {
    box: 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 border-blue-400/70 shadow-md hover:border-blue-500 hover:shadow-lg',
    label: 'text-blue-950',
    hint: 'text-blue-700',
  },
  snapshot: {
    box: 'bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-100 border-violet-400/70 shadow-md hover:border-violet-500 hover:shadow-lg',
    label: 'text-violet-950',
    hint: 'text-violet-700',
  },
  specialBackground: {
    box: 'bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-100 border-rose-400/70 shadow-md hover:border-rose-500 hover:shadow-lg',
    label: 'text-rose-950',
    hint: 'text-rose-700',
  },
  baxcalibur: {
    box: 'bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 border-amber-400/70 shadow-md hover:border-amber-500 hover:shadow-lg',
    label: 'text-amber-950',
    hint: 'text-amber-800',
  },
  inteleon: {
    box: 'bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 border-cyan-400/70 shadow-md hover:border-cyan-500 hover:shadow-lg',
    label: 'text-cyan-950',
    hint: 'text-cyan-800',
  },
  lureModule: {
    box: 'bg-gradient-to-br from-teal-50 via-sky-50 to-cyan-100 border-[#2563eb]/70 shadow-md hover:border-teal-500 hover:shadow-lg',
    label: 'text-[#0d3b66]',
    hint: 'text-teal-700',
  },
  sellodex: {
    box: 'bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-100 border-[#2563eb]/70 shadow-md hover:border-teal-500 hover:shadow-lg',
    label: 'text-[#0d3b66]',
    hint: 'text-teal-700',
  },
  temporalResearch: {
    box: 'bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-100 border-indigo-400/70 shadow-md hover:border-indigo-500 hover:shadow-lg',
    label: 'text-indigo-950',
    hint: 'text-indigo-700',
  },
}

const DEFAULT_SELLODEX_NOTE =
  'El SelloDex es un pasaporte de sellos de la comunidad. En este evento podrás recibir un sello si asistes a la reunión y te registras en Campfire.'

function PerkDetailModal({
  detail,
  eventId = 'cd-frigibax',
  sellodexNote,
  showCampfireResearch,
  campfireRegistration,
  temporalResearch,
  onClose,
  onSwitchDetail,
}: {
  detail: BannerPerkDetail
  eventId?: string
  sellodexNote?: string
  showCampfireResearch?: boolean
  campfireRegistration?: { intro: string; pages: CampfireResearchPage[] }
  temporalResearch?: EventBannerConfig['temporalResearch']
  onClose: () => void
  onSwitchDetail?: (detail: BannerPerkDetail) => void
}) {
  const cd = cdPresentation(eventId)
  const title =
    detail === 'iv100'
      ? 'PC de 100% IVs'
      : detail === 'fieldResearch'
        ? 'Investigación de campo'
        : detail === 'baxcalibur'
          ? 'Baxcalibur'
          : detail === 'inteleon'
            ? 'Inteleon'
          : detail === 'snapshot'
            ? 'GO Snapshot'
            : detail === 'sellodex'
                ? 'SELLODEX'
                : detail === 'temporalResearch'
                  ? 'Investigación temporal'
                  : 'Fondo especial'

  const nestedSheetClass =
    detail === 'sellodex' && (showCampfireResearch || campfireRegistration)
      ? modalSheetNestedMdClass
      : detail === 'snapshot' || detail === 'specialBackground' || detail === 'fieldResearch' || detail === 'iv100' || detail === 'temporalResearch' || detail === 'inteleon'
        ? modalSheetNestedMdClass
        : modalSheetNestedClass

  return createPortal(
    <div className={modalOverlayNestedClass} onClick={onClose}>
      <div
        className={nestedSheetClass}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="perk-detail-title"
      >
        <div className="shrink-0 flex justify-between items-center gap-2 px-3 sm:px-4 pt-3 pb-2.5 border-b border-gray-100 bg-white">
          <h4 id="perk-detail-title" className="text-[13px] font-black text-[#0d3b66] leading-snug pr-2 uppercase tracking-wide">
            {title}
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3 pb-4 modal-sheet-body">
        {detail === 'iv100' && <Iv100DetailBody />}

        {detail === 'fieldResearch' && (
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-[#0d3b66]/85 leading-relaxed">
              {cd.fieldResearchIntro}
            </p>
            <div className="rounded-xl border border-[#0d3b66]/10 bg-slate-50/80 p-3 space-y-2.5">
              <div className="flex gap-2 items-start">
                <PerkNavyIcon src={investigacionIcon} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase text-[#0d3b66]/70">
                    Investigación habitual
                  </p>
                  <p className="text-[11px] font-bold text-[#0d3b66] leading-snug">
                    {cd.fieldResearchStandard.task}
                  </p>
                </div>
              </div>
              <p className="text-[8px] font-black uppercase text-[#0d3b66]/55 tracking-wide text-center">
                Posibles recompensas
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {cd.fieldResearchStandard.rewards.map((reward) => (
                  <CampfireRewardChip key={reward.label} reward={reward} size="sm" eventId={eventId} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-[#0d3b66]/70">
                Investigaciones con fondo especial
              </p>
              {cd.fieldResearchSpecialBg.map((row) => (
                <FieldResearchSpecialRow key={row.task} task={row.task} reward={row.reward} />
              ))}
            </div>
          </div>
        )}

        {detail === 'specialBackground' && (
          <SpecialBackgroundDetailBody onSwitchDetail={onSwitchDetail} eventId={eventId} />
        )}

        {detail === 'snapshot' && <SnapshotDetailBody eventId={eventId} />}

        {detail === 'baxcalibur' && <BaxcaliburDetailBody />}

        {detail === 'inteleon' && <InteleonDetailBody />}

        {detail === 'sellodex' && (
          <div className="space-y-3">
            <div className="flex gap-3 items-start rounded-xl border border-[#2563eb]/35 bg-[#f0f7fc]/70 p-3">
              <img
                src={sellodexImg}
                alt="SelloDex"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
              />
              <p className="flex-1 min-w-0 text-[11px] font-semibold text-[#0d3b66]/90 leading-relaxed">
                {sellodexNote ?? DEFAULT_SELLODEX_NOTE}
              </p>
            </div>
            {showCampfireResearch && <CampfireRegistrationResearch />}
            {campfireRegistration && !showCampfireResearch && (
              <CampfireRegistrationResearch registration={campfireRegistration} />
            )}
            <a
              href={CAMPFIRE_JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={CAMPFIRE_CTA_CLASS}
            >
              Registro en Campfire
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        )}

        {detail === 'temporalResearch' && temporalResearch && (
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-[#0d3b66]/85 leading-relaxed">
              {temporalResearch.intro}
            </p>
            <div className="rounded-xl border border-[#0d3b66]/10 bg-slate-50/80 p-3 space-y-2.5">
              <p className="text-[10px] font-black uppercase text-[#0d3b66]/70">
                Recompensas
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {temporalResearch.rewards.map((reward) => (
                  <CampfireRewardChip key={reward.label} reward={reward} size="sm" />
                ))}
              </div>
            </div>
            <p className="text-[10px] font-semibold text-[#0d3b66]/75 leading-relaxed">
              {temporalResearch.note}
            </p>
          </div>
        )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function isPerkDetailAvailable(perk: BannerPerk, config: EventBannerConfig): boolean {
  if (!perk.detail) return false
  if (perk.detail === 'lureModule') return Boolean(config.lureModuleNote)
  return true
}

function PerkTile({
  perk,
  accent,
  config,
  onDetail,
}: {
  perk: BannerPerk
  accent: string
  config: EventBannerConfig
  onDetail?: (detail: BannerPerkDetail) => void
}) {
  const clickable = Boolean(onDetail && isPerkDetailAvailable(perk, config))
  const isPlainClickable =
    clickable && perk.detail != null && PLAIN_CLICKABLE_PERK_DETAILS.includes(perk.detail)
  const style =
    perk.detail && !isPlainClickable ? PERK_TILE_STYLES[perk.detail] : undefined
  const Tag = clickable ? 'button' : 'div'

  return (
    <Tag
      type={clickable ? 'button' : undefined}
      onClick={clickable ? () => onDetail!(perk.detail!) : undefined}
      className={`relative flex items-center gap-2 rounded-xl p-2 border min-h-[48px] w-full text-left transition-all active:scale-[0.98] ${
        style?.box ?? `bg-white shadow-sm ${clickable ? 'hover:border-teal-500' : ''}`
      }`}
      style={style ? undefined : { borderColor: `${accent}28` }}
    >
      {perk.useCameraIcon ? (
        <Camera className="w-9 h-9 shrink-0 text-[#0d3b66]" strokeWidth={1.75} />
      ) : perk.iconNavy ? (
        <PerkNavyIcon src={perk.icon} />
      ) : (
        <img src={perk.icon} alt="" className="w-9 h-9 object-contain shrink-0" />
      )}
      <span className={`text-[10px] font-bold leading-snug flex-1 pr-1 ${style?.label ?? 'text-[#0d3b66]'}`}>
        {perk.label}
      </span>
      {clickable && style && perk.detail && PERK_DETAILS_WITH_VER_HINT.includes(perk.detail) && (
        <span className={`text-[8px] font-black uppercase shrink-0 ${style.hint}`}>Ver ›</span>
      )}
    </Tag>
  )
}

function EventBannerCard({ config }: { config: EventBannerConfig }) {
  const [perkDetail, setPerkDetail] = useState<BannerPerkDetail | null>(null)
  const [showLureNote, setShowLureNote] = useState(false)
  const [heroShiny, setHeroShiny] = useState(false)
  const fondoCdUrl = useFondoCdUrl()
  const bannerSrc =
    config.banner === FONDO_CD_DYNAMIC ? (fondoCdUrl ?? config.banner) : config.banner
  const canToggleHeroShiny = Boolean(config.heroImageShiny)
  const isSuperMegaDay = config.id.startsWith('supermega-')
  const heroShinyAriaPrefix =
    config.id === 'supermega-skarmory'
      ? 'Mega-Skarmory'
      : config.id === 'supermega-raichu'
        ? 'Mega-Raichu'
        : config.id === 'cd-julio'
          ? 'Sobble'
          : 'Frigibax'
  const heroBlendClass = config.heroBlendScreen ? 'mix-blend-screen' : ''
  const heroLarge = isSuperMegaDay
  const isSelloDex =
    config.selloDex === true ||
    config.subtitle?.includes('SelloDex') ||
    config.badge === 'Día de la Comunidad'
  const hasDualHero = Boolean(config.heroImage && config.heroImageSecondary)
  // Wallpaper a pantalla completa (p. ej. MegaRaichu.png): sin tinte de color del accent.
  const photoHero = config.photoHero === true || config.id === 'supermega-raichu'
  const scheduleColor = config.scheduleColor ?? '#2563eb'
  const hasSellodexPerk = config.perks?.some((p) => p.detail === 'sellodex') ?? false

  const handlePerkDetail = (detail: BannerPerkDetail) => {
    if (detail === 'lureModule') {
      setShowLureNote((v) => !v)
      setPerkDetail(null)
      return
    }
    setShowLureNote(false)
    setPerkDetail(detail)
  }

  return (
    <>
    {perkDetail && perkDetail !== 'lureModule' && (
      <PerkDetailModal
        detail={perkDetail}
        eventId={config.id}
        sellodexNote={config.sellodexNote}
        showCampfireResearch={config.id === 'cd-frigibax'}
        campfireRegistration={
          config.id === 'supermega-skarmory'
            ? SKARMORY_CAMPFIRE_REGISTRATION
            : config.id === 'supermega-raichu'
              ? RAICHU_CAMPFIRE_REGISTRATION
              : undefined
        }
        temporalResearch={config.temporalResearch}
        onClose={() => setPerkDetail(null)}
        onSwitchDetail={setPerkDetail}
      />
    )}
    <article className="rounded-2xl overflow-hidden border border-[#0d3b66]/10 shadow-lg bg-white">
      <div className="relative h-36 sm:h-44">
        <img src={bannerSrc} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
        {!photoHero && (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${config.accent}ee 0%, ${config.accent}60 45%, ${config.accent}22 100%)`,
            }}
          />
        )}
        {photoHero && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to top, ${config.accent}f2 0%, ${config.accent}99 28%, ${config.accent}33 55%, transparent 78%)`,
            }}
          />
        )}
        {hasDualHero ? (
          <div className="absolute bottom-0 right-0 z-[5] flex h-full w-[62%] items-end justify-end pointer-events-none pr-0.5">
            {config.heroImageSecondary && (
              <img
                src={config.heroImageSecondary}
                alt=""
                className="h-[74%] max-w-[46%] object-contain object-bottom drop-shadow-lg -mr-6 sm:-mr-8"
              />
            )}
            {config.heroImage && (
              <img
                src={config.heroImage}
                alt=""
                className="h-[90%] max-w-[52%] object-contain object-bottom drop-shadow-lg relative z-10"
              />
            )}
          </div>
        ) : photoHero && config.heroImage ? (
          <img
            src={config.heroImage}
            alt=""
            className="absolute bottom-3 right-3 z-[5] h-14 w-14 sm:h-16 sm:w-16 object-contain drop-shadow-lg"
          />
        ) : (
          <>
            {config.heroImageSecondary && (
              <button
                type="button"
                onClick={() => setPerkDetail('baxcalibur')}
                className="absolute bottom-0 right-[38%] sm:right-[36%] z-[6] h-[72%] max-w-[38%] flex flex-col items-center justify-end active:scale-[0.97] transition-transform"
                aria-label="Ver información de Baxcalibur"
              >
                <img
                  src={config.heroImageSecondary}
                  alt=""
                  className="h-full w-full object-contain object-bottom drop-shadow-lg pointer-events-none"
                />
                <span className="mb-1 text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-white/90 text-[#0d3b66] shadow">
                  Baxcalibur
                </span>
              </button>
            )}
            {config.heroImage && (
              <div
                className={`absolute bottom-0 right-0 z-[7] flex items-end justify-end pointer-events-none ${
                  heroLarge ? 'h-[102%] max-w-[62%]' : 'h-[88%] max-w-[48%] right-1'
                }`}
              >
                <div className={`relative h-full w-full ${heroLarge ? 'min-w-[10rem]' : 'min-w-[7rem]'}`}>
                  <img
                    src={config.heroImage}
                    alt=""
                    aria-hidden={canToggleHeroShiny && heroShiny}
                    className={`absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-lg transition-opacity duration-200 ${heroBlendClass} ${
                      canToggleHeroShiny && heroShiny ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  {canToggleHeroShiny && config.heroImageShiny && (
                    <img
                      src={config.heroImageShiny}
                      alt=""
                      aria-hidden={!heroShiny}
                      className={`absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-lg transition-opacity duration-200 ${heroBlendClass} ${
                        heroShiny ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  )}
                </div>
                {canToggleHeroShiny && !perkDetail && (
                  <ShinyToggleButton
                    active={heroShiny}
                    onToggle={() => setHeroShiny((s) => !s)}
                    size="sm"
                    className="pointer-events-auto absolute top-0.5 right-0.5"
                    ariaPrefix={heroShinyAriaPrefix}
                  />
                )}
              </div>
            )}
          </>
        )}
        <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1.5">
          {config.badge && config.badge !== 'Día de la Comunidad' && (
            <span className="text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/95 text-[#0d3b66] shadow">
              {config.badge}
            </span>
          )}
          {isSelloDex && (
            <span
              className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white shadow"
              style={{ backgroundColor: config.selloDexBadgeColor ?? '#2563eb' }}
            >
              <img src={sellodexImg} alt="" className="w-3.5 h-3.5 object-contain" />
              SELLODEX
            </span>
          )}
        </div>
        <div
          className={`absolute bottom-2.5 left-3 z-10 ${
            hasDualHero ? 'right-[38%]' : canToggleHeroShiny ? (heroLarge ? 'right-[54%]' : 'right-[46%]') : 'right-[42%]'
          }`}
        >
          {config.subtitle && (
            <p className="text-[10px] font-bold text-white/90 uppercase tracking-wide">{config.subtitle}</p>
          )}
          <h3 className="text-[15px] sm:text-[17px] font-black text-white leading-tight drop-shadow">
            {config.title}
          </h3>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-2.5">
        {config.id !== VIERNES_AMIGOS.id && config.badge !== 'Día de la Comunidad' && (
          <p className="text-[12px] font-black leading-snug" style={{ color: scheduleColor }}>
            {config.title}
          </p>
        )}
        <p className="text-[13px] text-[#0d3b66]/90 leading-relaxed font-medium">
          {config.description}
        </p>

        {config.perks && config.perks.length > 0 && (
          <div className="grid grid-cols-2 gap-2 p-0.5 rounded-2xl bg-[#e8f4fc]/50">
            {config.perks.map((perk) => (
              <PerkTile
                key={perk.label}
                perk={perk}
                accent={config.accent}
                config={config}
                onDetail={handlePerkDetail}
              />
            ))}
          </div>
        )}

        {showLureNote && config.lureModuleNote && (
          <div className="rounded-xl border border-[#06b6d4]/25 bg-[#f0f7fc]/80 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase text-[#0d3b66]/70 tracking-wide mb-1">
              Módulos señuelo
            </p>
            <p className="text-[11px] font-semibold text-[#0d3b66]/85 leading-relaxed">
              {config.lureModuleNote}
            </p>
          </div>
        )}

        {config.footerNote && (
          <p className="text-[11px] font-bold text-[#0d3b66]/70 bg-slate-50 rounded-lg px-3 py-2">
            {config.footerNote}
          </p>
        )}

        {isSelloDex && !hasSellodexPerk && (
          <a
            href={CAMPFIRE_JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={CAMPFIRE_CTA_CLASS}
          >
            Registro en Campfire
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {config.mapsUrl && config.locationName && (
          <a
            href={config.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-[#0d3b66]/10 p-3 hover:border-teal-500 transition-colors"
          >
            <MapPin className="w-4 h-4 text-[#2563eb] shrink-0" />
            <span className="text-[12px] font-bold text-[#0d3b66]">{config.locationName}</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 ml-auto shrink-0" />
          </a>
        )}
      </div>
    </article>
    </>
  )
}

function FestBannerPager({
  banners,
  initialPage,
}: {
  banners: EventBannerConfig[]
  initialPage: number
}) {
  const [index, setIndex] = useState(initialPage)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    setIndex(initialPage)
  }, [initialPage])

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current
          touchStartX.current = null
          if (start == null) return
          const delta = e.changedTouches[0].clientX - start
          if (delta < -40) setIndex(1)
          else if (delta > 40) setIndex(0)
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((config) => (
            <div key={config.id} className="w-full shrink-0">
              <EventBannerCard config={config} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-2">
        {(['Sábado', 'Domingo'] as const).map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setIndex(i)}
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide transition-all ${
              i === index
                ? 'bg-[#2563eb] text-white shadow'
                : 'bg-[#0d3b66]/10 text-[#0d3b66]/70 hover:bg-[#0d3b66]/15'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function EventDayInfographicModal({
  day,
  banners,
  initialPage = 0,
  onClose,
  onCommunityDetail,
}: {
  day: Date
  banners: EventBannerConfig[]
  initialPage?: number
  onClose: () => void
  onCommunityDetail?: (communityEventId: string) => void
}) {
  const festPager = isFestPagerBanners(banners)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return createPortal(
    <div className={modalOverlayClass} onClick={onClose}>
      <div
        className={modalSheetLightFlexClass}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="shrink-0 z-20 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#f0f7fc]/95 backdrop-blur border-b border-[#0d3b66]/10">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase text-[#2563eb] tracking-wide">
              {festPager ? 'GO Fest · SelloDex' : banners.length === 1 ? 'Evento' : `${banners.length} eventos`}
            </p>
            <h2 className="text-[14px] font-black text-[#0d3b66] leading-snug uppercase">
              {festPager
                ? 'GO Fest 2026 · Sello sábado y domingo'
                : infographicModalTitle(day, banners)}
            </h2>
            {festPager ? (
              <p className="text-[11px] font-semibold text-[#0d3b66]/60 mt-0.5">
                Desliza o usa las pestañas para ver cada día
              </p>
            ) : (
              banners.length !== 1 && (
                <p className="text-[11px] font-semibold text-[#0d3b66]/60 capitalize mt-0.5">
                  Activo el {format(day, "EEEE d 'de' MMMM", { locale: es })}
                </p>
              )
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white shadow text-gray-600 hover:bg-gray-50"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`${modalSheetBodyClass} flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 sm:space-y-4 pb-6`}
        >
          {festPager ? (
            <FestBannerPager banners={banners} initialPage={initialPage} />
          ) : (
            banners.map((config) => (
              <div key={config.id}>
                {config.id.startsWith('community-') && onCommunityDetail ? (
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => onCommunityDetail(config.id.replace('community-', ''))}
                  >
                    <EventBannerCard config={config} />
                    <p className="text-[10px] font-bold text-[#2563eb] text-center mt-1">
                      Toca para más detalles del evento
                    </p>
                  </button>
                ) : (
                  <EventBannerCard config={config} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function formatGoEventSchedule(event: { startDate: string; endDate: string }): string {
  const start = parseISO(event.startDate)
  const end = parseISO(event.endDate)
  if (event.startDate === event.endDate) {
    return format(start, "EEEE d 'de' MMMM yyyy", { locale: es })
  }
  return `Del ${format(start, "d 'de' MMMM", { locale: es })} al ${format(end, "d 'de' MMMM yyyy", { locale: es })}`
}

export function formatCommunitySchedule(startsAt: string, endsAt: string): string {
  const start = parseISO(startsAt)
  const end = parseISO(endsAt)
  const sameDay = format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')
  if (sameDay) {
    return `${format(start, "EEEE d 'de' MMMM yyyy", { locale: es })} · ${format(start, 'HH:mm', { locale: es })} – ${format(end, 'HH:mm', { locale: es })}`
  }
  return `Del ${format(start, "d 'de' MMMM", { locale: es })} al ${format(end, "d 'de' MMMM yyyy", { locale: es })}`
}

function bannerDurationLabel(banner: EventBannerConfig): string {
  return banner.duration ?? banner.schedule
}

function formatInfographicHeaderRange(banners: EventBannerConfig[]): string {
  if (banners.length === 0) return ''
  if (banners.length === 1) return bannerDurationLabel(banners[0])
  return banners.map((b) => bannerDurationLabel(b)).join(' · ')
}

function infographicModalTitle(day: Date, banners: EventBannerConfig[]): string {
  if (isViernesAmigosDay(day) && banners.some((b) => b.id === VIERNES_AMIGOS.id)) {
    return VIERNES_MODAL_SCHEDULE
  }
  return formatInfographicHeaderRange(banners)
}
