import type { Story } from "@tabaca/api"
import { describe, expect, it } from "vitest"
import { searchStories } from "./searchStories"

function story(id: string, extra: Partial<Story>): Story {
  return {
    id,
    title: "",
    url: `https://www.suarapapua.com/${id}`,
    source: "suara-papua",
    publishedAt: "2026-11-09T08:00:00Z",
    snippet: "",
    matchedKeywords: [],
    fetchedAt: "2026-11-09T08:00:00Z",
    readCount: 0,
    kind: "article",
    ...extra
  }
}

const stories = [
  story("a", {
    title: "Penembakan warga sipil di Nduga",
    matchedKeywords: ["Nduga"]
  }),
  story("b", { title: "Festival budaya", snippet: "Digelar di Jayapura" }),
  story("c", {
    title: "José Carlos Mariátegui dan Papua",
    url: "https://laolaopapua.com/c"
  })
]

const ids = (list: Story[]) => list.map((s) => s.id)

describe("searchStories", () => {
  it("matches title, snippet and topics, requiring every word", () => {
    expect(ids(searchStories(stories, "nduga"))).toEqual(["a"])
    expect(ids(searchStories(stories, "festival jayapura"))).toEqual(["b"])
    expect(searchStories(stories, "festival nduga")).toEqual([])
  })

  it("ignores accents and matches the site name", () => {
    expect(ids(searchStories(stories, "mariategui"))).toEqual(["c"])
    expect(ids(searchStories(stories, "laolaopapua"))).toEqual(["c"])
    expect(searchStories(stories, "   ")).toEqual([])
  })
})
