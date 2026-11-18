type HeaderFondoCoverProps = {
  url: string
}

/** Portada full-bleed según el tipo de evento activo. */
export function HeaderFondoCover({ url }: HeaderFondoCoverProps) {
  return (
    <div className="absolute inset-0">
      <img
        src={url}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        draggable={false}
        decoding="async"
        fetchPriority="high"
      />
    </div>
  )
}
