import type { Story } from "@tabaca/api"
import { sortByNewest } from "./curate"
import { attribution } from "./attribution"
import { siteName } from "./site"

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

/** Stories whose title, snippet, topics or site contain every word of the query. */
export function searchStories(stories: Story[], query: string): Story[] {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  return sortByNewest(stories).filter((story) => {
    const haystack = normalize(
      [
        story.title,
        story.snippet,
        story.matchedKeywords.join(" "),
        siteName(story.url),
        attribution(story)
      ].join(" ")
    )
    return words.every((word) => haystack.includes(word))
  })
}
