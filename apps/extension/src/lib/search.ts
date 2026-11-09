import { browser } from "wxt/browser"

/** Searches with the user's default search engine (falls back to Google if unavailable). */
export async function searchWeb(text: string): Promise<void> {
  if (browser.search?.query) {
    await browser.search.query({ text, disposition: "CURRENT_TAB" })
    return
  }
  window.location.href = `https://www.google.com/search?q=${encodeURIComponent(text)}`
}
