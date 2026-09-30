import { useEffect, useState } from 'react'
import { Check, RotateCcw, Users, X } from 'lucide-react'
import {
  COMMUNITY_STAT_FIELDS,
  DEFAULT_COMMUNITY_STATS,
  type CommunityStats,
} from '@/app/utils/communityStats'
import { useCommunityStats } from '@/hooks/useCommunityStats'
import {
  modalOverlayClass,
  modalSheetClass,
} from '@/app/layout/mobileShellLayout'

type Props = {
  open: boolean
  onClose: () => void
}

function formatDraft(value: number): string {
  return String(value)
}

function parseDraft(raw: string): number | null {
  const cleaned = raw.replace(/[^\d]/g, '')
  if (!cleaned) return null
  const n = Number(cleaned)
  if (!Number.isFinite(n)) return null
  return Math.round(n)
}

export function CommunityStatsPanel({ open, onClose }: Props) {
  const { stats, saving, error, save, reset } = useCommunityStats()
  const [draft, setDraft] = useState<CommunityStats>(stats)
  const [localError, setLocalError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    if (open) {
      setDraft(stats)
      setLocalError(null)
      setSavedFlash(false)
    }
  }, [open, stats])

  if (!open) return null

  const dirty =
    draft.campfireMembers !== stats.campfireMembers ||
    draft.previousMeetupTrainers !== stats.previousMeetupTrainers ||
    draft.whatsappFollowers !== stats.whatsappFollowers

  const handleSave = async () => {
    setLocalError(null)
    for (const field of COMMUNITY_STAT_FIELDS) {
      const value = draft[field.id]
      if (value < field.min || value > field.max) {
        setLocalError(`${field.label}: usa un número entre ${field.min} y ${field.max.toLocaleString('es-MX')}`)
        return
      }
    }
    await save(draft)
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1600)
  }

  return (
    <div className={modalOverlayClass} onClick={onClose}>
      <div
        className={`${modalSheetClass} bg-white max-w-md w-full max-h-[92dvh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-[#0d3b66]">Editar números</h2>
            <p className="text-[11px] text-[#5b6483] font-semibold mt-0.5">
              Solo Fuecoco · se publica al instante
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-slate-200 inline-flex items-center justify-center text-[#0d3b66]"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <p className="text-[12px] text-[#5b6483] leading-relaxed">
            Actualiza Campfire, la quedada anterior y WhatsApp sin tocar el código.
            Los cambios se ven en la pantalla de registro para todos.
          </p>

          {(localError || error) && (
            <p className="text-[12px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              {localError || error}
            </p>
          )}

          {savedFlash && !error && (
            <p className="text-[12px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Números publicados
            </p>
          )}

          {COMMUNITY_STAT_FIELDS.map((field) => (
            <label
              key={field.id}
              className="block rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3 space-y-2"
            >
              <div>
                <p className="text-sm font-black text-[#0d3b66]">{field.label}</p>
                <p className="text-[11px] text-[#64748b] font-semibold">{field.hint}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-11 h-11 rounded-xl border border-slate-200 bg-white text-lg font-black text-[#0d3b66] shrink-0"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      [field.id]: Math.max(field.min, prev[field.id] - field.step),
                    }))
                  }
                  aria-label={`Bajar ${field.label}`}
                >
                  −
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formatDraft(draft[field.id])}
                  onChange={(e) => {
                    const parsed = parseDraft(e.target.value)
                    if (parsed == null) {
                      setDraft((prev) => ({ ...prev, [field.id]: 0 }))
                      return
                    }
                    setDraft((prev) => ({
                      ...prev,
                      [field.id]: Math.min(field.max, parsed),
                    }))
                  }}
                  className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-lg font-black text-[#0d3b66] tabular-nums"
                />
                <button
                  type="button"
                  className="w-11 h-11 rounded-xl border border-slate-200 bg-white text-lg font-black text-[#0d3b66] shrink-0"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      [field.id]: Math.min(field.max, prev[field.id] + field.step),
                    }))
                  }
                  aria-label={`Subir ${field.label}`}
                >
                  +
                </button>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 text-center tabular-nums">
                {draft[field.id].toLocaleString('es-MX')}
              </p>
            </label>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-slate-100 space-y-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setDraft({ ...DEFAULT_COMMUNITY_STATS })
              void reset()
            }}
            className="w-full rounded-xl border border-slate-200 bg-white text-[#5b6483] text-sm font-bold py-2.5 inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer valores del sitio
          </button>
          <button
            type="button"
            disabled={saving || !dirty}
            onClick={() => void handleSave()}
            className="w-full rounded-xl bg-[#0d3b66] text-white text-sm font-black py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Users className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Publicar números'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#2563eb] text-white text-sm font-black py-3"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}
