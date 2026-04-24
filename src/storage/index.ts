import type {
  CacheMeta,
  SourceId,
  Story,
  UserPrefs
} from "./schema"
import { DEFAULT_PREFS, STORAGE_KEYS } from "./schema"

const MAX_STORIES = 200

export async function getStories(): Promise<Story[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.stories)
  return (result[STORAGE_KEYS.stories] as Story[]) ?? []
}

export async function saveStories(stories: Story[]): Promise<void> {
  const sorted = [...stories].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  const trimmed = sorted.slice(0, MAX_STORIES)
  await chrome.storage.local.set({ [STORAGE_KEYS.stories]: trimmed })
}

export async function mergeStories(incoming: Story[]): Promise<void> {
  const existing = await getStories()
  const idSet = new Set(existing.map((s) => s.id))
  const newOnes = incoming.filter((s) => !idSet.has(s.id))
  await saveStories([...existing, ...newOnes])
}

export async function getMeta(): Promise<CacheMeta | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.meta)
  return (result[STORAGE_KEYS.meta] as CacheMeta) ?? null
}

export async function saveMeta(meta: CacheMeta): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.meta]: meta })
}

export async function getPrefs(): Promise<UserPrefs> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.prefs)
  const stored = result[STORAGE_KEYS.prefs] as Partial<UserPrefs> | undefined
  return { ...DEFAULT_PREFS, ...stored }
}

export async function savePrefs(prefs: Partial<UserPrefs>): Promise<void> {
  const current = await getPrefs()
  await chrome.storage.local.set({
    [STORAGE_KEYS.prefs]: { ...current, ...prefs }
  })
}

export async function toggleBookmark(storyId: string): Promise<boolean> {
  const prefs = await getPrefs()
  const isBookmarked = prefs.bookmarkedStoryIds.includes(storyId)
  const updated = isBookmarked
    ? prefs.bookmarkedStoryIds.filter((id) => id !== storyId)
    : [...prefs.bookmarkedStoryIds, storyId]
  await savePrefs({ bookmarkedStoryIds: updated })
  return !isBookmarked
}

export async function toggleSource(sourceId: SourceId): Promise<void> {
  const prefs = await getPrefs()
  const isEnabled = prefs.enabledSources.includes(sourceId)
  const updated = isEnabled
    ? prefs.enabledSources.filter((id) => id !== sourceId)
    : [...prefs.enabledSources, sourceId]
  await savePrefs({ enabledSources: updated })
}

export function onStoriesChanged(
  callback: (stories: Story[]) => void
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>
  ) => {
    if (STORAGE_KEYS.stories in changes) {
      callback((changes[STORAGE_KEYS.stories].newValue as Story[]) ?? [])
    }
  }
  chrome.storage.local.onChanged.addListener(listener)
  return () => chrome.storage.local.onChanged.removeListener(listener)
}
