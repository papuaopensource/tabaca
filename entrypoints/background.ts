import { defineBackground } from "wxt/utils/define-background"
import { fetchStoriesFromApi } from "@/lib/api"
import { mergeStories, saveMeta } from "@/storage"

const ALARM_NAME = "tabaca:refresh"
const REFRESH_INTERVAL_MINUTES = 30

async function fetchAllStories(): Promise<void> {
  try {
    const stories = await fetchStoriesFromApi()
    if (stories.length > 0) {
      await mergeStories(stories)
    }
    await saveMeta({ lastFetchAt: new Date().toISOString() })
  } catch (err) {
    console.error("[tabaca] fetch failed:", err)
    await saveMeta({
      lastFetchAt: new Date().toISOString(),
      lastError: String(err),
    })
  }
}

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(async () => {
    await fetchAllStories()
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: REFRESH_INTERVAL_MINUTES,
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
