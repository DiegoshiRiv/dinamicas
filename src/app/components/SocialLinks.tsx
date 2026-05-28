import { useMemo, useState, useEffect } from 'react'
import { Instagram, Facebook, Download, ExternalLink } from 'lucide-react'
import wpIcon from '@/assets/w.png'
import xIcon from '@/assets/x.png'
import campfireIcon from '@/assets/campfire.png'
import { CAMPFIRE_JOIN_LABEL, CAMPFIRE_JOIN_URL } from '@/app/data/communityLinks'

interface SocialLinksProps {
  installPrompt?: { prompt: () => Promise<void> } | null
  onInstall?: () => void
  compact?: boolean
}

export function SocialLinks({ installPrompt, onInstall, compact = false }: SocialLinksProps) {
  const facebookWidget = encodeURIComponent('https://www.facebook.com/61577260873239')
  const facebookWidgetUrl =
    `https://www.facebook.com/plugins/page.php?href=${facebookWidget}&tabs=timeline&width=340&height=420` +
    '&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false'

  const instagramEmbedUrl = 'https://www.instagram.com/pokemon_go_gdl/embed'

  const [xPosts, setXPosts] = useState<Array<{ id: string; title: string; link: string; image?: string }>>([])
  const [xLoading, setXLoading] = useState(false)

  const parseFirstImage = (html?: string): string | undefined => {
    if (!html) return undefined
    const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
    return m?.[1]
  }

  useEffect(() => {
    if (!compact) return
    let cancelled = false
    const loadX = async () => {
      setXLoading(true)
      try {
        const rssUrl = 'https://nitter.net/PokemonGo_GDL/rss'
        const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('rss unavailable')
        const data = await res.json()
        if (data?.status !== 'ok' || !Array.isArray(data?.items)) throw new Error('invalid rss')
        const posts = data.items.slice(0, 5).map((item: any) => ({
          id: item.guid || item.link,
          title: item.title || 'Publicación',
          link: item.link || 'https://x.com/PokemonGo_GDL',
          image: item.thumbnail || parseFirstImage(item.content),
        }))
        if (!cancelled) setXPosts(posts)
      } catch {
        if (!cancelled) setXPosts([])
      } finally {
        if (!cancelled) setXLoading(false)
      }
    }
    void loadX()
    return () => { cancelled = true }
  }, [compact])

  const socialLinks = [
    {
      href: 'https://www.whatsapp.com/channel/0029VbA3X858Pgs9nkwUSO1L',
      label: 'WhatsApp',
      icon: <img src={wpIcon} alt="WhatsApp" className="w-7 h-7 object-contain" />,
      bg: 'bg-[#25D366]',
    },
    {
      href: 'https://www.instagram.com/pokemon_go_gdl/',
      label: 'Instagram',
      icon: <Instagram className="w-5 h-5 text-white" strokeWidth={2} />,
      bg: 'bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
    },
    {
      href: 'https://www.facebook.com/profile.php?id=61577260873239',
      label: 'Facebook',
      icon: <Facebook className="w-5 h-5 text-white" strokeWidth={2} />,
      bg: 'bg-[#1877F2]',
    },
    {
      href: 'https://x.com/PokemonGo_GDL',
      label: 'X',
      icon: <img src={xIcon} alt="X" className="w-5 h-5 object-contain brightness-0 invert" />,
      bg: 'bg-[#0f172a]',
    },
    {
      href: CAMPFIRE_JOIN_URL,
      label: CAMPFIRE_JOIN_LABEL,
      icon: <img src={campfireIcon} alt="Campfire" className="w-7 h-7 object-contain" />,
      bg: 'bg-[#f97316]',
    },
  ]

  const socialMediaPanels = useMemo(() => [
    {
      key: 'instagram',
      title: 'Instagram',
      href: 'https://www.instagram.com/pokemon_go_gdl/',
      iframeSrc: instagramEmbedUrl,
    },
    {
      key: 'facebook',
      title: 'Facebook',
      href: 'https://www.facebook.com/profile.php?id=61577260873239',
      iframeSrc: facebookWidgetUrl,
    },
  ], [facebookWidgetUrl])

  return (
    <div className={compact ? 'space-y-5' : 'text-center'}>
      {!compact && (
        <p className="font-semibold text-[15px] text-[#0d3b66] mb-4">
          Sigue las redes sociales de la comunidad
        </p>
      )}

      {compact && (
        <h2 className="text-[1rem] font-black text-[#0d3b66] uppercase tracking-tight text-center">
          Nuestras redes sociales
        </h2>
      )}

      <div className="flex justify-center items-center gap-4">
        {socialLinks.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-11 h-11 rounded-full flex items-center justify-center ${s.bg} shadow-md hover:scale-110 active:scale-95 transition-transform`}
            aria-label={s.label}
          >
            {s.icon}
          </a>
        ))}
      </div>

      {installPrompt && onInstall && (
        <button
          type="button"
          onClick={onInstall}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#4ade80] to-[#14b8a6] text-white font-bold shadow-md mx-auto hover:opacity-95 active:scale-95 transition-all text-sm w-full max-w-xs"
        >
          <Download className="w-5 h-5" />
          Crear acceso directo
        </button>
      )}

      {compact && (
        <section>
          <h3 className="text-[13px] font-black uppercase tracking-wide text-[#0d3b66] mb-3 text-center">
            Últimas publicaciones
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {socialMediaPanels.map((panel) => (
              <article key={panel.key} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-3 py-2.5 flex items-center justify-between border-b border-slate-100">
                  <span className="text-[12px] font-black text-[#0d3b66] uppercase tracking-wide">{panel.title}</span>
                  <a
                    href={panel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-[#2dd4bf] inline-flex items-center gap-1 hover:underline"
                  >
                    Abrir
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="h-[260px] bg-slate-50">
                  <iframe
                    title={panel.title}
                    src={panel.iframeSrc}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-black text-[#0d3b66] uppercase tracking-wide">X recientes</span>
              <a href="https://x.com/PokemonGo_GDL" target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-[#2dd4bf] inline-flex items-center gap-1 hover:underline">
                Ver perfil
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {xLoading && <p className="text-xs text-slate-500 py-2">Cargando publicaciones...</p>}
            {!xLoading && xPosts.length > 0 && (
              <div className="space-y-2 max-h-[320px] overflow-auto">
                {xPosts.map((post) => (
                  <a key={post.id} href={post.link} target="_blank" rel="noopener noreferrer" className="flex gap-2.5 p-2 rounded-xl border border-slate-100 hover:border-[#2dd4bf] transition-colors">
                    <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                      {post.image ? (
                        <img src={post.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">X</div>
                      )}
                    </div>
                    <p className="text-[12px] text-[#0d3b66] font-semibold leading-snug line-clamp-3">{post.title}</p>
                  </a>
                ))}
              </div>
            )}
            {!xLoading && xPosts.length === 0 && (
              <p className="text-xs text-slate-500 py-2">No se pudieron cargar posts de X en este momento.</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
