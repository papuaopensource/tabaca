import type { Story } from "@/storage/schema"

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000"

interface ApiStory {
  id: string
  title: string
  url: string
  source: string
  author?: string
  publishedAt: string
  snippet: string
  imageUrl?: string
  matchedKeywords: string[]
  fetchedAt: string
  region?: "IDN" | "PNG"
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function fetchStoriesFromApi(): Promise<Story[]> {
  const stories: Story[] = []
  let url: string | null =
    `${BASE_URL}/api/v1/stories/?page_size=100&ordering=-published_at`

  while (url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API responded with ${res.status}`)

    const data: PaginatedResponse<ApiStory> = await res.json()

    for (const item of data.results) {
      stories.push({
        id: item.id,
        title: item.title,
        url: item.url,
        source: item.source as Story["source"],
        author: item.author,
        publishedAt: item.publishedAt,
        snippet: item.snippet,
        imageUrl: item.imageUrl,
        matchedKeywords: item.matchedKeywords,
        fetchedAt: item.fetchedAt,
        region: item.region,
      })
    }

    // Follow pagination but cap at 200 stories total
    url = stories.length < 200 ? data.next : null
  }

  return stories
}
