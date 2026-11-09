import { useCallback, useEffect, useRef, useState } from "react"
import { isStale, refreshFeed } from "@/lib/feed"
import type { FeedMeta } from "@/storage"

export function useRefresh(meta: FeedMeta, ready: boolean) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const checkedOnOpen = useRef(false)

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshFeed()
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Alarms don't fire while the browser is closed, so catch up when a tab opens.
  useEffect(() => {
    if (!ready || checkedOnOpen.current) return
    checkedOnOpen.current = true
    if (isStale(meta, Date.now())) {
      void refreshFeed()
    }
  }, [ready, meta])

  return { isRefreshing, refresh }
}
