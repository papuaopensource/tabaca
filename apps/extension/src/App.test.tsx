import type { Story } from "@tabaca/api"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fakeBrowser } from "wxt/testing/fake-browser"
import App from "./App"
import { metaItem, seenItem, storiesItem } from "./storage"

const now = Date.now()

function story(
  id: string,
  site: string,
  hoursAgo: number,
  extra: Partial<Story> = {}
): Story {
  return {
    id,
    title: `Cerita ${id} dari Jayapura`,
    url: `https://www.${site}/${id}`,
    source: site.split(".")[0]!,
    publishedAt: new Date(now - hoursAgo * 3_600_000).toISOString(),
    snippet: `Ringkasan ${id}`,
    matchedKeywords: ["Jayapura", "Papua Tengah"],
    fetchedAt: new Date(now).toISOString(),
    readCount: 0,
    kind: "article",
    ...extra
  }
}

const STORIES = [
  story("a", "suarapapua.com", 1, {
    imageUrl: "https://suarapapua.com/a.jpg",
    readCount: 1520
  }),
  story("b", "laolaopapua.com", 2, { title: "Konflik di Nduga" }),
  story("c", "suarapapua.com", 3)
]

const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }))

beforeEach(() => {
  fakeBrowser.reset()
  fetchMock.mockClear()
  vi.stubGlobal("fetch", fetchMock)
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn(async () => undefined) }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function seed(stories: Story[], meta = {}) {
  await storiesItem.setValue(stories)
  // A recent attempt, so opening the tab doesn't trigger a network refresh.
  await metaItem.setValue({
    lastFetchAt: new Date(now).toISOString(),
    lastAttemptAt: new Date(now).toISOString(),
    ...meta
  })
}

const cardTitles = () =>
  screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)

async function renderWithStories() {
  await seed(STORIES)
  render(<App />)
  return screen.findByRole("link", { name: "Cerita a dari Jayapura" })
}

