/** "https://www.suarapapua.com/2026/…" → "suarapapua.com" (plain attribution for a story). */
export function siteName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}
