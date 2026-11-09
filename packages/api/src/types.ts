export type Region = "IDN" | "PNG"

/** Articles always have a thumbnail; papers (journals, books, reports) may not. */
export type StoryKind = "article" | "paper"

/** A news feed the admins follow (`/api/v1/sources/`). */
export interface Source {
  id: string
  name: string
  homepage?: string
  storyCount: number
}

/** A curated, Papua-related story (`/api/v1/stories/`). */
export interface Story {
  id: string
  title: string
  url: string
  /** Id of the feed this story came from. */
  source: string
  author?: string
  publishedAt: string
  snippet: string
  imageUrl?: string
  matchedKeywords: string[]
  fetchedAt: string
  region?: Region
  /** How often the story was opened from Tabaca (anonymous counter). */
  readCount: number
  kind: StoryKind
  /** Journal or publisher, for papers. */
  venue?: string
}
