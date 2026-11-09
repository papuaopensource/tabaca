import { extractResults, parseSource, parseStory } from "./parse"
import type { Source, Story } from "./types"

/** Backend caps `page_size` at 1000 (see `StandardPagination`). */
export const MAX_PAGE_SIZE = 1000

export interface ApiClientOptions {
  /** Backend origin, e.g. `https://api.tabaca.id` (no `/api/v1`). */
  baseUrl: string
  /** Custom fetch implementation (tests, SSR). Defaults to global `fetch`. */
  fetch?: (input: string, init?: RequestInit) => Promise<Response>
}

export interface ApiClient {
  getSources(): Promise<Source[]>
  getStories(options?: { limit?: number }): Promise<Story[]>
  /**
   * Reports that a story was opened. Uses `keepalive` so the request survives
   * the page navigating to the article.
   */
  markRead(storyId: string): Promise<void>
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const base = options.baseUrl.replace(/\/+$/, "")
  // Wrap instead of passing `globalThis.fetch` directly: calling an unbound
  // fetch throws "Illegal invocation" in browsers and service workers.
  const doFetch =
    options.fetch ??
    ((input: string, init?: RequestInit) => globalThis.fetch(input, init))

  async function getList(path: string, params: Record<string, string>) {
    const query = new URLSearchParams(params).toString()
    const res = await doFetch(`${base}/api/v1/${path}/?${query}`, {
      headers: { Accept: "application/json" }
    })
    if (!res.ok) throw new Error(`API responded with ${res.status}`)
    return extractResults(await res.json())
  }

  async function getSources(): Promise<Source[]> {
    const items = await getList("sources", {
      page_size: String(MAX_PAGE_SIZE)
    })
    return items.map(parseSource).filter((s): s is Source => s !== null)
  }

  async function getStories({ limit = MAX_PAGE_SIZE } = {}): Promise<Story[]> {
    const pageSize = Math.max(1, Math.min(limit, MAX_PAGE_SIZE))
    const items = await getList("stories", {
      page_size: String(pageSize),
      ordering: "-published_at"
    })
    return items.map(parseStory).filter((s): s is Story => s !== null)
  }

  async function markRead(storyId: string): Promise<void> {
    const res = await doFetch(
      `${base}/api/v1/stories/${encodeURIComponent(storyId)}/read/`,
      { method: "POST", keepalive: true }
    )
    if (!res.ok) throw new Error(`API responded with ${res.status}`)
  }

  return { getSources, getStories, markRead }
}
