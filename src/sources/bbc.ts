import { hashString } from "@/lib/hash"
import { fetchRss } from "@/lib/rss"
import { htmlToText, truncate } from "@/lib/sanitize"
import { toISO } from "@/lib/date"
import type { Story } from "@/storage/schema"
import type { RawItem, SourceAdapter } from "./types"

// BBC Asia feed — broadest coverage relevant to Papua
const FEED_URL = "https://feeds.bbci.co.uk/news/world/asia/rss.xml"

export const bbcAdapter: SourceAdapter = {
  id: "bbc",
  name: "BBC News",
  homepage: "https://www.bbc.com/news/world/asia",
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
      source: "bbc",
      author: raw.author || undefined,
      publishedAt: toISO(raw.pubDate),
      snippet,
      imageUrl: raw.imageUrl || undefined,
      fetchedAt: new Date().toISOString()
    }
  }
}
