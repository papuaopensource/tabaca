import type { Story, StoryKind } from "@tabaca/api"
import { Shuffle } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import AboutPanel from "./components/AboutPanel"
import EmptyState from "./components/EmptyState"
import FeedSkeleton from "./components/FeedSkeleton"
import SearchPalette from "./components/SearchPalette"
import Sidebar from "./components/Sidebar"
import type { FeedView } from "./components/Sidebar"
import StoryCard from "./components/StoryCard"
import StoryDialog from "./components/StoryDialog"
import Toast from "./components/Toast"
import type { ToastMessage } from "./components/Toast"
import TopBar from "./components/TopBar"
import { rememberShown, useForYou } from "./hooks/useForYou"
import {
  supportsInfiniteScroll,
  useInfiniteScroll
} from "./hooks/useInfiniteScroll"
import { useFeed } from "./hooks/useFeed"
import { useNow } from "./hooks/useNow"
import { useRefresh } from "./hooks/useRefresh"
import { cn } from "./lib/cn"
import { sortByNewest } from "./lib/curate"
import { markStoryRead } from "./lib/feed"
import { readFlag, writeFlag } from "./lib/localPref"
import { timeAgo } from "./lib/time"

const PAGE_SIZE = 12
const SIDEBAR_KEY = "tabaca:sidebar-expanded"
const TOAST_MS = 2500
const VIEW_TITLES: Record<FeedView, string> = {
  foryou: "For you",
  latest: "Latest"
}

type KindFilter = "all" | StoryKind
const KIND_TABS: { key: KindFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "article", label: "Articles" },
  { key: "paper", label: "Research" }
]

// Stories cached by older versions have no kind; they are articles.
const kindOf = (story: Story): StoryKind => story.kind ?? "article"

