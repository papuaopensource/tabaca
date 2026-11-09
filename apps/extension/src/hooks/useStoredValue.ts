import { useEffect, useState } from "react"
import type { WxtStorageItem } from "wxt/utils/storage"

/** Reads a storage item and keeps it in sync with changes from other contexts. */
export function useStoredValue<T, M extends Record<string, unknown>>(
  item: WxtStorageItem<T, M>
): { value: T; loaded: boolean } {
  const [state, setState] = useState({ value: item.fallback, loaded: false })

  useEffect(() => {
    let alive = true
    const update = (value: T) => {
      if (alive) setState({ value, loaded: true })
    }
    void item.getValue().then(update)
    const unwatch = item.watch(update)
    return () => {
      alive = false
      unwatch()
    }
  }, [item])

  return state
}
