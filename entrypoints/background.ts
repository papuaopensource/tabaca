import { defineBackground } from "wxt/utils/define-background"
import { ALL_ADAPTERS } from "@/sources"
import { filterByPapuaScope } from "@/curation/filter"
import { mergeStories, saveMeta } from "@/storage"
import type { Story } from "@/storage/schema"

const ALARM_NAME = "tabaca:refresh"
const REFRESH_INTERVAL_MINUTES = 30

async function fetchAllStories(): Promise<void> {
  const stories: Story[] = []

  await Promise.allSettled(
    ALL_ADAPTERS.map(async (adapter) => {
      try {
        const items = await adapter.fetch()
        for (const item of items) {
          const base = adapter.normalize(item)
          const text = `${base.title} ${base.snippet}`
          const result = filterByPapuaScope(text)
          if (result.passes) {
            stories.push({
              ...base,
              matchedKeywords: result.matchedKeywords,
              region: result.region
            })
          }
        }
      } catch (err) {
        console.error(`[tabaca] fetch failed for ${adapter.id}:`, err)
      }
    })
  )

  if (stories.length > 0) {
    await mergeStories(stories)
  }

  await saveMeta({
    lastFetchAt: new Date().toISOString(),
    storyCount: stories.length
  })
}

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(async () => {
    await fetchAllStories()
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: REFRESH_INTERVAL_MINUTES
    })
  })

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
      await fetchAllStories()
    }
  })

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "REFRESH") {
      fetchAllStories()
        .then(() => sendResponse({ ok: true }))
        .catch((err) => sendResponse({ ok: false, error: String(err) }))
      return true
    }
  })
})
