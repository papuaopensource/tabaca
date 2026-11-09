import type { Story } from "@tabaca/api"
import { storage } from "wxt/utils/storage"

export interface FeedMeta {
  /** Last successful refresh (ISO). */
  lastFetchAt?: string
  /** Last refresh attempt, successful or not (ISO). */
  lastAttemptAt?: string
  /** Error message from the last failed attempt; cleared on success. */
  lastError?: string
}

export interface SeenEntry {
  id: string
  /** Epoch milliseconds when the story was last shown on a new tab. */
  at: number
}

// Keys keep the `tabaca:` prefix used by earlier versions so cached data survives updates.
export const storiesItem = storage.defineItem<Story[]>("local:tabaca:stories", {
  fallback: []
})

export const metaItem = storage.defineItem<FeedMeta>("local:tabaca:meta", {
  fallback: {}
})

export const seenItem = storage.defineItem<SeenEntry[]>("local:tabaca:seen", {
  fallback: []
})

/** Stories already reported to the read counter, so each browser counts once. */
export const readItem = storage.defineItem<string[]>("local:tabaca:read", {
  fallback: []
})

/** Data written by earlier versions that is no longer used. */
export const LEGACY_KEYS = [
  "local:tabaca:prefs",
  "local:tabaca:sources"
] as const
