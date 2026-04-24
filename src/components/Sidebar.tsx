import { Search } from "lucide-react"
import type { FormEvent } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

const QUOTES = [
  {
    text: "Tanah Papua bukan hanya tentang tempat, tapi tentang manusia, budaya, dan harapan.",
    author: "Papua Open Source"
  },
  {
    text: "Hutan Papua adalah paru-paru dunia yang dijaga oleh generasi yang penuh kebijaksanaan.",
    author: "Papua Open Source"
  },
  {
    text: "Di balik pegunungan Papua tersimpan cerita perjuangan dan keindahan yang belum selesai ditulis.",
    author: "Papua Open Source"
  },
  {
    text: "Cendrawasih bukan hanya burung — ia adalah simbol keindahan yang perlu kita jaga bersama.",
    author: "Papua Open Source"
  }
]

const FACTS = [
  "Papua memiliki lebih dari 250 bahasa daerah yang masih hidup hingga kini.",
  "Raja Ampat adalah salah satu pusat keanekaragaman hayati laut tertinggi di dunia.",
  "Pegunungan Jayawijaya memiliki salju abadi, satu-satunya di khatulistiwa Asia.",
  "Papua rumah bagi lebih dari 600 spesies burung, termasuk cendrawasih yang ikonik.",
  "Suku Korowai membangun rumah di atas pohon hingga setinggi 35 meter.",
  "Taman Nasional Lorentz adalah situs warisan dunia UNESCO terbesar di Asia Tenggara.",
  "Papua menyimpan sekitar 40% hutan tropis Indonesia yang masih tersisa."
]

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return { text: "Selamat Pagi", emoji: "🌤️" }
  if (hour >= 12 && hour < 15) return { text: "Selamat Siang", emoji: "☀️" }
  if (hour >= 15 && hour < 18) return { text: "Selamat Sore", emoji: "🌥️" }
  return { text: "Selamat Malam", emoji: "🌙" }
}

function getDayIndex(len: number): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const day = Math.floor((now.getTime() - start.getTime()) / 86400000)
  return day % len
}

export default function Sidebar() {
  const now = new Date()
  const { text: greetText, emoji } = getGreeting()
  const dateStr = format(now, "EEEE, d MMMM", { locale: id })
  const quote = QUOTES[getDayIndex(QUOTES.length)]
  const fact = FACTS[getDayIndex(FACTS.length)]

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim()
    if (q) window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank")
  }

  return (
    <aside className="w-60 flex-shrink-0 h-screen overflow-y-auto border-r border-cream-200 bg-white flex flex-col">
      {/* Logo */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-terra-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold tracking-tight">T</span>
          </div>
          <span className="text-sm font-bold text-ink-800 tracking-tight">tabaca</span>
        </div>
      </div>

      <div className="px-6 flex flex-col gap-6 flex-1">
        {/* Greeting */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">{emoji}</span>
            <span className="text-base font-bold text-ink-800">{greetText}!</span>
          </div>
          <p className="mt-1 text-xs text-ink-400 capitalize font-medium">{dateStr}</p>
        </div>

        {/* Quote */}
        <div className="relative pl-4 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:rounded-full before:bg-terra-400">
          <p className="text-[13px] text-ink-600 leading-relaxed italic">
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="mt-2 text-xs text-ink-400 font-medium">— {quote.author}</p>
        </div>

        {/* Web search */}
        <form onSubmit={handleSearch}>
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-cream-100 border border-cream-200 focus-within:border-terra-300 focus-within:bg-white transition-all duration-150">
            <Search size={13} className="text-ink-400 flex-shrink-0" />
            <input
              name="q"
              type="text"
              placeholder="Cari di web..."
              className="flex-1 min-w-0 text-sm bg-transparent text-ink-700 placeholder-ink-300 outline-none"
            />
          </div>
        </form>

        {/* Fact of the day */}
        <div className="rounded-2xl overflow-hidden">
          <div className="bg-terra-500 px-4 py-2.5">
            <p className="text-xs font-bold text-white/90 uppercase tracking-widest">
              Fakta Hari Ini
            </p>
          </div>
          <div className="bg-terra-50 border border-terra-100 border-t-0 rounded-b-2xl px-4 py-3">
            <p className="text-[13px] text-terra-800 leading-relaxed">{fact}</p>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-6 py-5 mt-4">
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
