// UI copy is English; story content stays in its original language.
const LOCALE = "en-US"

const clockFormat = new Intl.DateTimeFormat(LOCALE, {
  hour: "numeric",
  minute: "2-digit"
})
const longDateFormat = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  month: "long",
  day: "numeric"
})
const shortDateFormat = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  day: "numeric"
})
const fullDateFormat = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  day: "numeric",
  year: "numeric"
})

/** "Nov 9, 2026" */
export function formatDate(iso: string): string {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? "" : fullDateFormat.format(t)
}

export function formatClock(date: Date): string {
  return clockFormat.format(date)
}

/** "Tuesday, November 10" */
export function formatLongDate(date: Date): string {
  return longDateFormat.format(date)
}

export function greeting(date: Date): string {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return "Good morning"
  if (hour >= 12 && hour < 18) return "Good afternoon"
  return "Good evening"
}

/** Compact relative time: "just now", "5m ago", "3h ago", "2d ago", "Nov 8". */
export function timeAgo(iso: string | undefined, now: number): string {
  if (!iso) return ""
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ""

  const minutes = Math.floor((now - t) / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  // Include the year for older stories so "Oct 21" isn't mistaken for this year.
  const sameYear = new Date(t).getFullYear() === new Date(now).getFullYear()
  return sameYear ? shortDateFormat.format(t) : fullDateFormat.format(t)
}

const compactNumber = new Intl.NumberFormat(LOCALE, {
  notation: "compact",
  maximumFractionDigits: 1
})

/** 1234 → "1.2K" */
export function formatCount(value: number): string {
  return compactNumber.format(value)
}

/** "Jayapura", "Papua Tengah" → "jayapura", "papua-tengah" (hashtag style). */
export function toTag(keyword: string): string {
  return keyword.trim().toLowerCase().replace(/\s+/g, "-")
}