export default function App() {
  const { stories, meta, isLoading } = useFeed()
  const { isRefreshing, refresh } = useRefresh(meta, !isLoading)
  const { ranked, reshuffle, isReady } = useForYou(stories, !isLoading)
  const now = useNow(60_000).getTime()

  const [view, setView] = useState<FeedView>("foryou")
  const [kindFilter, setKindFilter] = useState<KindFilter>("all")
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [sidebarExpanded, setSidebarExpanded] = useState(() =>
    readFlag(SIDEBAR_KEY, true)
  )
  const [searchOpen, setSearchOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [openStoryId, setOpenStoryId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const latest = useMemo(() => sortByNewest(stories), [stories])
  const ordered = view === "foryou" ? ranked : latest
  const list = useMemo(
    () =>
      kindFilter === "all"
        ? ordered
        : ordered.filter((s) => kindOf(s) === kindFilter),
    [ordered, kindFilter]
  )
  const kindCounts = useMemo(() => {
    const counts: Record<KindFilter, number> = {
      all: stories.length,
      article: 0,
      paper: 0
    }
    for (const story of stories) counts[kindOf(story)] += 1
    return counts
  }, [stories])
  const visible = useMemo(() => list.slice(0, limit), [list, limit])
  const hasMore = list.length > visible.length
  const sentinelRef = useInfiniteScroll(
    () => setLimit((n) => n + PAGE_SIZE),
    hasMore,
    visible.length
  )
  const openIndex = openStoryId
    ? list.findIndex((s) => s.id === openStoryId)
    : -1
  const openStory = openIndex >= 0 ? list[openIndex] : undefined

  // Nothing cached yet and the first fetch hasn't finished: keep the skeleton.
  const awaitingFirstFetch = !meta.lastAttemptAt || isRefreshing
  const showSkeleton = !isReady || (visible.length === 0 && awaitingFirstFetch)

  // Remember what this tab showed so the next tab favours other stories.
  useEffect(() => {
    if (view === "foryou") void rememberShown(visible.map((s) => s.id))
  }, [view, visible])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), TOAST_MS)
    return () => window.clearTimeout(timer)
  }, [toast])

  // ⌘K / Ctrl+K or "/" opens search, like daily.dev.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Dialogs handle their own keys.
      if (document.querySelector("dialog[open]")) return
      const target = event.target as HTMLElement | null
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      const shortcut =
        (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) ||
        (event.key === "/" && !typing)
      if (shortcut) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const changeView = (next: FeedView) => {
    setView(next)
    setLimit(PAGE_SIZE)
    window.scrollTo({ top: 0 })
  }

  const changeKind = (next: KindFilter) => {
    setKindFilter(next)
    setLimit(PAGE_SIZE)
    window.scrollTo({ top: 0 })
  }

  const toggleSidebar = () => {
    setSidebarExpanded((expanded) => {
      writeFlag(SIDEBAR_KEY, !expanded)
      return !expanded
    })
  }

  const onSelectStory = (story: Story) => {
    setSearchOpen(false)
    setOpenStoryId(story.id)
  }

  const onReadFull = useCallback((story: Story) => {
    void markStoryRead(story.id)
  }, [])

  const onCopied = useCallback(
    () => setToast({ text: "Link copied", id: Date.now() }),
    []
  )

  return (
    <div className="min-h-screen">
      <Sidebar
        expanded={sidebarExpanded}
        view={view}
        onViewChange={changeView}
        onAbout={() => setAboutOpen(true)}
      />

      <div
        className={cn(
          "transition-[padding] duration-200 md:pl-16",
          sidebarExpanded && "lg:pl-60"
        )}
      >
        <TopBar
          sidebarExpanded={sidebarExpanded}
          updatedLabel={
            meta.lastFetchAt ? `Updated ${timeAgo(meta.lastFetchAt, now)}` : ""
          }
          isRefreshing={isRefreshing}
          onToggleSidebar={toggleSidebar}
          onSearch={() => setSearchOpen(true)}
          onRefresh={refresh}
        />

        <main className="@container mx-auto max-w-[1400px] px-4 pt-6 pb-16 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-fg">
              {VIEW_TITLES[view]}
            </h1>
            <div className="flex items-center gap-2">
              {/* The sidebar holds these on larger screens. */}
              <div className="flex rounded-xl border border-line p-1 md:hidden">
                {(Object.keys(VIEW_TITLES) as FeedView[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => changeView(key)}
                    aria-pressed={view === key}
                    className={cn(
                      "focus-ring rounded-lg px-3 py-1.5 text-sm font-medium",
                      view === key ? "bg-surface-muted text-fg" : "text-muted"
                    )}
                  >
                    {VIEW_TITLES[key]}
                  </button>
                ))}
              </div>
              {view === "foryou" && visible.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    reshuffle(visible.map((s) => s.id))
                    setLimit(PAGE_SIZE)
                  }}
                  className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-line px-3.5 text-sm font-medium text-fg-soft transition-colors hover:border-line-strong hover:text-fg"
                >
                  <Shuffle size={15} aria-hidden />
                  Shuffle
                </button>
              )}
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Type"
            className="mb-6 flex gap-1 border-b border-line"
          >
            {KIND_TABS.map((tab) => {
              const active = kindFilter === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeKind(tab.key)}
                  className={cn(
                    "focus-ring relative -mb-px rounded-t-lg px-3 pb-3 text-sm font-medium transition-colors",
                    active
                      ? "text-fg after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-fg"
                      : "text-muted hover:text-fg"
                  )}
                >
                  {tab.label}
                  {!isLoading && (
                    <span className="ml-1.5 text-xs text-subtle tabular-nums">
                      {kindCounts[tab.key]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {showSkeleton ? (
            <FeedSkeleton />
          ) : visible.length === 0 && stories.length > 0 ? (
            <p className="py-16 text-center text-sm text-muted">
              Nothing here yet.
            </p>
          ) : visible.length === 0 ? (
            <EmptyState
              hasError={Boolean(meta.lastError)}
              isRefreshing={isRefreshing}
              onRetry={refresh}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4">
                {visible.map((story, i) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    now={now}
                    onSelect={onSelectStory}
                    onReadFull={onReadFull}
                    onCopied={onCopied}
                    className="motion-safe:animate-rise"
                    style={{ animationDelay: `${Math.min(i, 11) * 35}ms` }}
                  />
                ))}
              </div>
              {hasMore &&
                (supportsInfiniteScroll() ? (
                  <div ref={sentinelRef} aria-hidden className="h-px" />
                ) : (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setLimit((n) => n + PAGE_SIZE)}
                      className="focus-ring rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-fg-soft transition-colors hover:border-line-strong hover:text-fg"
                    >
                      Show more
                    </button>
                  </div>
                ))}
              {!hasMore && list.length > PAGE_SIZE && (
                <p className="mt-12 text-center text-sm text-subtle">
                  That’s everything for now.
                </p>
              )}
            </>
          )}
        </main>
      </div>

      {searchOpen && (
        <SearchPalette
          stories={stories}
          now={now}
          onSelectStory={onSelectStory}
          onClose={() => setSearchOpen(false)}
        />
      )}
      {openStory && (
        <StoryDialog
          story={openStory}
          hasPrev={openIndex > 0}
          hasNext={openIndex < list.length - 1}
          onPrev={() => setOpenStoryId(list[openIndex - 1]?.id ?? null)}
          onNext={() => setOpenStoryId(list[openIndex + 1]?.id ?? null)}
          onReadFull={onReadFull}
          onCopied={onCopied}
          onClose={() => setOpenStoryId(null)}
        />
      )}
      {aboutOpen && <AboutPanel onClose={() => setAboutOpen(false)} />}
      <Toast toast={toast} />
    </div>
  )
}
