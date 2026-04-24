import { useCallback, useEffect, useState } from "react"
import { getPrefs, getStories, onStoriesChanged, toggleBookmark } from "@/storage"
import type { SourceId, Story, UserPrefs } from "@/storage/schema"

export interface UseStoriesReturn {
  stories: Story[]
  prefs: UserPrefs | null
  isLoading: boolean
  handleBookmark: (id: string) => Promise<void>
}

export function useStories(): UseStoriesReturn {
  const [stories, setStories] = useState<Story[]>([])
  const [prefs, setPrefs] = useState<UserPrefs | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const [loaded, loadedPrefs] = await Promise.all([
        getStories(),
        getPrefs()
      ])
      if (mounted) {
        setStories(loaded)
        setPrefs(loadedPrefs)
        setIsLoading(false)
      }
    }

    load()

    const unsub = onStoriesChanged((updated) => {
      if (mounted) setStories(updated)
    })

    return () => {
      mounted = false
      unsub()
    }
  }, [])

  const handleBookmark = useCallback(async (id: string) => {
    await toggleBookmark(id)
    const updated = await getPrefs()
    setPrefs(updated)
  }, [])

  return { stories, prefs, isLoading, handleBookmark }
}
