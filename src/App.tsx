import { Info, PanelLeftClose, PanelLeftOpen, RefreshCw } from "lucide-react"
import { useMemo, useState } from "react"
import AboutPanel from "./components/AboutPanel"
import EmptyState from "./components/EmptyState"
import Sidebar from "./components/Sidebar"
import SourceFilter from "./components/SourceFilter"
import StoryCard from "./components/StoryCard"
import { useRefresh } from "./hooks/useRefresh"
import { useStories } from "./hooks/useStories"
import type { SourceId } from "./storage/schema"

const PAGE_SIZE = 20

export default function App() {
  const { stories, prefs, isLoading, handleBookmark } = useStories()
  const { isRefreshing, lastUpdated, triggerRefresh } = useRefresh()

  const [activeSource, setActiveSource] = useState<SourceId | "all">("all")
  const [page, setPage] = useState(1)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const filtered = useMemo(() => {
    if (activeSource === "all") return stories
    return stories.filter((s) => s.source === activeSource)
  }, [stories, activeSource])

  const counts = useMemo(() => {
    const all: Partial<Record<SourceId | "all", number>> = { all: stories.length }
    for (const s of stories) {
      all[s.source] = (all[s.source] ?? 0) + 1
    }
    return all
  }, [stories])

  const visible = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < filtered.length
  const bookmarkedIds = new Set(prefs?.bookmarkedStoryIds ?? [])

  const handleSourceChange = (source: SourceId | "all") => {
    setActiveSource(source)
    setPage(1)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-cream-100">
      {/* Sidebar */}
      <div
        className={[
          "flex-shrink-0 h-screen overflow-hidden transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-60" : "w-0"
        ].join(" ")}
      >
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-cream-100/90 backdrop-blur-sm border-b border-cream-200">
          <div className="px-4 h-12 flex items-center gap-2">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="btn-ghost flex-shrink-0"
              title={sidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
            >
              {sidebarOpen
                ? <PanelLeftClose size={15} />
                : <PanelLeftOpen size={15} />
              }
            </button>

            <div className="w-px h-5 bg-cream-200 flex-shrink-0" />

            {/* Source filter tabs */}
            <div className="flex-1 overflow-hidden">
              <SourceFilter
                active={activeSource}
                onChange={handleSourceChange}
                counts={counts}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {lastUpdated && (
                <span className="hidden lg:block text-xs text-ink-400 font-medium mr-2">
                  {lastUpdated}
                </span>
              )}
              <button
                onClick={triggerRefresh}
                disabled={isRefreshing}
                className="btn-ghost text-xs"
                title="Perbarui cerita"
              >
                <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Perbarui</span>
              </button>
              <button
                onClick={() => setAboutOpen(true)}
                className="btn-ghost"
                title="Tentang Tabaca"
              >
                <Info size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="flex-1 p-6">
          {isLoading ? (
            <EmptyState isLoading hasFilter={false} onRefresh={triggerRefresh} />
          ) : filtered.length === 0 ? (
            <EmptyState
              isLoading={false}
              hasFilter={activeSource !== "all"}
              onRefresh={triggerRefresh}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visible.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    isBookmarked={bookmarkedIds.has(story.id)}
                    onBookmark={handleBookmark}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-terra-outline px-6 py-2.5"
                  >
                    Muat lebih banyak
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-cream-200 px-6 py-3 flex items-center justify-between text-xs text-ink-300 font-medium flex-shrink-0">
          <span>Dibuat dengan ❤️ oleh Papua Open Source</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAboutOpen(true)}
              className="hover:text-terra-500 transition-colors"
            >
              Tentang
            </button>
            <span className="text-cream-300">·</span>
            <a
              href="https://github.com/papua-open-source/tabaca"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-terra-500 transition-colors"
            >
              Berkontribusi
            </a>
          </div>
        </footer>
      </main>

      {aboutOpen && <AboutPanel onClose={() => setAboutOpen(false)} />}
    </div>
  )
}
