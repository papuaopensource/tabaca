import { browser } from "wxt/browser"
import { defineBackground } from "wxt/utils/define-background"
import { storage } from "wxt/utils/storage"
import { refreshFeed } from "@/lib/feed"
import { LEGACY_KEYS } from "@/storage"

const ALARM_NAME = "tabaca:refresh"
const REFRESH_INTERVAL_MINUTES = 30

async function ensureAlarm(): Promise<void> {
  const existing = await browser.alarms.get(ALARM_NAME)
  if (!existing) {
    await browser.alarms.create(ALARM_NAME, {
      periodInMinutes: REFRESH_INTERVAL_MINUTES
    })
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    void (async () => {
      await storage.removeItems([...LEGACY_KEYS])
      await ensureAlarm()
      await refreshFeed()
    })()
  })

  // Alarms may be cleared when the browser restarts.
  browser.runtime.onStartup.addListener(() => {
    void ensureAlarm()
  })

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) void refreshFeed()
  })
})