describe("new tab", () => {
  it("shows story cards with plain attribution", async () => {
    const link = await renderWithStories()
    expect(link).toHaveAttribute("href", "https://www.suarapapua.com/a")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")

    const card = link.closest("article")!
    expect(within(card).getByText(/suarapapua\.com/)).toBeInTheDocument()
    expect(within(card).getByText("#jayapura")).toBeInTheDocument()
    expect(within(card).getByText("#papua-tengah")).toBeInTheDocument()
    expect(
      within(card).getByTitle("Read 1,520 times via Tabaca")
    ).toHaveTextContent("1.5K")
    // Copy link is the only action: no voting, no comments.
    expect(within(card).getAllByRole("button")).toHaveLength(1)
  })

  it("keeps the chrome minimal", async () => {
    await renderWithStories()
    expect(screen.queryByText(/Good (morning|afternoon|evening)/)).toBeNull()
    expect(screen.queryByRole("button", { name: /mode/i })).toBeNull()
    expect(screen.queryByRole("link", { name: /GitHub/ })).toBeNull()
    // Search lives in the top bar only.
    expect(screen.getAllByRole("button", { name: /Search/ })).toHaveLength(1)
    expect(screen.queryByRole("button", { name: /^(All|Semua)/ })).toBeNull()
  })

  it("shows a short About dialog without a list of sources", async () => {
    await renderWithStories()
    fireEvent.click(screen.getByRole("button", { name: "About" }))

    const dialog = await screen.findByRole("dialog", { name: "Tabaca" })
    expect(
      within(dialog).getByRole("link", { name: /GitHub/ })
    ).toHaveAttribute("href", "https://github.com/papuaopensource/tabaca")
    expect(within(dialog).queryByText(/Suara Papua|Sources/)).toBeNull()
    expect(within(dialog).getByText(/These are our picks/)).toBeInTheDocument()
  })

  it("lists the newest stories first in the Latest view", async () => {
    await renderWithStories()
    fireEvent.click(screen.getAllByRole("button", { name: "Latest" })[0]!)

    expect(
      await screen.findByRole("heading", { level: 1, name: "Latest" })
    ).toBeInTheDocument()
    expect(cardTitles()).toEqual([
      "Cerita a dari Jayapura",
      "Konflik di Nduga",
      "Cerita c dari Jayapura"
    ])
  })

  it("copies a link, confirms with a toast and offers sharing", async () => {
    const link = await renderWithStories()
    const card = link.closest("article")!

    fireEvent.click(within(card).getByRole("button", { name: "Copy link" }))

    expect(await screen.findByText("Link copied")).toBeInTheDocument()
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://www.suarapapua.com/a"
    )
    const whatsapp = within(card).getByRole("link", {
      name: "Share on WhatsApp"
    })
    expect(whatsapp.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\?text=/)
  })

  it("opens a summary dialog when a card is clicked", async () => {
    const link = await renderWithStories()
    fireEvent.click(link)

    const dialog = await screen.findByRole("dialog", {
      name: "Cerita a dari Jayapura"
    })
    expect(within(dialog).getByText("Ringkasan a")).toBeInTheDocument()
    expect(within(dialog).getByText("#papua-tengah")).toBeInTheDocument()
    const readFull = within(dialog).getByRole("link", {
      name: /Read full story/
    })
    expect(readFull).toHaveAttribute("href", "https://www.suarapapua.com/a")
    expect(readFull).toHaveAttribute("target", "_blank")
    // Opening the summary is not a read.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("steps through stories in the dialog", async () => {
    await renderWithStories()
    fireEvent.click(screen.getAllByRole("button", { name: "Latest" })[0]!)
    fireEvent.click(
      await screen.findByRole("link", { name: "Cerita a dari Jayapura" })
    )
    const dialog = await screen.findByRole("dialog", {
      name: "Cerita a dari Jayapura"
    })
    expect(
      within(dialog).getByRole("button", { name: "Previous story" })
    ).toBeDisabled()

    fireEvent.click(within(dialog).getByRole("button", { name: "Next story" }))
    expect(
      within(dialog).getByRole("heading", { name: "Konflik di Nduga" })
    ).toBeInTheDocument()

    fireEvent.keyDown(dialog, { key: "ArrowRight" })
    expect(
      within(dialog).getByRole("heading", { name: "Cerita c dari Jayapura" })
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole("button", { name: "Next story" })
    ).toBeDisabled()
  })

  it("copies a link from the dialog with feedback", async () => {
    const link = await renderWithStories()
    fireEvent.click(link)
    const dialog = await screen.findByRole("dialog")

    fireEvent.click(within(dialog).getByRole("button", { name: "Copy link" }))

    expect(await screen.findByText("Link copied")).toBeInTheDocument()
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://www.suarapapua.com/a"
    )
    await waitFor(() =>
      expect(
        within(dialog)
          .getByRole("button", { name: "Copy link" })
          .querySelector(".lucide-check")
      ).not.toBeNull()
    )
  })

  it("counts a read once per browser when the full story is opened", async () => {
    const link = await renderWithStories()
    fireEvent.click(link)
    const dialog = await screen.findByRole("dialog")
    const readFull = within(dialog).getByRole("link", {
      name: /Read full story/
    })
    // jsdom can't open tabs; we only care about the read report.
    readFull.addEventListener("click", (e) => e.preventDefault())

    fireEvent.click(readFull)
    await expect.poll(() => fetchMock.mock.calls.length).toBe(1)
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/stories/a/read/",
      { method: "POST", keepalive: true }
    )

    fireEvent.click(readFull)
    await new Promise((r) => setTimeout(r, 50))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("goes straight to the article on Ctrl/⌘-click", async () => {
    await renderWithStories()
    const link = screen.getByRole("link", { name: "Konflik di Nduga" })
    link.addEventListener("click", (e) => e.preventDefault())

    fireEvent.click(link, { ctrlKey: true })

    expect(screen.queryByRole("dialog")).toBeNull()
    await expect.poll(() => fetchMock.mock.calls.length).toBe(1)
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/stories/b/read/",
      { method: "POST", keepalive: true }
    )
  })

  it("remembers which stories were shown", async () => {
    await renderWithStories()
    await expect
      .poll(async () => (await seenItem.getValue()).map((e) => e.id).sort())
      .toEqual(["a", "b", "c"])
  })

  it("searches stories from the keyboard", async () => {
    await renderWithStories()

    fireEvent.keyDown(window, { key: "/" })
    const input = await screen.findByRole("textbox", { name: "Search query" })
    fireEvent.change(input, { target: { value: "nduga" } })

    const results = screen.getByRole("listbox", { name: "Search results" })
    const options = within(results).getAllByRole("option")
    expect(options[0]).toHaveTextContent("Search the web for “nduga”")
    expect(options[1]).toHaveTextContent("Konflik di Nduga")
    expect(options[1]).toHaveTextContent("laolaopapua.com")
    expect(options).toHaveLength(2)

    fireEvent.click(options[1]!)
    expect(
      await screen.findByRole("dialog", { name: "Konflik di Nduga" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("textbox", { name: "Search query" })).toBeNull()
  })

  it("explains when the backend can't be reached", async () => {
    await seed([], {
      lastFetchAt: undefined,
      lastError: "API responded with 500"
    })
    render(<App />)

    expect(await screen.findByText("Can’t reach Tabaca")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Try again/ })
    ).toBeInTheDocument()
  })

  it("loads more stories while scrolling, without a button", async () => {
    let trigger: (() => void) | undefined
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          trigger = () =>
            callback(
              [{ isIntersecting: true } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver
            )
        }
        observe() {}
        disconnect() {}
      }
    )
    await seed(manyStories(30))
    render(<App />)
    await screen.findAllByRole("article")
    expect(screen.getAllByRole("article")).toHaveLength(12)
    expect(screen.queryByRole("button", { name: "Show more" })).toBeNull()

    act(() => trigger?.())
    expect(screen.getAllByRole("article")).toHaveLength(24)
    act(() => trigger?.())
    expect(screen.getAllByRole("article")).toHaveLength(30)
    expect(screen.getByText("That’s everything for now.")).toBeInTheDocument()
  })

  it("falls back to a Show more button without IntersectionObserver", async () => {
    await seed(manyStories(30))
    render(<App />)
    await screen.findAllByRole("article")

    fireEvent.click(screen.getByRole("button", { name: "Show more" }))
    expect(screen.getAllByRole("article")).toHaveLength(24)
  })

  it("shows research with a cover, its journal and a full-text link", async () => {
    await seed([
      story("p", "doi.org", 1, {
        title: "Participation Theater: Papua Barat’s Special Autonomy",
        url: "https://doi.org/10.3390/soc1",
        kind: "paper",
        venue: "Societies",
        author: "A. Wenda, B. Kogoya",
        imageUrl: undefined
      })
    ])
    render(<App />)
    const link = await screen.findByRole("link", {
      name: /Participation Theater/
    })
    const card = link.closest("article")!
    expect(within(card).getByText("Research")).toBeInTheDocument()
    expect(within(card).getAllByText(/Societies/).length).toBeGreaterThan(0)
    expect(within(card).queryByText(/doi\.org/)).toBeNull()

    fireEvent.click(link)
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Research · Societies")).toBeInTheDocument()
    expect(
      within(dialog).getByText(/by A\. Wenda, B\. Kogoya/)
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole("link", { name: /Read full text/ })
    ).toHaveAttribute("href", "https://doi.org/10.3390/soc1")
  })

  it("filters by type with tabs", async () => {
    await seed([
      story("a", "sastrapapua.org", 1, { title: "Esai tentang noken" }),
      story("p", "doi.org", 2, {
        title: "Kajian sistem noken",
        url: "https://doi.org/10.1/noken",
        kind: "paper",
        venue: "SASI",
        imageUrl: undefined
      })
    ])
    render(<App />)
    await screen.findByRole("link", { name: "Esai tentang noken" })

    const tabs = screen.getByRole("tablist", { name: "Type" })
    expect(within(tabs).getByRole("tab", { name: /All/ })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(
      within(tabs).getByRole("tab", { name: /Research/ })
    ).toHaveTextContent("1")

    fireEvent.click(within(tabs).getByRole("tab", { name: /Research/ }))
    expect(cardTitles()).toEqual(["Kajian sistem noken"])

    fireEvent.click(within(tabs).getByRole("tab", { name: /Articles/ }))
    expect(cardTitles()).toEqual(["Esai tentang noken"])
  })
})

function manyStories(n: number): Story[] {
  return Array.from({ length: n }, (_, i) =>
    story(`m${i}`, "sastrapapua.org", i + 1, { title: `Esai ${i}` })
  )
}
