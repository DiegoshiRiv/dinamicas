import { useEffect, useState } from 'react'
import { WHATSAPP_CHANNEL_URL, WHATSAPP_FOLLOWER_COUNT } from '@/app/data/communityLinks'
import { parseFollowerCount } from '@/app/utils/parseFollowerCount'

const CACHE_KEY = 'whatsapp-follower-count'
const CACHE_TTL_MS = 60 * 60 * 1000

function readCachedCount(): number | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { count, fetchedAt } = JSON.parse(raw) as { count: number; fetchedAt: number }
    if (Date.now() - fetchedAt > CACHE_TTL_MS) return null
    return typeof count === 'number' ? count : null
  } catch {
    return null
  }
}

function writeCachedCount(count: number) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ count, fetchedAt: Date.now() }))
  } catch {
    // ignore storage errors
  }
}

async function fetchWhatsAppFollowers(): Promise<number | null> {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(WHATSAPP_CHANNEL_URL)}`
  const res = await fetch(proxyUrl)
  if (!res.ok) return null
  const html = await res.text()
  return parseFollowerCount(html)
}

export function useWhatsAppFollowers() {
  const [count, setCount] = useState(() => readCachedCount() ?? WHATSAPP_FOLLOWER_COUNT)

  useEffect(() => {
    const cached = readCachedCount()
    if (cached != null) {
      setCount(cached)
      return
    }

    let cancelled = false

    void fetchWhatsAppFollowers()
      .then((live) => {
        if (cancelled || live == null) return
        writeCachedCount(live)
        setCount(live)
      })
      .catch(() => {
        // keep fallback count
      })

    return () => {
      cancelled = true
    }
  }, [])

  return count
}
