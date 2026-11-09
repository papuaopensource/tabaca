import { ExternalLink, X } from "lucide-react"
import { useEffect, useRef } from "react"
import { browser } from "wxt/browser"
import logoSrc from "@@/assets/icon.png"

const REPO_URL = "https://github.com/papuaopensource/tabaca"

function extensionVersion(): string {
  try {
    return browser.runtime.getManifest().version
  } catch {
    return ""
  }
}

/** Rendered only while open; uses a native modal <dialog> for focus trapping and Esc. */
export default function AboutPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const version = extensionVersion()

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // Clicks on the backdrop land on the <dialog> element itself.
        if (e.target === e.currentTarget) onClose()
      }}
      aria-labelledby="about-title"
      className="m-auto w-[min(92vw,28rem)] rounded-3xl border border-line bg-surface p-0 text-fg shadow-float backdrop:bg-black/60 backdrop:backdrop-blur-xs open:motion-safe:animate-rise"
    >
      <div className="relative p-7">
        <button
          type="button"
          onClick={onClose}
          className="icon-button absolute top-5 right-5"
          aria-label="Close"
        >
          <X size={16} aria-hidden />
        </button>

        <div className="flex items-center gap-3.5">
          <span className="relative size-12 shrink-0 overflow-hidden rounded-2xl bg-white">
            <img
              src={logoSrc}
              alt=""
              className="absolute top-1/2 left-1/2 size-[72px] max-w-none -translate-x-1/2 -translate-y-1/2"
            />
          </span>
          <div>
            <h2 id="about-title" className="text-base font-bold">
              Tabaca
            </h2>
            <p className="text-xs text-subtle">
              Stories from Papua, one tab away.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted">
          <p>
            Every new tab shows you a few pieces about Papua: essays, opinion,
            analysis and research. Not daily news.
          </p>
          <p>
            These are our picks. We choose the writers and publications, and
            sometimes single articles, that we think are worth your time.
            Picking a piece doesn’t mean we agree with everything in it.
          </p>
          <p>
            You get the headline and a short summary. The full piece is always
            on the original site.
          </p>
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-line pt-5 text-xs text-subtle">
          <div className="space-y-0.5">
            <p>
              Made by{" "}
              <span className="font-semibold text-fg-soft">
                Papua Open Source
              </span>
            </p>
            <p>MIT License{version && ` · v${version}`}</p>
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 font-semibold text-fg-soft transition-colors hover:border-line-strong hover:text-fg"
          >
            GitHub
            <ExternalLink size={13} aria-hidden />
          </a>
        </div>
      </div>
    </dialog>
  )
}
