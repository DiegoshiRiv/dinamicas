import { useCallback, useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ExternalLink,
  X,
  Plus,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Checkbox } from '@/app/components/ui/checkbox'
import { useEvents, type CommunityEvent, type CommunityEventInput } from '@/hooks/useEvents'
import {
  formatEventDateLine,
  isEventLive,
  eventDayKey,
  dateToDayKey,
  buildPokemonGoEventsByDay,
  getPokemonGoDayStyle,
  filterGoEventsForDay,
  getCalendarMarkerGoEvents,
} from '@/app/utils/eventDates'
import { ACTIVE_POKEMON_GO_EVENTS } from '@/app/data/pokemonGoEvents'
import { isViernesAmigosDay, VIERNES_AMIGOS } from '@/app/data/communitySchedule'
import {
  bannerForCommunityEvent,
  bannerForGoEvent,
  bannerForViernesAmigos,
  bannersForFestGlobal,
  festBannerPageIndex,
  isFestGlobalDay,
  type EventBannerConfig,
} from '@/app/data/eventBanners'
import {
  EventDayInfographicModal,
  formatCommunitySchedule,
  formatGoEventSchedule,
} from '@/app/components/EventDayInfographic'
import { UpcomingCommunityEvents } from '@/app/components/UpcomingCommunityEvents'
import { optimizeImageFile } from '@/app/utils/optimizeImageFile'
import { meetingPoints } from '@/app/data/meetingPoints'
import { CAMPFIRE_JOIN_URL } from '@/app/data/communityLinks'
import tiempoLibreLogo from '@/assets/logos/tiempolibre.png'
import communityDayLogo from '@/assets/logos/diadelacomunidad.png'
import {
  modalOverlayClass,
  modalSheetBodyClass,
  modalSheetWhiteClass,
} from '@/app/layout/mobileShellLayout'

const DEFAULT_LOCATION = meetingPoints.find((p) => p.isMain) ?? meetingPoints[0]

const EMPTY_FORM = {
  title: '',
  description: '',
  pokemon_image_url: '',
  date: '',
  startTime: '14:00',
  endTime: '17:00',
  has_stamp: false,
  location_name: DEFAULT_LOCATION.name,
  location_maps_url: DEFAULT_LOCATION.mapsUrl,
  wild_iv_cp: '',
  research_iv_cp: '',
  researchTasks: '',
}

function buildIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString()
}

