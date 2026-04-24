import { XMLParser } from "fast-xml-parser"

export interface ParsedItem {
  title: string
  link: string
  description: string
  pubDate: string
  author: string
  imageUrl: string
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["item", "entry"].includes(name),
  trimValues: true
})

export async function fetchRss(url: string): Promise<ParsedItem[]> {
  const res = await fetch(url, {
    headers: { Accept: "application/rss+xml, application/atom+xml, text/xml" }
  })

  if (!res.ok) {
    throw new Error(`RSS fetch failed: ${res.status} ${url}`)
  }

  const text = await res.text()
  return parseRss(text)
}

export function parseRss(xml: string): ParsedItem[] {
  const parsed = parser.parse(xml)

  if (parsed.rss?.channel) {
    return parseRss2(parsed.rss.channel)
  }

  if (parsed.feed) {
    return parseAtom(parsed.feed)
  }

  return []
}

function parseRss2(channel: Record<string, unknown>): ParsedItem[] {
  const items = (channel.item as Record<string, unknown>[]) ?? []

  return items.map((item) => ({
    title: extractText(item.title),
    link: extractText(item.link) || extractText(item.guid),
    description: extractText(item.description) || extractText(item.summary),
    pubDate: extractText(item.pubDate) || extractText(item["dc:date"]),
    author:
      extractText(item.author) ||
      extractText(item["dc:creator"]) ||
      extractText(item["media:credit"]),
    imageUrl:
      extractMediaUrl(item["media:content"]) ||
      extractMediaUrl(item["media:thumbnail"]) ||
      extractEnclosureUrl(item.enclosure) ||
      extractImageFromDescription(extractText(item.description))
  }))
}

function parseAtom(feed: Record<string, unknown>): ParsedItem[] {
  const entries = (feed.entry as Record<string, unknown>[]) ?? []

  return entries.map((entry) => ({
    title: extractText(entry.title),
    link: extractAtomLink(entry.link),
    description:
      extractText(entry.summary) || extractText(entry.content),
    pubDate: extractText(entry.published) || extractText(entry.updated),
    author: extractAtomAuthor(entry.author),
    imageUrl:
      extractMediaUrl(entry["media:content"]) ||
      extractMediaUrl(entry["media:thumbnail"]) ||
      extractImageFromDescription(extractText(entry.summary))
  }))
}

function extractText(val: unknown): string {
  if (!val) return ""
  if (typeof val === "string") return val.trim()
  if (typeof val === "number") return String(val)
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>
    if (obj["#text"]) return String(obj["#text"]).trim()
    if (obj["_"]) return String(obj["_"]).trim()
  }
  return ""
}

function extractAtomLink(link: unknown): string {
  if (!link) return ""
  if (typeof link === "string") return link
  if (Array.isArray(link)) {
    const alternate = link.find(
      (l) => (l as Record<string, string>)["@_rel"] === "alternate"
    )
    return String(
      (alternate as Record<string, string>)?.["@_href"] ||
        (link[0] as Record<string, string>)?.["@_href"] ||
        ""
    )
  }
  if (typeof link === "object") {
    const obj = link as Record<string, string>
    return obj["@_href"] || ""
  }
  return ""
}

function extractAtomAuthor(author: unknown): string {
  if (!author) return ""
  if (typeof author === "string") return author
  if (typeof author === "object") {
    return extractText((author as Record<string, unknown>).name)
  }
  return ""
}

function extractMediaUrl(media: unknown): string {
  if (!media) return ""
  if (typeof media === "object") {
    const obj = media as Record<string, unknown>
    return String(obj["@_url"] || "")
  }
  return ""
}

function extractEnclosureUrl(enc: unknown): string {
  if (!enc) return ""
  if (typeof enc === "object") {
    const obj = enc as Record<string, string>
    const type = obj["@_type"] || ""
    if (type.startsWith("image/")) {
      return obj["@_url"] || ""
    }
  }
  return ""
}

function extractImageFromDescription(html: string): string {
  if (!html) return ""
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match ? match[1] : ""
}
