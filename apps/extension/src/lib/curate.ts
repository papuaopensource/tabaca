import type { Story } from "@tabaca/api"
import type { SeenEntry } from "@/storage"

export interface RankOptions {
  /** Stories already shown on earlier tabs; they are ranked lower. */
  seen?: ReadonlySet<string>
  now?: number
  /** Random source in [0, 1). Injectable for deterministic tests. */
  random?: () => number
  /** Within any run of `window` consecutive stories, at most `maxPerWindow` share a source. */
  window?: number
  maxPerWindow?: number
}

const HOUR = 3_600_000
// Essays and analysis age slowly: recent pieces get a boost, older ones keep showing up.
const RECENCY_DECAY_HOURS = 30 * 24
const MIN_RECENCY = 0.15
const SEEN_PENALTY = 0.15

function weight(story: Story, now: number, seen: ReadonlySet<string>): number {
  const published = Date.parse(story.publishedAt)
  const ageHours = Number.isNaN(published)
    ? 24 * 365
    : Math.max(0, (now - published) / HOUR)
  const recency = Math.max(
    MIN_RECENCY,
    Math.exp(-ageHours / RECENCY_DECAY_HOURS)
  )
  const relevance = 1 + 0.15 * Math.min(story.matchedKeywords.length, 4)
  const novelty = seen.has(story.id) ? SEEN_PENALTY : 1
  return recency * relevance * novelty
}

/**
 * Orders stories for the "For you" view: weighted random sampling that
 * favours recent, more relevant and not-yet-seen stories, then spreads sources
 * out so one outlet never dominates a row. Every prefix of the result is a
 * good selection, so the grid can show the first N and load more later.
 */
export function rankStories(
  stories: Story[],
  options: RankOptions = {}
): Story[] {
  const {
    seen = new Set<string>(),
    now = Date.now(),
    random = Math.random,
    window = 4,
    maxPerWindow = 2
  } = options

  // Efraimidis–Spirakis weighted sampling without replacement.
  const remaining = stories
    .map((story) => ({
      story,
      key: Math.pow(random(), 1 / weight(story, now, seen))
    }))
    .sort((a, b) => b.key - a.key)
    .map(({ story }) => story)

  const result: Story[] = []
  while (remaining.length > 0) {
    const recent = result.slice(-window)
    const index = remaining.findIndex(
      (candidate) =>
        recent.filter((s) => s.source === candidate.source).length <
        maxPerWindow
    )
    const [next] = remaining.splice(index === -1 ? 0 : index, 1)
    if (next) result.push(next)
  }
  return result
}

export function sortByNewest(stories: Story[]): Story[] {
  return [...stories].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
  )
}

const SEEN_LIMIT = 300
const SEEN_TTL_MS = 14 * 24 * HOUR

/** Records shown stories, keeping the history bounded in size and age. */
export function markSeen(
  history: SeenEntry[],
  ids: string[],
  now: number
): SeenEntry[] {
  const fresh = new Set(ids)
  return [
    ...ids.map((id) => ({ id, at: now })),
    ...history.filter((e) => !fresh.has(e.id) && now - e.at < SEEN_TTL_MS)
  ].slice(0, SEEN_LIMIT)
}

/** Small seeded PRNG (mulberry32) so a tab's order is stable across re-renders. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
