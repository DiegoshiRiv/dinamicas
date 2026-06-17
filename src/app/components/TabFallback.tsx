export function TabFallback() {
  return (
    <div className="flex items-center justify-center py-16" aria-busy="true" aria-label="Cargando">
      <div className="h-8 w-8 rounded-full border-[3px] border-[#2563eb]/25 border-t-[#2563eb] animate-spin" />
    </div>
  )
}
