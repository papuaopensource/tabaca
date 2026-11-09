export interface SafeUrlOptions {
  /** Reject plain `http:` URLs (used for images, which load inside the extension page). */
  httpsOnly?: boolean
}

/**
 * Returns a normalized URL only if it uses http(s). Anything else
 * (`javascript:`, `data:`, relative paths, garbage) yields `undefined`, so
 * values coming from third-party feeds can never become executable links.
 */
export function toSafeUrl(
  value: unknown,
  { httpsOnly = false }: SafeUrlOptions = {}
): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return undefined
  }

  const allowed = httpsOnly ? ["https:"] : ["https:", "http:"]
  if (!allowed.includes(url.protocol)) return undefined
  if (url.username || url.password) return undefined
  return url.href
}
