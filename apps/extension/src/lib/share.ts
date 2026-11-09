import { siFacebook, siTelegram, siWhatsapp, siX } from "simple-icons"
import type { Story } from "@tabaca/api"

export interface ShareTarget {
  name: string
  /** SVG path (24×24 viewBox) and brand color from Simple Icons (CC0). */
  path: string
  color: string
  url(story: Pick<Story, "title" | "url">): string
}

const enc = encodeURIComponent

export const SHARE_TARGETS: ShareTarget[] = [
  {
    name: "WhatsApp",
    path: siWhatsapp.path,
    color: `#${siWhatsapp.hex}`,
    url: ({ title, url }) => `https://wa.me/?text=${enc(`${title} ${url}`)}`
  },
  {
    name: "X",
    path: siX.path,
    color: `#${siX.hex}`,
    url: ({ title, url }) =>
      `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`
  },
  {
    name: "Facebook",
    path: siFacebook.path,
    color: `#${siFacebook.hex}`,
    url: ({ url }) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`
  },
  {
    name: "Telegram",
    path: siTelegram.path,
    color: `#${siTelegram.hex}`,
    url: ({ title, url }) =>
      `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`
  }
]
