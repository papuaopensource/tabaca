import { describe, expect, it } from "vitest"
import { formatCount, formatDate, greeting, timeAgo, toTag } from "./time"

const NOW = Date.parse("2026-11-10T12:00:00Z")
const ago = (ms: number) => new Date(NOW - ms).toISOString()

describe("timeAgo", () => {
  it("formats compact relative times", () => {
    expect(timeAgo(ago(20_000), NOW)).toBe("just now")
    expect(timeAgo(ago(5 * 60_000), NOW)).toBe("5m ago")
    expect(timeAgo(ago(3 * 3_600_000), NOW)).toBe("3h ago")
    expect(timeAgo(ago(2 * 86_400_000), NOW)).toBe("2d ago")
  })

  it("falls back to a date after a week, with the year if it's not this year", () => {
    expect(timeAgo("2026-10-20T08:00:00Z", NOW)).toBe("Oct 20")
    expect(timeAgo("2021-10-21T08:00:00Z", NOW)).toBe("Oct 21, 2021")
  })

  it("treats future dates as just now and ignores invalid input", () => {
    expect(timeAgo(new Date(NOW + 60_000).toISOString(), NOW)).toBe("just now")
    expect(timeAgo("not a date", NOW)).toBe("")
    expect(timeAgo(undefined, NOW)).toBe("")
  })
})

describe("greeting", () => {
  it.each([
    [7, "Good morning"],
    [13, "Good afternoon"],
    [17, "Good afternoon"],
    [21, "Good evening"],
    [2, "Good evening"]
  ])("at %i:00 says %s", (hour, expected) => {
    expect(greeting(new Date(2026, 10, 10, hour))).toBe(expected)
  })
})

describe("formatting helpers", () => {
  it("compacts counts and builds hashtags", () => {
    expect(formatCount(1520)).toBe("1.5K")
    expect(formatCount(12)).toBe("12")
    expect(toTag("Papua Tengah")).toBe("papua-tengah")
    expect(formatDate("2026-11-09T08:00:00Z")).toBe("Nov 9, 2026")
    expect(formatDate("nope")).toBe("")
  })
})
