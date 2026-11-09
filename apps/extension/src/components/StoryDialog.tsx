import type { Story } from "@tabaca/api"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Link2,
  X
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { attribution } from "@/lib/attribution"
import { formatDate, toTag } from "@/lib/time"

interface StoryDialogProps {
  story: Story
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  /** The reader is leaving for the original article. */
  onReadFull: (story: Story) => void
  onCopied: () => void
  onClose: () => void
}

/**
 * Short summary of a story, like daily.dev's post modal. The full story always
 * lives on the original site ("Read full story" opens it in a new tab).
 * Rendered only while open; a native modal <dialog> handles focus and Esc.
 */
export default function StoryDialog({
  story,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onReadFull,
  onCopied,
  onClose
}: StoryDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  // Which story's link was just copied (the icon turns into a check for a moment).
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!copiedId) return
    const timer = window.setTimeout(() => setCopiedId(null), 2000)
    return () => window.clearTimeout(timer)
  }, [copiedId])
  const isPaper = story.kind === "paper"
  const site = isPaper ? `Research · ${attribution(story)}` : attribution(story)
  const date = formatDate(story.publishedAt)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  // Start each story at the top when stepping through with ← →.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0
  }, [story.id])

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowLeft" && hasPrev) {
      event.preventDefault()
      onPrev()
    } else if (event.key === "ArrowRight" && hasNext) {
      event.preventDefault()
      onNext()
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(story.url)
      setCopiedId(story.id)
      onCopied()
    } catch {
      // Clipboard unavailable; nothing to undo.
    }
  }

  const meta = [
    date,
    story.author && `by ${story.author}`,
    story.readCount > 0 &&
      `Read ${story.readCount.toLocaleString("en-US")} times via Tabaca`
  ].filter(Boolean)

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onKeyDown={onKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-labelledby="story-title"
      className="mx-auto mt-[5vh] max-h-[90vh] w-[min(94vw,46rem)] overflow-hidden rounded-2xl border border-line bg-surface p-0 text-fg shadow-float backdrop:bg-black/70 backdrop:backdrop-blur-xs open:flex open:flex-col open:motion-safe:animate-rise"
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-line px-3 py-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          className="icon-button"
          aria-label="Previous story"
          title="Previous story (←)"
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="icon-button"
          aria-label="Next story"
          title="Next story (→)"
        >
          <ChevronRight size={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="icon-button ml-auto"
          aria-label="Close"
          title="Close (esc)"
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <div ref={bodyRef} className="overflow-y-auto px-6 pt-6 pb-8 sm:px-8">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm text-muted">{site}</p>
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onReadFull(story)}
            onAuxClick={() => onReadFull(story)}
            className="focus-ring inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-fg px-4 text-sm font-semibold text-canvas transition hover:opacity-90"
          >
            <ExternalLink size={16} aria-hidden />
            {isPaper ? "Read full text" : "Read full story"}
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="icon-button shrink-0"
            aria-label="Copy link"
            title="Copy link"
          >
            {copiedId === story.id ? (
              <Check size={17} aria-hidden />
            ) : (
              <Link2 size={17} aria-hidden />
            )}
          </button>
        </div>

        <h2
          id="story-title"
          className="mt-5 text-2xl leading-tight font-bold tracking-tight text-balance sm:text-[28px]"
        >
          {story.title}
        </h2>

        {story.snippet && (
          <p className="mt-4 text-[15px] leading-relaxed text-fg-soft sm:text-base">
            {story.snippet}
          </p>
        )}

        {story.matchedKeywords.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Topics">
            {story.matchedKeywords.map((keyword) => (
              <li
                key={keyword}
                className="rounded-lg border border-line px-2 py-0.5 text-xs text-muted"
              >
                #{toTag(keyword)}
              </li>
            ))}
          </ul>
        )}

        {meta.length > 0 && (
          <p className="mt-4 text-sm text-subtle">{meta.join(" · ")}</p>
        )}

        {/* Keyed so a failed image doesn't hide the next story's image. */}
        <StoryImage key={story.id} src={story.imageUrl} />
      </div>
    </dialog>
  )
}

function StoryImage({ src }: { src: string | undefined }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return (
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="mt-6 aspect-[16/9] w-full rounded-xl bg-surface-muted object-cover"
    />
  )
}
