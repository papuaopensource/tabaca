import { useCallback, useEffect, useState } from "react"
import { getMeta } from "@/storage"
import { relativeTime } from "@/lib/date"

export interface UseRefreshReturn {
  isRefreshing: boolean
  lastUpdated: string
  triggerRefresh: () => Promise<void>
}

export function useRefresh(): UseRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState("")

  useEffect(() => {
    getMeta().then((meta) => {
      if (meta?.lastFetchAt) {
        setLastUpdated(`Diperbarui ${relativeTime(meta.lastFetchAt)}`)
      }
    })
  }, [])

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      await chrome.runtime.sendMessage({ type: "REFRESH" })
      const meta = await getMeta()
      if (meta?.lastFetchAt) {
        setLastUpdated(`Diperbarui ${relativeTime(meta.lastFetchAt)}`)
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing])

  return { isRefreshing, lastUpdated, triggerRefresh }
}
