const KEYS = ["a", "b", "c", "d", "e", "f", "g", "h"]

export default function FeedSkeleton() {
  return (
    <div role="status" className="animate-pulse">
      <span className="sr-only">Gathering stories from Papua…</span>
      <div
        aria-hidden
        className="grid grid-cols-1 gap-5 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4"
      >
        {KEYS.map((key) => (
          <div
            key={key}
            className="flex flex-col rounded-2xl border border-line bg-surface p-4"
          >
            <div className="size-8 rounded-full bg-surface-muted" />
            <div className="mt-4 h-4 w-full rounded-full bg-surface-muted" />
            <div className="mt-2.5 h-4 w-4/5 rounded-full bg-surface-muted" />
            <div className="mt-4 flex gap-1.5">
              <div className="h-5 w-16 rounded-lg bg-surface-muted" />
              <div className="h-5 w-20 rounded-lg bg-surface-muted" />
            </div>
            <div className="mt-4 aspect-[16/9] rounded-xl bg-surface-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
