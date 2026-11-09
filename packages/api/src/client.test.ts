import { describe, expect, it, vi } from "vitest"
import { createApiClient } from "./client"

const SOURCES = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: "suara-papua",
      name: "Suara Papua",
      homepage: "https://suarapapua.com",
      storyCount: 3
    },
    { id: "jubi", name: "Jubi", homepage: "javascript:alert(1)" },
    { id: "", name: "Broken" }
  ]
}

const STORIES = {
  count: 3,
  next: null,
  previous: null,
  results: [
    {
      id: "a1",
      title: "Story from Jayapura",
      url: "https://suarapapua.com/a1",
      source: "suara-papua",
      author: "",
      publishedAt: "2026-11-09T08:00:00+09:00",
      snippet: "Snippet",
      imageUrl: "http://insecure.example/img.jpg",
      matchedKeywords: ["Jayapura", 3],
      fetchedAt: "2026-11-09T09:00:00+09:00",
      region: "IDN",
      readCount: 12,
      kind: "paper",
      venue: "Jurnal Ilmu Lingkungan"
    },
    {
      id: "a2",
      title: "Unsafe link",
      url: "javascript:alert(1)",
      source: "suara-papua"
    },
    {
      id: "a3",
      title: "Jubi story",
      url: "https://jubi.id/a3",
      source: "jubi",
      imageUrl: "https://jubi.id/img.jpg",
      region: ""
    }
  ]
}

function mockFetch() {
  return vi.fn(async (input: string) => {
    const body = input.includes("/sources/") ? SOURCES : STORIES
    return new Response(JSON.stringify(body), { status: 200 })
  })
}

describe("createApiClient", () => {
  it("builds versioned URLs with a single page request", async () => {
    const fetch = mockFetch()
    const api = createApiClient({ baseUrl: "https://api.test/", fetch })
    await api.getStories({ limit: 5000 })
    expect(fetch).toHaveBeenCalledWith(
      "https://api.test/api/v1/stories/?page_size=1000&ordering=-published_at",
      expect.anything()
    )
  })

  it("drops unsafe stories and cleans up fields", async () => {
    const api = createApiClient({
      baseUrl: "https://api.test",
      fetch: mockFetch()
    })
    const stories = await api.getStories()
    expect(stories.map((s) => s.id)).toEqual(["a1", "a3"])

    const [first, second] = stories
    expect(first?.imageUrl).toBeUndefined() // http image removed
    expect(first?.author).toBeUndefined()
    expect(first?.matchedKeywords).toEqual(["Jayapura"])
    expect(first?.readCount).toBe(12)
    expect(first?.kind).toBe("paper")
    expect(first?.venue).toBe("Jurnal Ilmu Lingkungan")
    expect(second?.kind).toBe("article")
    expect(second?.venue).toBeUndefined()
    expect(second?.readCount).toBe(0)
    expect(second?.imageUrl).toBe("https://jubi.id/img.jpg")
    expect(second?.region).toBeUndefined()
  })

  it("validates sources", async () => {
    const api = createApiClient({
      baseUrl: "https://api.test",
      fetch: mockFetch()
    })
    expect(await api.getSources()).toEqual([
      {
        id: "suara-papua",
        name: "Suara Papua",
        homepage: "https://suarapapua.com/",
        storyCount: 3
      },
      { id: "jubi", name: "Jubi", homepage: undefined, storyCount: 0 }
    ])
  })

  it("reports reads with a keepalive POST", async () => {
    const fetch = vi.fn(async () => new Response("{}", { status: 200 }))
    const api = createApiClient({ baseUrl: "https://api.test", fetch })
    await api.markRead("a/1")
    expect(fetch).toHaveBeenCalledWith(
      "https://api.test/api/v1/stories/a%2F1/read/",
      { method: "POST", keepalive: true }
    )
  })

  it("throws on HTTP errors", async () => {
    const fetch = vi.fn(async () => new Response("nope", { status: 503 }))
    const api = createApiClient({ baseUrl: "https://api.test", fetch })
    await expect(api.getStories()).rejects.toThrow("503")
  })
})
