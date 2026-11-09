import type { Story } from "@tabaca/api"
import { BarChart3, BookOpen, Check, Link2, X } from "lucide-react"
import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
import { cn } from "@/lib/cn"
import { SHARE_TARGETS } from "@/lib/share"
import { attribution } from "@/lib/attribution"
import { formatCount, timeAgo, toTag } from "@/lib/time"

const MAX_TAGS = 2
const SHARE_PROMPT_MS = 8000

interface StoryCardProps {
  story: Story
  now: number
  /** Show the summary dialog. */
  onSelect: (story: Story) => void
  /** The reader is going straight to the original article. */
  onReadFull: (story: Story) => void
  onCopied: () => void
  className?: string
  style?: CSSProperties
}

export default function StoryCard({
  story,
  now,
  onSelect,
  onReadFull,
  onCopied,
  className,
  style
}: StoryCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const [copied, setCopied] = useState(false)
  const showImage = Boolean(story.imageUrl) && !imageFailed
  const site = attribution(story)
  const tags = story.matchedKeywords.slice(0, MAX_TAGS)
  const extraTags = story.matchedKeywords.length - tags.length
  const time = timeAgo(story.publishedAt, now)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), SHARE_PROMPT_MS)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(story.url)
      setCopied(true)
      onCopied()
    } catch {
      // Clipboard unavailable (e.g. no user activation); nothing to undo.
    }
  }

  return (
    <article
      style={style}
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border border-line bg-surface p-4 transition-colors duration-200 focus-within:border-line-strong hover:border-line-strong",
        className
      )}
    >
      <h3 className="line-clamp-3 text-[17px] leading-snug font-bold tracking-[-0.01em] text-fg">
        {/*
          Stretched link over the whole card. A plain click opens the summary;
          ⌘/Ctrl/Shift-click or middle-click still opens the article in a new tab.
        */}
        <a
          href={story.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => {
            const modified =
              event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
            if (event.button === 0 && !modified) {
              event.preventDefault()
              onSelect(story)
            } else {
              onReadFull(story)
            }
          }}
          onAuxClick={(event) => {
            if (event.button === 1) onReadFull(story)
          }}
          className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-accent"
        >
          {story.title}
        </a>
      </h3>

      {tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Topics">
          {tags.map((keyword) => (
            <li
              key={keyword}
              className="rounded-lg border border-line px-2 py-0.5 text-xs text-muted"
            >
              #{toTag(keyword)}
            </li>
          ))}
          {extraTags > 0 && (
            <li className="rounded-lg border border-line px-2 py-0.5 text-xs text-muted">
              +{extraTags}
            </li>
          )}
        </ul>
      )}

      <p className="mt-2.5 truncate text-xs text-subtle">
        {site}
        {time && (
          <>
            <span aria-hidden> · </span>
            <time dateTime={story.publishedAt}>{time}</time>
          </>
        )}
      </p>

      <div className="mt-3 flex flex-1 items-end">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-surface-muted">
          {showImage ? (
            <img
              src={story.imageUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : story.kind === "paper" ? (
            <PaperCover story={story} />
          ) : (
            story.snippet && (
              <p className="absolute inset-x-4 bottom-4 line-clamp-4 text-[13px] leading-relaxed text-fg-soft">
                {story.snippet}
              </p>
            )
          )}
          {copied && (
            <SharePrompt story={story} onClose={() => setCopied(false)} />
          )}
        </div>
      </div>

      <div className="relative z-10 mt-2 -mb-1 flex items-center justify-between">
        <button
          type="button"
          onClick={copyLink}
          className={cn("icon-button size-8", copied && "text-fg")}
          aria-label="Copy link"
          title="Copy link"
        >
          {copied ? (
            <Check size={16} aria-hidden />
          ) : (
            <Link2 size={16} aria-hidden />
          )}
        </button>
        {story.readCount > 0 && (
          <span
            className="inline-flex items-center gap-1.5 pr-1 text-xs font-medium text-subtle"
            title={`Read ${story.readCount.toLocaleString("en-US")} times via Tabaca`}
          >
            <BarChart3 size={15} aria-hidden />
            <span className="sr-only">Read </span>
            {formatCount(story.readCount)}
            <span className="sr-only"> times</span>
          </span>
        )}
      </div>
    </article>
  )
}

/** Typographic cover for research without an image: label, journal or publisher, year. */
function PaperCover({ story }: { story: Story }) {
  const year = new Date(story.publishedAt).getFullYear()
  return (
    <div className="flex size-full flex-col justify-between p-4">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-line-strong px-2 py-0.5 text-[11px] font-semibold tracking-wider text-muted uppercase">
        <BookOpen size={12} aria-hidden />
        Research
      </span>
      <div>
        <p className="line-clamp-2 text-sm leading-snug font-semibold text-fg-soft">
          {attribution(story)}
        </p>
        {!Number.isNaN(year) && (
          <p className="mt-0.5 text-xs text-subtle">{year}</p>
        )}
      </div>
    </div>
  )
}

function SharePrompt({
  story,
  onClose
}: {
  story: Story
  onClose: () => void
}) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-black/75 p-3 backdrop-blur-sm motion-safe:animate-fade">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 grid size-7 place-items-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
        aria-label="Close"
      >
        <X size={15} aria-hidden />
      </button>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">Share this story</p>
        <div className="mt-3 flex justify-center gap-2">
          {SHARE_TARGETS.map((target) => (
            <a
              key={target.name}
              href={target.url(story)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share on ${target.name}`}
              title={target.name}
              className="grid size-10 place-items-center rounded-xl bg-white transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="size-5"
                fill={target.color}
              >
                <path d={target.path} />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
