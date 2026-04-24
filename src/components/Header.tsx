import { RefreshCw } from "lucide-react"
import type { FC } from "react"

interface HeaderProps {
  isRefreshing: boolean
  lastUpdated: string
  onRefresh: () => void
  onAboutOpen: () => void
}

const Header: FC<HeaderProps> = ({
  isRefreshing,
  lastUpdated,
  onRefresh,
  onAboutOpen
}) => {
  return (
    <header className="sticky top-0 z-10 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            tabaca
          </span>
        </div>

        <div className="flex items-center gap-1">
          {lastUpdated && (
            <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-600 mr-2">
              {lastUpdated}
            </span>
          )}

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn-ghost"
            title="Perbarui cerita"
            aria-label="Perbarui cerita"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">Perbarui</span>
          </button>

          <button
            onClick={onAboutOpen}
            className="btn-ghost"
            title="Tentang Tabaca"
            aria-label="Tentang Tabaca"
          >
            <span className="text-sm">Tentang</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
