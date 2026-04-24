import { describe, it, expect } from "vitest"
import { filterByPapuaScope } from "./filter"

describe("filterByPapuaScope", () => {
  it("passes articles mentioning Papua", () => {
    const result = filterByPapuaScope(
      "Indonesian government announces new policy for Papua region"
    )
    expect(result.passes).toBe(true)
    expect(result.matchedKeywords).toContain("Papua")
  })

  it("passes articles mentioning Jayapura", () => {
    const result = filterByPapuaScope(
      "Protests erupt in Jayapura over mining rights"
    )
    expect(result.passes).toBe(true)
    expect(result.matchedKeywords).toContain("Jayapura")
  })

  it("passes articles about West Papua", () => {
    const result = filterByPapuaScope(
      "Human rights groups report abuses in West Papua"
    )
    expect(result.passes).toBe(true)
    expect(result.region).toBe("IDN")
  })

  it("detects Papua New Guinea as PNG region", () => {
    const result = filterByPapuaScope(
      "Papua New Guinea holds general elections"
    )
    expect(result.passes).toBe(true)
    expect(result.matchedKeywords).toContain("Papua New Guinea")
  })

  it("rejects unrelated articles", () => {
    const result = filterByPapuaScope(
      "UK parliament votes on new economic reform bill"
    )
    expect(result.passes).toBe(false)
    expect(result.matchedKeywords).toHaveLength(0)
  })

  it("is case-insensitive", () => {
    const result = filterByPapuaScope("NEWS FROM JAYAPURA: local protests")
    expect(result.passes).toBe(true)
  })

  it("matches Raja Ampat", () => {
    const result = filterByPapuaScope(
      "Conservation efforts in Raja Ampat marine park"
    )
    expect(result.passes).toBe(true)
  })

  it("scores higher weight keywords correctly", () => {
    const single = filterByPapuaScope("Papua")
    const multiple = filterByPapuaScope("Papua West Papua Jayapura")
    expect(multiple.score).toBeGreaterThan(single.score)
  })
})
