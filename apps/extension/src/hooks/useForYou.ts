import type { Story } from "@tabaca/api"
import { useCallback, useEffect, useMemo, useState } from "react"
import { markSeen, rankStories, seededRandom } from "@/lib/curate"
import { seenItem } from "@/storage"

interface Session {
  seed: number
  seen: ReadonlySet<string>
  now: number
}

const randomSeed = () => Math.floor(Math.random() * 2 ** 32)

/**
 * The "For you" order: different on every new tab, stable while the tab is
 * open. Stories shown on earlier tabs are ranked lower so each tab feels fresh.
 */
export function useForYou(stories: Story[], ready: boolean) {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    let alive = true
    void seenItem.getValue().then((history) => {
      if (!alive) return
      setSession({
        seed: randomSeed(),
        seen: new Set(history.map((e) => e.id)),
        now: Date.now()
      })
    })
    return () => {
      alive = false
    }
  }, [])

  const ranked = useMemo(() => {
    if (!session || !ready) return []
    return rankStories(stories, {
      seen: session.seen,
      now: session.now,
      random: seededRandom(session.seed)
    })
  }, [stories, session, ready])

  /** New order; what was on screen counts as seen. */
  const reshuffle = useCallback((shownIds: string[]) => {
    setSession((prev) =>
      prev
        ? {
            seed: randomSeed(),
            seen: new Set([...prev.seen, ...shownIds]),
            now: Date.now()
          }
        : prev
    )
  }, [])

  return { ranked, reshuffle, isReady: ready && session !== null }
}

export async function rememberShown(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const history = await seenItem.getValue()
  await seenItem.setValue(markSeen(history, ids, Date.now()))
}
