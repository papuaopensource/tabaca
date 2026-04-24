import type { SourceId, Story } from "@/storage/schema"

export interface RawItem {
  title: string
  link: string
  description: string
  pubDate: string
  author: string
  imageUrl: string
}

export interface SourceAdapter {
  id: SourceId
  name: string
  homepage: string
  feedUrl: string
  fetch(): Promise<RawItem[]>
  normalize(raw: RawItem): Omit<Story, "matchedKeywords" | "region">
}
