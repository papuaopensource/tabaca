import { Newspaper, RefreshCw, WifiOff } from "lucide-react"

interface EmptyStateProps {
  hasError: boolean
  isRefreshing: boolean
  onRetry: () => void
}

export default function EmptyState({
  hasError,
  isRefreshing,
  onRetry
}: EmptyStateProps) {
  const Icon = hasError ? WifiOff : Newspaper
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-xl border border-line text-muted">
        <Icon size={22} aria-hidden />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-fg">
        {hasError ? "Can’t reach Tabaca" : "No stories yet"}
      </h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
        {hasError
          ? "Check your connection, then try again."
          : "Stories will show up here after the first fetch."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRefreshing}
        className="focus-ring mt-6 inline-flex items-center gap-2 rounded-xl bg-fg px-4 py-2.5 text-sm font-semibold text-canvas transition hover:opacity-90 disabled:opacity-60"
      >
        <RefreshCw
          size={15}
          aria-hidden
          className={isRefreshing ? "animate-spin" : undefined}
        />
        {hasError ? "Try again" : "Fetch stories"}
      </button>
    </div>
  )
}
