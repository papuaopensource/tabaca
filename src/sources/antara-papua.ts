import { hashString } from "@/lib/hash"
import { fetchRss } from "@/lib/rss"
import { htmlToText, truncate } from "@/lib/sanitize"
import { toISO } from "@/lib/date"
import type { Story } from "@/storage/schema"
import type { RawItem, SourceAdapter } from "./types"

// Antara Papua regional feed
const FEED_URL = "https://www.antaranews.com/rss/terkini.xml"

export const antaraPapuaAdapter: SourceAdapter = {
  id: "antara-papua",
  name: "Antara Papua",
  homepage: "https://www.antaranews.com/tag/papua",
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
      source: "antara-papua",
      author: raw.author || undefined,
      publishedAt: toISO(raw.pubDate),
      snippet,
      imageUrl: raw.imageUrl || undefined,
      fetchedAt: new Date().toISOString()
    }
  }
}
