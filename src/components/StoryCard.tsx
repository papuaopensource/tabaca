import { ArrowUpRight, Bookmark, BookmarkCheck } from "lucide-react"
import type { FC } from "react"
import { relativeTime } from "@/lib/date"
import type { Story } from "@/storage/schema"

const SOURCE_LABELS: Record<string, string> = {
  bbc: "BBC",
  theconversation: "The Conversation",
  jubi: "Jubi",
  "antara-papua": "Antara Papua"
}

const SOURCE_ICON_BG: Record<string, string> = {
  bbc: "bg-red-600",
  theconversation: "bg-sky-600",
  jubi: "bg-amber-500",
  "antara-papua": "bg-emerald-600"
}

const SOURCE_INITIALS: Record<string, string> = {
  bbc: "B",
  theconversation: "TC",
  jubi: "J",
  "antara-papua": "AP"
}

interface StoryCardProps {
  story: Story
  isBookmarked: boolean
  onBookmark: (id: string) => void
}

const StoryCard: FC<StoryCardProps> = ({ story, isBookmarked, onBookmark }) => {
  const time = relativeTime(story.publishedAt)
  const sourceLabel = SOURCE_LABELS[story.source] ?? story.source
  const iconBg = SOURCE_ICON_BG[story.source] ?? "bg-ink-400"
  const initials = SOURCE_INITIALS[story.source] ?? story.source[0].toUpperCase()
  const tags = story.matchedKeywords.slice(0, 3)

  return (
    <article className="flex flex-col rounded-2xl border border-cream-200 bg-white overflow-hidden hover:border-cream-400 transition-colors duration-150">
      {/* Card top: source + time + bookmark */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-1">
        <div
          className={`w-6 h-6 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}
        >
          <span className="text-white text-[9px] font-bold leading-none">{initials}</span>
        </div>
        <span className="text-xs font-semibold text-ink-700 leading-none">{sourceLabel}</span>
        <span className="text-cream-300 text-xs">·</span>
        <time className="text-xs text-ink-400" dateTime={story.publishedAt}>
          {time}
        </time>
        <button
          onClick={() => onBookmark(story.id)}
          className="ml-auto p-1 -mr-1 text-ink-300 hover:text-terra-500 transition-colors flex-shrink-0"
          aria-label={isBookmarked ? "Hapus bookmark" : "Simpan cerita"}
        >
          {isBookmarked ? (
            <BookmarkCheck size={14} className="text-terra-500" />
          ) : (
            <Bookmark size={14} />
          )}
        </button>
      </div>

      {/* Title */}
      <a
        href={story.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 px-4 py-3 group"
      >
        <h2 className="font-display text-[14px] font-bold leading-snug text-ink-900 group-hover:text-terra-600 transition-colors line-clamp-3">
          {story.title}
        </h2>
      </a>

      {/* Tags + read link */}
      <div className="px-4 pb-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap gap-1">
          {tags.map((kw) => (
            <span
              key={kw}
              className="text-[10px] text-ink-400 bg-cream-100 border border-cream-200 px-2 py-0.5 rounded-full font-medium"
            >
              #{kw}
            </span>
          ))}
        </div>
        <a
          href={story.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0.5 text-[11px] font-semibold text-terra-500 hover:text-terra-600 flex-shrink-0 transition-colors"
        >
          Baca
          <ArrowUpRight size={11} />
        </a>
      </div>

      {/* Image at bottom */}
      {story.imageUrl && (
        <a
          href={story.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-t border-cream-200 overflow-hidden flex-shrink-0"
        >
          <div className="aspect-[16/9] bg-cream-200 overflow-hidden">
            <img
              src={story.imageUrl}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).parentElement?.parentElement?.remove()
              }}
            />
          </div>
        </a>
      )}
    </article>
  )
}

export default StoryCard
