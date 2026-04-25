import { Github, X } from "lucide-react"
import type { FC } from "react"
import logoSrc from "../../assets/logo-transparent.png"

interface AboutPanelProps {
  onClose: () => void
}

const SOURCES = [
  {
    name: "BBC News",
    url: "https://www.bbc.com/news/world/asia",
    desc: "Liputan internasional Asia-Pasifik"
  },
  {
    name: "The Conversation",
    url: "https://theconversation.com/asia-pacific",
    desc: "Analisis akademis Asia-Pasifik"
  },
  {
    name: "Jubi",
    url: "https://jubi.id",
    desc: "Jurnalis Papua — media lokal independen"
  },
  {
    name: "Antara Papua",
    url: "https://www.antaranews.com/tag/papua",
    desc: "Kantor berita nasional Indonesia"
  }
]

const AboutPanel: FC<AboutPanelProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-ink-400 hover:text-ink-700 rounded-xl hover:bg-cream-100 transition-colors"
          aria-label="Tutup"
        >
          <X size={15} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <img src={logoSrc} alt="Tabaca" className="h-10 w-auto flex-shrink-0" />
          <div>
            <h2 className="text-base font-bold text-ink-900">Tabaca</h2>
            <p className="text-xs text-ink-400 font-medium">Stories from Papua, One Tab Away</p>
          </div>
        </div>

        <p className="text-sm text-ink-600 leading-relaxed mb-6">
          Tabaca adalah browser extension open source yang mengumpulkan cerita dan
          informasi terkurasi tentang Papua dari berbagai sumber kredibel — tepat di
          halaman tab baru Anda.
        </p>

        {/* Sources */}
        <div className="mb-6">
          <p className="section-label mb-3">Sumber Cerita</p>
          <ul className="space-y-2.5">
            {SOURCES.map((src) => (
              <li key={src.name}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-0.5 group"
                >
                  <span className="text-sm font-semibold text-terra-600 group-hover:text-terra-700 group-hover:underline transition-colors">
                    {src.name}
                  </span>
                  <span className="text-xs text-ink-400">{src.desc}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t border-cream-200 pt-5 flex items-center justify-between">
          <div className="text-xs text-ink-400 space-y-0.5">
            <p>
              Dibuat oleh{" "}
              <span className="font-semibold text-ink-600">Papua Open Source</span>
            </p>
            <p>Lisensi MIT · v0.1.0</p>
          </div>
          <a
            href="https://github.com/papua-open-source/tabaca"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-terra-outline"
          >
            <Github size={13} />
            GitHub
          </a>
        </div>
      </div>
    </div>
  )
}

export default AboutPanel
