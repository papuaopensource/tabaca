import { describe, expect, it } from "vitest"
import { SHARE_TARGETS } from "./share"

const story = {
  title: "Kabar & cerita dari Jayapura",
  url: "https://suarapapua.com/a?b=1"
}

describe("SHARE_TARGETS", () => {
  it("builds encoded share links for every target", () => {
    const urls = Object.fromEntries(
      SHARE_TARGETS.map((t) => [t.name, t.url(story)])
    )
    expect(urls.WhatsApp).toBe(
      "https://wa.me/?text=Kabar%20%26%20cerita%20dari%20Jayapura%20https%3A%2F%2Fsuarapapua.com%2Fa%3Fb%3D1"
    )
    expect(urls.X).toContain("url=https%3A%2F%2Fsuarapapua.com%2Fa%3Fb%3D1")
    expect(urls.Facebook).toBe(
      "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fsuarapapua.com%2Fa%3Fb%3D1"
    )
    expect(urls.Telegram).toContain("t.me/share/url?url=")
  })

  it("ships an icon path and brand color for each target", () => {
    for (const target of SHARE_TARGETS) {
      expect(target.path.length).toBeGreaterThan(20)
      expect(target.color).toMatch(/^#[0-9A-F]{6}$/i)
    }
  })
})
