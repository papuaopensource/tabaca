import type { Story } from "@tabaca/api"
import { describe, expect, it } from "vitest"
import { markSeen, rankStories, seededRandom, sortByNewest } from "./curate"

const NOW = Date.parse("2026-11-10T12:00:00Z")
const HOUR = 3_600_000

function story(id: string, overrides: Partial<Story> = {}): Story {
  return {
    id,
    title: `Story ${id}`,
    url: `https://example.com/${id}`,
    source: "suara-papua",
    publishedAt: new Date(NOW - HOUR).toISOString(),
    snippet: "",
    matchedKeywords: ["Papua"],
    fetchedAt: new Date(NOW).toISOString(),
    readCount: 0,
    kind: "article",
    ...overrides
  }
}

function manyStories(n: number, sources = ["a", "b", "c"]): Story[] {
  return Array.from({ length: n }, (_, i) =>
    story(`s${i}`, {
      source: sources[i % sources.length],
      publishedAt: new Date(NOW - i * HOUR).toISOString()
    })
  )
}

const ids = (stories: Story[]) => stories.map((s) => s.id)

describe("rankStories", () => {
  it("returns every story exactly once", () => {
    const stories = manyStories(30)
    const ranked = rankStories(stories, { now: NOW, random: seededRandom(1) })
    expect(ranked).toHaveLength(30)
    expect(new Set(ids(ranked)).size).toBe(30)
  })

  it("is deterministic for a seed and varies across seeds", () => {
    const stories = manyStories(40)
    const top = (seed: number) =>
      ids(rankStories(stories, { now: NOW, random: seededRandom(seed) }))
        .slice(0, 12)
        .join(",")
    expect(top(42)).toBe(top(42))
    expect(new Set([1, 2, 3, 4, 5].map(top)).size).toBeGreaterThan(1)
  })

  it("never puts more than 2 stories of one source in 4 consecutive slots when avoidable", () => {
    const stories = [
      ...Array.from({ length: 20 }, (_, i) =>
        story(`big${i}`, { source: "big" })
      ),
      ...Array.from({ length: 6 }, (_, i) => story(`x${i}`, { source: "x" })),
      ...Array.from({ length: 6 }, (_, i) => story(`y${i}`, { source: "y" }))
    ]
    const ranked = rankStories(stories, { now: NOW, random: seededRandom(7) })
    const firstTwelve = ranked.slice(0, 12)
    for (let i = 0; i + 4 <= firstTwelve.length; i++) {
      const window = firstTwelve.slice(i, i + 4)
      expect(
        window.filter((s) => s.source === "big").length
      ).toBeLessThanOrEqual(2)
    }
  })

  it("still returns everything when there is only one source", () => {
    expect(rankStories(manyStories(12, ["only"]), { now: NOW })).toHaveLength(
      12
    )
    expect(rankStories([], {})).toEqual([])
  })

  it("puts unseen stories near the top", () => {
    const stories = manyStories(20)
    const seen = new Set(ids(stories.slice(0, 10)))
    let unseenOnTop = 0
    for (let seed = 0; seed < 50; seed++) {
      const top = rankStories(stories, {
        seen,
        now: NOW,
        random: seededRandom(seed)
      }).slice(0, 5)
      unseenOnTop += top.filter((s) => !seen.has(s.id)).length
    }
    // Without the penalty roughly half would be unseen; expect a clear majority.
    expect(unseenOnTop / (50 * 5)).toBeGreaterThan(0.75)
  })
})

describe("sortByNewest", () => {
  it("orders by publish date, newest first", () => {
    const stories = [
      story("old", { publishedAt: new Date(NOW - 5 * HOUR).toISOString() }),
      story("new", { publishedAt: new Date(NOW - HOUR).toISOString() }),
      story("mid", { publishedAt: new Date(NOW - 3 * HOUR).toISOString() })
    ]
    expect(ids(sortByNewest(stories))).toEqual(["new", "mid", "old"])
  })
})

describe("markSeen", () => {
  it("adds new ids first, dedupes and drops expired entries", () => {
    const history = [
      { id: "old", at: NOW - 30 * 24 * HOUR },
      { id: "a", at: NOW - HOUR },
      { id: "b", at: NOW - 2 * HOUR }
    ]
    expect(markSeen(history, ["b", "c"], NOW)).toEqual([
      { id: "b", at: NOW },
      { id: "c", at: NOW },
      { id: "a", at: NOW - HOUR }
    ])
  })
})
