import { Search } from "lucide-react"
import type { FormEvent } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return { text: "Selamat Pagi", emoji: "🌤️" }
  if (hour >= 12 && hour < 15) return { text: "Selamat Siang", emoji: "☀️" }
  if (hour >= 15 && hour < 18) return { text: "Selamat Sore", emoji: "🌥️" }
  return { text: "Selamat Malam", emoji: "🌙" }
}

export default function Sidebar() {
  const now = new Date()
  const { text: greetText, emoji } = getGreeting()
  const dateStr = format(now, "EEEE, d MMMM", { locale: id })

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim()
    if (q) window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank")
  }

  return (
    <aside className="w-60 flex-shrink-0 h-screen overflow-y-auto border-r border-cream-200 bg-cream-100 flex flex-col">
      {/* Brand */}
      <div className="px-6 pt-6 pb-5">
        <p className="text-base font-bold text-ink-800 tracking-tight leading-tight">tabaca</p>
        <p className="text-[11px] text-ink-400 font-medium mt-0.5">Stories from Papua, One Tab Away</p>
      </div>

      <div className="px-6 flex flex-col gap-6 flex-1">
        {/* Greeting */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{emoji}</span>
            <span className="text-sm font-semibold text-ink-700">{greetText}!</span>
          </div>
          <p className="mt-1 text-xs text-ink-400 capitalize">{dateStr}</p>
        </div>

        {/* Web search */}
        <form onSubmit={handleSearch}>
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-cream-200 focus-within:border-terra-300 transition-colors duration-150">
            <Search size={13} className="text-ink-400 flex-shrink-0" />
            <input
              name="q"
              type="text"
              placeholder="Cari di web..."
              className="flex-1 min-w-0 text-sm bg-transparent text-ink-700 placeholder-ink-300 outline-none"
            />
          </div>
        </form>
      </div>

      {/* Bottom */}
      <div className="px-6 py-5">
        <a
          href="https://github.com/papua-open-source/tabaca"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ink-300 hover:text-terra-500 transition-colors font-medium"
        >
          Papua Open Source
        </a>
      </div>
    </aside>
  )
}
