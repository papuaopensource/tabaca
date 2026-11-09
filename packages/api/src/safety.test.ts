import { describe, expect, it } from "vitest"
import { toSafeUrl } from "./safety"

describe("toSafeUrl", () => {
  it("accepts http and https links", () => {
    expect(toSafeUrl("https://jubi.id/a")).toBe("https://jubi.id/a")
    expect(toSafeUrl("http://jubi.id/a")).toBe("http://jubi.id/a")
  })

  it("rejects executable and non-web schemes", () => {
    expect(toSafeUrl("javascript:alert(1)")).toBeUndefined()
    expect(toSafeUrl(" JavaScript:alert(1)")).toBeUndefined()
    expect(toSafeUrl("data:text/html,<script>")).toBeUndefined()
    expect(toSafeUrl("chrome://settings")).toBeUndefined()
  })

  it("rejects relative paths, credentials and non-strings", () => {
    expect(toSafeUrl("/relative/path")).toBeUndefined()
    expect(toSafeUrl("https://user:pass@example.com")).toBeUndefined()
    expect(toSafeUrl("")).toBeUndefined()
    expect(toSafeUrl(null)).toBeUndefined()
    expect(toSafeUrl(42)).toBeUndefined()
  })

  it("requires https when httpsOnly is set", () => {
    expect(
      toSafeUrl("http://img.example/a.jpg", { httpsOnly: true })
    ).toBeUndefined()
    expect(toSafeUrl("https://img.example/a.jpg", { httpsOnly: true })).toBe(
      "https://img.example/a.jpg"
    )
  })
})
