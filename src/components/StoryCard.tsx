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

const SOURCE_COLORS: Record<string, string> = {
  bbc: "bg-red-100 text-red-700",
  theconversation: "bg-sky-100 text-sky-700",
  jubi: "bg-amber-100 text-amber-700",
  "antara-papua": "bg-emerald-100 text-emerald-700"
}

interface StoryCardProps {
  story: Story
  isBookmarked: boolean
  onBookmark: (id: string) => void
}

const StoryCard: FC<StoryCardProps> = ({ story, isBookmarked, onBookmark }) => {
  const time = relativeTime(story.publishedAt)
  const sourceLabel = SOURCE_LABELS[story.source] ?? story.source
  const sourceColor =
    SOURCE_COLORS[story.source] ?? "bg-cream-200 text-ink-600"

  return (
    <article className="card group flex flex-col">
      {/* Image */}
      {story.imageUrl && (
        <a
          href={story.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden aspect-[16/9] bg-cream-200 flex-shrink-0"
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            src={story.imageUrl}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).parentElement?.remove()
            }}
          />
        </a>
      )}

      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Source + bookmark */}
        <div className="flex items-center justify-between gap-2">
          <span className={`source-badge ${sourceColor}`}>{sourceLabel}</span>
          <button
            onClick={() => onBookmark(story.id)}
            className="flex-shrink-0 p-1 -m-1 text-ink-300 hover:text-terra-500 transition-colors"
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
          className="flex-1"
        >
          <h2 className="font-display text-[15px] font-bold leading-snug text-ink-900 group-hover:text-terra-600 transition-colors line-clamp-3">
            {story.title}
          </h2>
          {story.snippet && (
            <p className="mt-1.5 text-xs text-ink-400 leading-relaxed line-clamp-2">
              {story.snippet}
            </p>
          )}
        </a>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 mt-auto">
          <time className="text-xs text-ink-300 font-medium" dateTime={story.publishedAt}>
            {time}
          </time>
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-xs font-semibold text-terra-500 hover:text-terra-600 transition-colors"
          >
            Baca
            <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
    </article>
  )
}

export default StoryCard
