import { ArrowUpRight } from "lucide-react"
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

interface FeaturedCardProps {
  story: Story
}

const FeaturedCard: FC<FeaturedCardProps> = ({ story }) => {
  const time = relativeTime(story.publishedAt)
  const sourceLabel = SOURCE_LABELS[story.source] ?? story.source
  const sourceColor =
    SOURCE_COLORS[story.source] ?? "bg-cream-200 text-ink-600"

  return (
    <a
      href={story.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-3xl overflow-hidden bg-white border border-cream-200 hover:border-cream-400 transition-colors duration-150"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        {story.imageUrl ? (
          <div className="sm:w-[45%] flex-shrink-0 overflow-hidden bg-cream-200 aspect-video sm:aspect-auto min-h-[200px]">
            <img
              src={story.imageUrl}
              alt=""
              loading="eager"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).parentElement?.remove()
              }}
            />
          </div>
        ) : (
          <div className="sm:w-[45%] flex-shrink-0 bg-gradient-to-br from-terra-50 to-cream-200 min-h-[200px] flex items-center justify-center">
            <span className="text-terra-300 text-6xl font-display font-bold select-none">T</span>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col justify-between p-6 sm:p-8 flex-1 gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className={`source-badge ${sourceColor}`}>{sourceLabel}</span>
              <span className="text-xs text-ink-400 font-medium">{time}</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-ink-900 group-hover:text-terra-600 transition-colors">
              {story.title}
            </h2>

            {story.snippet && (
              <p className="mt-3 text-sm text-ink-500 leading-relaxed line-clamp-3">
                {story.snippet}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            {story.author ? (
              <span className="text-xs text-ink-400 font-medium truncate max-w-[200px]">
                {story.author}
              </span>
            ) : (
              <span />
            )}
            <span className="flex items-center gap-1 text-sm font-semibold text-terra-500 group-hover:text-terra-600 flex-shrink-0 transition-colors">
              Baca cerita
              <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}

export default FeaturedCard
