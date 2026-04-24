import { hashString } from "@/lib/hash"
import { fetchRss } from "@/lib/rss"
import { htmlToText, truncate } from "@/lib/sanitize"
import { toISO } from "@/lib/date"
import type { Story } from "@/storage/schema"
import type { RawItem, SourceAdapter } from "./types"

// Jubi — Jurnalis Papua. Seluruh konten tentang Papua, tidak perlu filter ketat.
const FEED_URL = "https://jubi.id/feed/"

export const jubiAdapter: SourceAdapter = {
  id: "jubi",
  name: "Jubi",
  homepage: "https://jubi.id",
  feedUrl: FEED_URL,

  async fetch(): Promise<RawItem[]> {
    return fetchRss(FEED_URL)
  },

  normalize(raw: RawItem): Omit<Story, "matchedKeywords" | "region"> {
    const snippet = truncate(htmlToText(raw.description), 200)
    return {
      id: hashString(raw.link),
      title: htmlToText(raw.title),
      url: raw.link,
      source: "jubi",
      author: raw.author || undefined,
      publishedAt: toISO(raw.pubDate),
      snippet,
      imageUrl: raw.imageUrl || undefined,
      fetchedAt: new Date().toISOString()
    }
  }
}
