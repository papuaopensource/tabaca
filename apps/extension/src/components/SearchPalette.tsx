import type { Story } from "@tabaca/api"
import { CornerDownLeft, FileText, Globe, Search } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { cn } from "@/lib/cn"
import { sortByNewest } from "@/lib/curate"
import { searchWeb } from "@/lib/search"
import { searchStories } from "@/lib/searchStories"
import { attribution } from "@/lib/attribution"
import { timeAgo } from "@/lib/time"

const MAX_RESULTS = 6

type Item = { kind: "web"; query: string } | { kind: "story"; story: Story }

interface SearchPaletteProps {
  stories: Story[]
  now: number
  onSelectStory: (story: Story) => void
  onClose: () => void
}

/** Rendered only while open; a native modal <dialog> handles focus trapping and Esc. */
export default function SearchPalette({
  stories,
  now,
  onSelectStory,
  onClose
}: SearchPaletteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const trimmed = query.trim()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const items = useMemo<Item[]>(() => {
    if (!trimmed) {
      return sortByNewest(stories)
        .slice(0, MAX_RESULTS)
        .map((story) => ({ kind: "story", story }))
    }
    return [
      { kind: "web", query: trimmed },
      ...searchStories(stories, trimmed)
        .slice(0, MAX_RESULTS)
        .map((story): Item => ({ kind: "story", story }))
    ]
  }, [stories, trimmed])

  const activeIndex = Math.min(active, Math.max(items.length - 1, 0))
  const storyCount = items.filter((i) => i.kind === "story").length

  const activate = (item: Item | undefined) => {
    if (!item) return
    if (item.kind === "web") {
      void searchWeb(item.query)
      return
    }
    // Stories open their summary, like the cards.
    onSelectStory(item.story)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActive((i) => Math.min(i + 1, items.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === "Enter") {
      event.preventDefault()
      activate(items[activeIndex])
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-label="Search"
      className="mx-auto mt-[12vh] w-[min(92vw,40rem)] overflow-hidden rounded-2xl border border-line bg-surface p-0 text-fg shadow-float backdrop:bg-black/60 backdrop:backdrop-blur-xs open:motion-safe:animate-rise"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search size={18} aria-hidden className="shrink-0 text-subtle" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Search stories or the web…"
          aria-label="Search query"
          aria-controls="search-results"
          aria-activedescendant={
            items.length ? `search-item-${activeIndex}` : undefined
          }
          autoComplete="off"
          className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-hidden placeholder:text-subtle"
        />
      </div>

      <div className="max-h-[min(60vh,28rem)] overflow-y-auto p-2">
        <ul id="search-results" role="listbox" aria-label="Search results">
          {items.map((item, index) => {
            const isActive = index === activeIndex
            const firstStory =
              item.kind === "story" &&
              (index === 0 || items[index - 1]?.kind === "web")
            const Icon = item.kind === "web" ? Globe : FileText
            return (
              <li key={item.kind === "web" ? "web" : item.story.id} role="none">
                {firstStory && (
                  <p className="px-3 pt-2 pb-1.5 text-xs font-semibold text-subtle">
                    {trimmed ? "Stories" : "Latest stories"}
                  </p>
                )}
                <div
                  id={`search-item-${index}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseMove={() => setActive(index)}
                  onClick={() => activate(item)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                    isActive && "bg-surface-muted"
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-subtle">
                    <Icon size={15} aria-hidden />
                  </span>
                  {item.kind === "web" ? (
                    <span className="min-w-0 flex-1 truncate text-sm">
                      Search the web for{" "}
                      <span className="font-semibold">“{item.query}”</span>
                    </span>
                  ) : (
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">
                        {item.story.title}
                      </span>
                      <span className="block truncate text-xs text-subtle">
                        {attribution(item.story)} ·{" "}
                        {timeAgo(item.story.publishedAt, now)}
                      </span>
                    </span>
                  )}
                  {isActive && (
                    <CornerDownLeft
                      size={15}
                      aria-hidden
                      className="shrink-0 text-subtle"
                    />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        {trimmed && storyCount === 0 && (
          <p className="px-3 py-3 text-sm text-muted">
            No matching stories. Press Enter to search the web.
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-xs text-subtle">
        <span>
          <kbd className="font-sans">↵</kbd> Open
        </span>
        <span>
          <kbd className="font-sans">↑↓</kbd> Navigate
        </span>
        <span>
          <kbd className="font-sans">esc</kbd> Close
        </span>
      </div>
    </dialog>
  )
}
