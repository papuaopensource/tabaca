import { toSafeUrl } from "./safety"
import type { Region, Source, Story, StoryKind } from "./types"

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function optionalStr(value: unknown): string | undefined {
  return str(value) || undefined
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0
}

function kind(value: unknown): StoryKind {
  return value === "paper" ? "paper" : "article"
}

function region(value: unknown): Region | undefined {
  return value === "IDN" || value === "PNG" ? value : undefined
}

/** Validates one item from `/api/v1/sources/`. Returns `null` if unusable. */
export function parseSource(raw: unknown): Source | null {
  if (!isObject(raw)) return null
  const id = str(raw.id)
  const name = str(raw.name)
  if (!id || !name) return null

  return {
    id,
    name,
    homepage: toSafeUrl(raw.homepage),
    storyCount: count(raw.storyCount)
  }
}

/**
 * Validates one item from `/api/v1/stories/`. Stories without a safe http(s)
 * link are dropped entirely; unsafe (non-https) images are just removed.
 */
export function parseStory(raw: unknown): Story | null {
  if (!isObject(raw)) return null
  const id = str(raw.id)
  const title = str(raw.title)
  const source = str(raw.source)
  const url = toSafeUrl(raw.url)
  if (!id || !title || !source || !url) return null

  return {
    id,
    title,
    url,
    source,
    author: optionalStr(raw.author),
    publishedAt: str(raw.publishedAt),
    snippet: str(raw.snippet),
    imageUrl: toSafeUrl(raw.imageUrl, { httpsOnly: true }),
    matchedKeywords: Array.isArray(raw.matchedKeywords)
      ? raw.matchedKeywords.filter(
          (kw): kw is string => typeof kw === "string" && kw.length > 0
        )
      : [],
    fetchedAt: str(raw.fetchedAt),
    region: region(raw.region),
    readCount: count(raw.readCount),
    kind: kind(raw.kind),
    venue: optionalStr(raw.venue)
  }
}

/** Extracts `results` from a DRF paginated response (or accepts a bare array). */
export function extractResults(body: unknown): unknown[] {
  if (Array.isArray(body)) return body
  if (isObject(body) && Array.isArray(body.results)) return body.results
  throw new Error("Unexpected API response shape")
}
