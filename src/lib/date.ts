import { formatDistanceToNow, format, parseISO, isValid } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isValid(d)) return d
    const parsed = parseISO(dateStr)
    if (isValid(parsed)) return parsed
  } catch {
    // noop
  }
  return null
}

export function relativeTime(dateStr: string): string {
  const d = parseDate(dateStr)
  if (!d) return ""
  return formatDistanceToNow(d, { addSuffix: true, locale: idLocale })
}

export function formatDate(dateStr: string): string {
  const d = parseDate(dateStr)
  if (!d) return ""
  return format(d, "d MMM yyyy", { locale: idLocale })
}

export function toISO(dateStr: string): string {
  const d = parseDate(dateStr)
  if (!d) return new Date().toISOString()
  return d.toISOString()
}
