export type SourceId = "bbc" | "theconversation" | "jubi" | "antara-papua"

export type Region = "IDN" | "PNG"

export interface Story {
  id: string
  title: string
  url: string
  source: SourceId
  author?: string
  publishedAt: string
  snippet: string
  imageUrl?: string
  matchedKeywords: string[]
  fetchedAt: string
  region?: Region
}

export interface SourceStat {
  count: number
  lastFetchAt: string
  error?: string
}

export interface CacheMeta {
  lastFetchAt: string
  lastError?: string
  sourceStats: Partial<Record<SourceId, SourceStat>>
}

export interface UserPrefs {
  enabledSources: SourceId[]
  theme: "system" | "light" | "dark"
  hiddenStoryIds: string[]
  bookmarkedStoryIds: string[]
}

export const DEFAULT_PREFS: UserPrefs = {
  enabledSources: ["bbc", "theconversation"],
  theme: "system",
  hiddenStoryIds: [],
  bookmarkedStoryIds: []
}

export const STORAGE_KEYS = {
  stories: "tabaca:stories",
  meta: "tabaca:meta",
  prefs: "tabaca:prefs"
} as const
