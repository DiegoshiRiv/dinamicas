import { getTypeIcon } from '@/app/data/pokemonTypes'

export function TypeIcon({ type, className = 'w-5 h-5' }: { type: string; className?: string }) {
  const src = getTypeIcon(type)
  if (!src) return null
  return <img src={src} alt="" className={`object-contain shrink-0 ${className}`} title={type} />
}

export function TypeBadge({
  type,
  showLabel = true,
  iconClassName = 'w-5 h-5',
}: {
  type: string
  showLabel?: boolean
  iconClassName?: string
}) {
  const src = getTypeIcon(type)
  if (!src) {
    return showLabel ? (
      <span className="text-[10px] font-bold text-[#0d3b66]/80">{type}</span>
    ) : null
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-white/80 px-1 py-0.5 shadow-sm border border-[#0d3b66]/8">
      <img src={src} alt="" className={`object-contain shrink-0 ${iconClassName}`} />
      {showLabel && (
        <span className="text-[9px] font-black uppercase text-[#0d3b66]/90 pr-0.5">{type}</span>
      )}
    </span>
  )
}

export function TypeBadgeRow({ types, iconOnly = false }: { types: string[]; iconOnly?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1">
      {types.map((type) =>
        iconOnly ? (
          <TypeIcon key={type} type={type} className="w-6 h-6" />
        ) : (
          <TypeBadge key={type} type={type} />
        ),
      )}
    </div>
  )
}
