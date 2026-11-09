import type { Story } from "@tabaca/api"
import { siteName } from "./site"

/** Where a story comes from: the journal for papers, the website otherwise. */
export function attribution(story: Story): string {
  if (story.kind === "paper") return story.venue || "Open access research"
  return siteName(story.url)
}
