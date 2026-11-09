import { createApiClient, MAX_PAGE_SIZE } from "@tabaca/api"
import { storage } from "wxt/utils/storage"
import { metaItem, readItem, storiesItem } from "@/storage"
import type { FeedMeta } from "@/storage"

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000"

/** Refresh in the background when the cache is older than this. */
export const STALE_AFTER_MS = 30 * 60 * 1000
/** After a failed refresh, retry this soon (e.g. the backend was just restarted). */
export const RETRY_AFTER_MS = 60 * 1000

const api = createApiClient({ baseUrl: API_BASE_URL })

let inflight: Promise<void> | null = null

/**
 * Pulls the latest curated stories from the backend and replaces the local
 * cache. The backend is the source of truth: stories it hides (unsafe, or from
 * a feed an admin switched off) disappear from the extension on the next refresh.
 */
export function refreshFeed(): Promise<void> {
  inflight ??= doRefresh().finally(() => {
    inflight = null
  })
  return inflight
}

async function doRefresh(): Promise<void> {
  const attemptAt = new Date().toISOString()
  try {
    const stories = await api.getStories({ limit: MAX_PAGE_SIZE })
    await storage.setItems([
      { item: storiesItem, value: stories },
      {
        item: metaItem,
        value: { lastFetchAt: attemptAt, lastAttemptAt: attemptAt }
      }
    ])
  } catch (err) {
    // Handled: the new tab shows an error state and the next attempt retries.
    console.warn("[tabaca] refresh failed:", err)
    const previous = await metaItem.getValue()
    await metaItem.setValue({
      ...previous,
      lastAttemptAt: attemptAt,
      lastError: err instanceof Error ? err.message : String(err)
    })
  }
}

export function isStale(meta: FeedMeta, now: number): boolean {
  if (!meta.lastAttemptAt) return true
  const t = Date.parse(meta.lastAttemptAt)
  const maxAge = meta.lastError ? RETRY_AFTER_MS : STALE_AFTER_MS
  return Number.isNaN(t) || now - t > maxAge
}

const READ_HISTORY_LIMIT = 500

/** Counts a story as read on the backend, once per browser. Never throws. */
export async function markStoryRead(storyId: string): Promise<void> {
  try {
    const counted = await readItem.getValue()
    if (counted.includes(storyId)) return
    await readItem.setValue([storyId, ...counted].slice(0, READ_HISTORY_LIMIT))
    await api.markRead(storyId)
  } catch (err) {
    console.warn("[tabaca] could not record read:", err)
  }
}
