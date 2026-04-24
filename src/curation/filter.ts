import type { Region } from "@/storage/schema"
import { PAPUA_KEYWORDS } from "./keywords"

export interface FilterResult {
  passes: boolean
  score: number
  matchedKeywords: string[]
  region: Region
}

export function filterByPapuaScope(text: string): FilterResult {
  const normalized = text.toLowerCase()
  const matched: string[] = []
  let score = 0
  let hasIDN = false
  let hasPNG = false

  for (const entry of PAPUA_KEYWORDS) {
    const term = entry.term.toLowerCase()
    const pattern = new RegExp(`\\b${escapeRegex(term)}\\b`, "i")

    if (pattern.test(normalized)) {
      matched.push(entry.term)
      score += entry.weight

      if (entry.region === "IDN" || entry.region === "BOTH") hasIDN = true
      if (entry.region === "PNG" || entry.region === "BOTH") hasPNG = true
    }
  }

  const region: Region = hasIDN ? "IDN" : "PNG"

  return {
    passes: score >= 1,
    score,
    matchedKeywords: [...new Set(matched)],
    region
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