function EventDetailModal({
  event,
  onClose,
}: {
  event: CommunityEvent
  onClose: () => void
}) {
  const live = isEventLive(event.starts_at, event.ends_at)
  const tasks = event.special_research_tasks?.filter(Boolean) ?? []

  return (
    <div className={modalOverlayClass} onClick={onClose}>
      <div className={modalSheetWhiteClass} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex justify-end p-3 bg-white/95 backdrop-blur border-b border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {event.pokemon_image_url && (
          <div className="px-5 pt-2">
            <img
              src={event.pokemon_image_url}
              alt=""
              className="w-full max-h-40 sm:max-h-52 object-contain rounded-2xl bg-[#e8f4fc]"
            />
          </div>
        )}

        <div className={`${modalSheetBodyClass} px-5 pt-4 space-y-3 sm:space-y-4`}>
          {live && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide px-3 py-1 rounded-full bg-[#2563eb] text-white">
              <Sparkles className="w-3.5 h-3.5" />
              En curso ahora
            </span>
          )}

          <p className="text-[13px] font-semibold text-[#0d3b66]/80 leading-snug">
            {formatEventDateLine(event.starts_at, event.ends_at)}
          </p>

          <h2 className="text-xl font-black text-[#0d3b66] leading-tight">{event.title}</h2>

          <p className="text-[14px] text-[#0d3b66]/90 leading-relaxed">{event.description}</p>

          {live && event.has_stamp && (
            <div className="rounded-2xl border-2 border-[#2563eb] bg-[#f0f7fc]/80 p-4 flex gap-3 items-start">
              <img src={sellodexImg} alt="SelloDex" className="w-16 h-16 object-contain shrink-0" />
              <div className="space-y-2 text-[13px] font-bold text-[#0d3b66] leading-snug">
                <p>Recuerda llevar tu SelloDex y hacer tu registro en Campfire para recibir el sello.</p>
                <a
                  href={CAMPFIRE_JOIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#2563eb] underline underline-offset-2"
                >
                  Unirme en Campfire
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {!live && (
            <p className="text-[13px] font-bold text-[#0d3b66]/90">
              {event.has_stamp
                ? 'SelloDex: Recuerda llevar tu SelloDex.'
                : 'En esta ocasión no habrá sello.'}
            </p>
          )}

          {live && (event.wild_iv_cp != null || event.research_iv_cp != null || tasks.length > 0) && (
            <div className="rounded-2xl border border-[#0d3b66]/10 bg-[#e8f4fc]/60 p-4 space-y-3">
              <p className="text-[12px] font-black uppercase tracking-wide text-[#0d3b66]">
                Datos útiles del evento
              </p>
              {(event.wild_iv_cp != null || event.research_iv_cp != null) && (
                <p className="text-[13px] font-bold text-[#0d3b66] leading-snug">
                  100% IVs PC Máximo
                  {event.wild_iv_cp != null && (
                    <>
                      {' '}
                      = Salvaje {event.wild_iv_cp.toLocaleString('es-MX')} PC
                    </>
                  )}
                  {event.research_iv_cp != null && (
                    <>
                      {event.wild_iv_cp != null ? ',' : ''} Investigación{' '}
                      {event.research_iv_cp.toLocaleString('es-MX')} PC
                    </>
                  )}
                  .
                </p>
              )}
              {tasks.length > 0 && (
                <div>
                  <p className="text-[12px] font-bold text-[#0d3b66]/80 mb-2">
                    Las siguientes investigaciones implicarán encuentros con Pokémon con Fondo Especial:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-[13px] font-semibold text-[#0d3b66]">
                    {tasks.map((task) => (
                      <li key={task}>{task}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[10px] text-[#0d3b66]/50">
                Referencia:{' '}
                <a
                  href="https://db.pokemongohub.net/es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Pokémon GO Hub
                </a>
              </p>
            </div>
          )}

          <a
            href={event.location_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-[#0d3b66]/10 bg-white p-3.5 hover:border-teal-500 transition-colors group"
          >
            <div className="p-2 rounded-xl bg-[#2563eb] text-white shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-[#2563eb] uppercase tracking-wide">Ubicación</p>
              <p className="text-[14px] font-black text-[#0d3b66] truncate">{event.location_name}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-[#0d3b66]/40 group-hover:text-[#2563eb] shrink-0" />
          </a>
        </div>
      </div>
    </div>
  )
}

function dayHasEvents(
  key: string,
  communityByDay: Map<string, CommunityEvent[]>,
  goByDay: Map<string, import('@/app/data/pokemonGoEvents').PokemonGoEvent[]>,
): boolean {
  return (
    (communityByDay.get(key)?.length ?? 0) > 0 ||
    key === VIERNES_AMIGOS.date ||
    getCalendarMarkerGoEvents(goByDay.get(key) ?? []).length > 0 ||
    filterGoEventsForDay(ACTIVE_POKEMON_GO_EVENTS, key).length > 0
  )
}

export function EventsBoard({ isAdmin }: { isAdmin: boolean }) {
  const { events, createEvent, updateEvent, deleteEvent } = useEvents()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [infographicDay, setInfographicDay] = useState<Date | null>(null)
  const [infographicPage, setInfographicPage] = useState(0)
  const [detailEvent, setDetailEvent] = useState<CommunityEvent | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [imageName, setImageName] = useState('')
  const [processingImage, setProcessingImage] = useState(false)
  const [saving, setSaving] = useState(false)

  const liveEvents = useMemo(
    () => events.filter((e) => isEventLive(e.starts_at, e.ends_at)),
    [events],
  )

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CommunityEvent[]>()
    for (const ev of events) {
      const key = eventDayKey(ev.starts_at)
      const list = map.get(key) ?? []
      list.push(ev)
      map.set(key, list)
    }
    return map
  }, [events])

  const goEventsByDay = useMemo(() => buildPokemonGoEventsByDay(ACTIVE_POKEMON_GO_EVENTS), [])

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const buildDayBanners = useCallback(
    (day: Date): EventBannerConfig[] => {
      const key = dateToDayKey(day)
      const banners: EventBannerConfig[] = []

      for (const ev of eventsByDay.get(key) ?? []) {
        banners.push(
          bannerForCommunityEvent(ev, formatCommunitySchedule(ev.starts_at, ev.ends_at)),
        )
      }
      if (isViernesAmigosDay(day)) {
        banners.push(bannerForViernesAmigos())
      }
      const goDayEvents = filterGoEventsForDay(ACTIVE_POKEMON_GO_EVENTS, key)
      const hasFest = goDayEvents.some((ev) => ev.id === 'fest-global')
      if (hasFest) {
        banners.push(...bannersForFestGlobal())
      }
      for (const ev of goDayEvents) {
        if (ev.id === 'fest-global') continue
        banners.push(bannerForGoEvent(ev, formatGoEventSchedule(ev)))
      }
      return banners
    },
    [eventsByDay],
  )

  const infographicBanners = useMemo(
    () => (infographicDay ? buildDayBanners(infographicDay) : []),
    [infographicDay, buildDayBanners],
  )

  const openInfographic = (day: Date) => {
    const key = dateToDayKey(day)
    if (!dayHasEvents(key, eventsByDay, goEventsByDay)) return
    setInfographicPage(isFestGlobalDay(key) ? festBannerPageIndex(key) : 0)
    setInfographicDay(day)
  }

  const handleDayClick = (day: Date) => openInfographic(day)

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setImageName('')
    setEditingId(null)
    setShowForm(false)
  }

  const openEdit = (ev: CommunityEvent) => {
    const start = parseISO(ev.starts_at)
    const end = parseISO(ev.ends_at)
    setForm({
      title: ev.title,
      description: ev.description,
      pokemon_image_url: ev.pokemon_image_url,
      date: format(start, 'yyyy-MM-dd'),
      startTime: format(start, 'HH:mm'),
      endTime: format(end, 'HH:mm'),
      has_stamp: ev.has_stamp,
      location_name: ev.location_name,
      location_maps_url: ev.location_maps_url,
      wild_iv_cp: ev.wild_iv_cp != null ? String(ev.wild_iv_cp) : '',
      research_iv_cp: ev.research_iv_cp != null ? String(ev.research_iv_cp) : '',
      researchTasks: (ev.special_research_tasks ?? []).join('\n'),
    })
    setImageName('Imagen actual')
    setEditingId(ev.id)
    setShowForm(true)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProcessingImage(true)
    try {
      const dataUrl = await optimizeImageFile(file)
      setForm((f) => ({ ...f, pokemon_image_url: dataUrl }))
      setImageName(file.name)
    } finally {
      setProcessingImage(false)
      e.target.value = ''
    }
  }

  const buildPayload = (): CommunityEventInput => ({
    title: form.title.trim(),
    description: form.description.trim(),
    pokemon_image_url: form.pokemon_image_url,
    starts_at: buildIso(form.date, form.startTime),
    ends_at: buildIso(form.date, form.endTime),
    has_stamp: form.has_stamp,
    location_name: form.location_name.trim() || DEFAULT_LOCATION.name,
    location_maps_url: form.location_maps_url.trim() || DEFAULT_LOCATION.mapsUrl,
    location_lat: DEFAULT_LOCATION.lat,
    location_lng: DEFAULT_LOCATION.lng,
    wild_iv_cp: form.wild_iv_cp ? Number(form.wild_iv_cp) : null,
    research_iv_cp: form.research_iv_cp ? Number(form.research_iv_cp) : null,
    special_research_tasks: form.researchTasks
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean),
  })

  const handleSave = async () => {
    if (!form.title.trim() || !form.date || !form.description.trim()) return
    setSaving(true)
    try {
      const payload = buildPayload()
      if (editingId) await updateEvent(editingId, payload)
      else await createEvent(payload)
      resetForm()
    } catch {
      alert('No se pudo guardar el evento. ¿Ejecutaste la migración SQL en Supabase?')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este evento?')) return
    try {
      await deleteEvent(id)
      if (detailEvent?.id === id) setDetailEvent(null)
    } catch {
      alert('No se pudo eliminar el evento.')
    }
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="text-center">
        <h2 className="text-[1rem] font-black text-[#0d3b66] uppercase tracking-tight flex items-center justify-center gap-2">
          <Calendar className="w-5 h-5 text-[#2563eb]" />
          Eventos
        </h2>
        <p className="text-xs text-slate-500 mt-1">Calendario de actividades de la comunidad</p>
      </div>

      {liveEvents.length > 0 && (
        <div className="space-y-2">
          {liveEvents.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => {
                setInfographicDay(parseISO(eventDayKey(ev.starts_at) + 'T12:00:00'))
              }}
              className="w-full text-left rounded-2xl border-2 border-[#2563eb] bg-gradient-to-r from-teal-50 to-white p-4 shadow-md shadow-[#2563eb]/15"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-[#2563eb]">
                ● En curso
              </span>
              <p className="font-black text-[#0d3b66] mt-1 leading-snug">{ev.title}</p>
              {ev.has_stamp && (
                <p className="text-[12px] font-bold text-[#0d3b66]/80 mt-1">
                  Hay SelloDex — toca para ver detalles
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="rounded-2xl border border-[#0d3b66]/10 bg-white p-4 shadow-sm space-y-3">
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="w-full bg-[#2563eb] hover:bg-[#1fb988] text-white font-black rounded-xl py-6"
            >
              <Plus className="w-5 h-5 mr-2" />
              Crear evento
            </Button>
          ) : (
            <div className="space-y-3">
              <h3 className="font-black text-[#0d3b66] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#2563eb]" />
                {editingId ? 'Editar evento' : 'Nuevo evento'}
              </h3>

              <Input
                placeholder="Nombre del evento"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="font-bold"
              />
              <textarea
                placeholder="Descripción breve del evento"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-[#0d3b66] focus:outline-none focus:border-[#2563eb]"
              />

              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-black uppercase text-[#0d3b66]/70">
                  Imagen / GIF del Pokémon
                </span>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-teal-500 text-sm font-bold text-gray-500">
                    <ImageIcon className="w-4 h-4" />
                    {processingImage ? 'Procesando…' : imageName || 'Subir imagen'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                  {form.pokemon_image_url && (
                    <img
                      src={form.pokemon_image_url}
                      alt=""
                      className="w-14 h-14 object-contain rounded-lg bg-[#e8f4fc]"
                    />
                  )}
                </div>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <label className="col-span-3 sm:col-span-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Fecha</span>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </label>
                <label>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Inicio</span>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  />
                </label>
                <label>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Fin</span>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="has_stamp"
                  checked={form.has_stamp}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, has_stamp: v === true }))}
                />
                <label htmlFor="has_stamp" className="text-sm font-bold text-[#0d3b66]">
                  Habrá SelloDex en este evento
                </label>
              </div>

              <Input
                placeholder="Ubicación (ej. Parque Morelos)"
                value={form.location_name}
                onChange={(e) => setForm((f) => ({ ...f, location_name: e.target.value }))}
              />
              <Input
                placeholder="Enlace Google Maps"
                value={form.location_maps_url}
                onChange={(e) => setForm((f) => ({ ...f, location_maps_url: e.target.value }))}
              />

              <p className="text-[11px] font-black uppercase text-[#0d3b66]/60 pt-1">
                Datos opcionales (Pokémon GO Hub)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="IV 100% salvaje (PC)"
                  value={form.wild_iv_cp}
                  onChange={(e) => setForm((f) => ({ ...f, wild_iv_cp: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="IV 100% investigación (PC)"
                  value={form.research_iv_cp}
                  onChange={(e) => setForm((f) => ({ ...f, research_iv_cp: e.target.value }))}
                />
              </div>
              <textarea
                placeholder="Investigaciones especiales (una por línea)"
                value={form.researchTasks}
                onChange={(e) => setForm((f) => ({ ...f, researchTasks: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || !form.title || !form.date}
                  className="flex-1 bg-[#2563eb] hover:bg-[#1fb988] text-white font-black"
                >
                  {saving ? 'Guardando…' : 'Guardar'}
                </Button>
                <Button variant="outline" onClick={resetForm} className="font-bold">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-[#0d3b66]/10 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setMonth(subMonths(month, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 text-[#0d3b66]"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-black text-[#0d3b66] capitalize text-[15px]">
            {format(month, 'MMMM yyyy', { locale: es })}
          </span>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 text-[#0d3b66]"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
            <div key={`${d}-${i}`} className="text-center text-[10px] font-black text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const key = dateToDayKey(day)
            const communityDayEvents = eventsByDay.get(key) ?? []
            const goMarkers = getCalendarMarkerGoEvents(goEventsByDay.get(key) ?? [])
            const hasCommunity = communityDayEvents.length > 0
            const isViernes = key === VIERNES_AMIGOS.date
            const hasEvents = dayHasEvents(key, eventsByDay, goEventsByDay)
            const goStyle = getPokemonGoDayStyle(goMarkers)
            const festMarker = goMarkers.find((e) => e.id === 'fest-global')
            const cdMarker = goMarkers.find((e) => e.category === 'community-day')
            const megaDayMarker = goMarkers.find((e) => e.id === 'supermega-skarmory')
            const logoMarker =
              festMarker?.logo ??
              (cdMarker ? communityDayLogo : undefined) ??
              megaDayMarker?.logo
            const inMonth = isSameMonth(day, month)
            const isToday = isSameDay(day, new Date())

            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={!hasEvents}
                onClick={() => handleDayClick(day)}
                style={
                  inMonth && !hasCommunity && goStyle?.background
                    ? { background: goStyle.background, boxShadow: goStyle.boxShadow }
                    : undefined
                }
                className={`
                  relative flex flex-col items-center justify-center min-h-[48px] rounded-lg text-[12px] font-bold transition-all
                  ${!inMonth ? 'text-gray-300' : 'text-[#0d3b66]'}
                  ${hasEvents && inMonth ? 'cursor-pointer hover:scale-[1.03] hover:shadow-md' : ''}
                  ${!hasEvents ? 'opacity-60' : ''}
                  ${hasCommunity && inMonth ? 'ring-2 ring-[#f97316] bg-orange-50/90' : ''}
                  ${isViernes && inMonth && !hasCommunity ? 'ring-2 ring-[#2563eb] bg-[#e8f4fc]/60' : ''}
                  ${isToday && inMonth ? 'outline outline-2 outline-[#2563eb]/70 outline-offset-1' : ''}
                  ${!hasCommunity && !goStyle?.background && hasEvents && inMonth ? 'hover:bg-gray-50' : ''}
                `}
              >
                <span>{format(day, 'd')}</span>
                {hasEvents && inMonth && (
                  <div className="absolute bottom-0.5 left-0 right-0 flex justify-center items-end gap-0.5 px-0.5 h-5 pointer-events-none">
                    {hasCommunity && (
                      <img src={tiempoLibreLogo} alt="" className="h-4 w-4 object-contain" />
                    )}
                    {isViernes && (
                      <img src={tiempoLibreLogo} alt="" className="h-4 w-4 object-contain" />
                    )}
                    {logoMarker && (
                      <img
                        src={logoMarker}
                        alt=""
                        className={`object-contain ${festMarker ? 'h-5 w-5' : 'h-4 w-4'}`}
                      />
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <p className="text-[10px] text-gray-500 mt-3 leading-relaxed">
          Toca un día con evento para ver su información.
        </p>
      </div>

      <UpcomingCommunityEvents onSelectDay={openInfographic} />

      {infographicDay && infographicBanners.length > 0 && (
        <EventDayInfographicModal
          day={infographicDay}
          banners={infographicBanners}
          initialPage={infographicPage}
          onClose={() => {
            setInfographicDay(null)
            setInfographicPage(0)
          }}
          onCommunityDetail={(id) => {
            const ev = events.find((e) => e.id === id)
            if (ev) {
              setInfographicDay(null)
              setDetailEvent(ev)
            }
          }}
        />
      )}

      {detailEvent && <EventDetailModal event={detailEvent} onClose={() => setDetailEvent(null)} />}
    </div>
  )
}

