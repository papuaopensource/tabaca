import type { Story } from "@tabaca/api"
import { metaItem, storiesItem } from "@/storage"
import type { FeedMeta } from "@/storage"
import { useStoredValue } from "./useStoredValue"

export interface UseFeedReturn {
  stories: Story[]
  meta: FeedMeta
  isLoading: boolean
}

export function useFeed(): UseFeedReturn {
  const stories = useStoredValue(storiesItem)
  const meta = useStoredValue(metaItem)
  return {
    stories: stories.value,
    meta: meta.value,
    isLoading: !(stories.loaded && meta.loaded)
  }
}
