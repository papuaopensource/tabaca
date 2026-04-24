import { hashString } from "@/lib/hash"
import { fetchRss } from "@/lib/rss"
import { htmlToText, truncate } from "@/lib/sanitize"
import { toISO } from "@/lib/date"
import type { Story } from "@/storage/schema"
import type { RawItem, SourceAdapter } from "./types"

// The Conversation Asia+Pacific feed — highly relevant for Papua coverage
const FEED_URL = "https://theconversation.com/asia-pacific/articles.atom"

export const theConversationAdapter: SourceAdapter = {
  id: "theconversation",
  name: "The Conversation",
  homepage: "https://theconversation.com/asia-pacific",
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
      source: "theconversation",
      author: raw.author || undefined,
      publishedAt: toISO(raw.pubDate),
      snippet,
      imageUrl: raw.imageUrl || undefined,
      fetchedAt: new Date().toISOString()
    }
  }
}
