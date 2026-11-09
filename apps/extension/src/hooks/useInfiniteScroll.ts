import { useEffect, useRef, useState } from "react"

export function supportsInfiniteScroll(): boolean {
  return typeof IntersectionObserver !== "undefined"
}

/**
 * Calls `onLoadMore` when the returned sentinel element comes near the viewport.
 * `itemCount` re-arms the observer after each load, so a tall screen keeps
 * filling until the sentinel is out of reach.
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  enabled: boolean,
  itemCount: number
) {
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null)
  const loadMore = useRef(onLoadMore)

  useEffect(() => {
    loadMore.current = onLoadMore
  })

  useEffect(() => {
    if (!enabled || !sentinel || !supportsInfiniteScroll()) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore.current()
      },
      { rootMargin: "0px 0px 800px 0px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [enabled, sentinel, itemCount])

  return setSentinel
}
