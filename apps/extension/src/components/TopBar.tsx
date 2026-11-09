import { PanelLeftClose, PanelLeftOpen, RefreshCw, Search } from "lucide-react"
import { searchShortcutLabel } from "@/lib/platform"
import { Logo } from "./Sidebar"

interface TopBarProps {
  sidebarExpanded: boolean
  updatedLabel: string
  isRefreshing: boolean
  onToggleSidebar: () => void
  onSearch: () => void
  onRefresh: () => void
}

export default function TopBar({
  sidebarExpanded,
  updatedLabel,
  isRefreshing,
  onToggleSidebar,
  onSearch,
  onRefresh
}: TopBarProps) {
  const ToggleIcon = sidebarExpanded ? PanelLeftClose : PanelLeftOpen
  const toggleLabel = sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="icon-button hidden lg:grid"
          aria-label={toggleLabel}
          title={toggleLabel}
        >
          <ToggleIcon size={18} aria-hidden />
        </button>
        <Logo className="md:hidden" />

        <button
          type="button"
          onClick={onSearch}
          className="focus-ring flex h-10 w-full max-w-md min-w-0 items-center gap-2.5 rounded-xl border border-line bg-surface px-3 text-sm text-subtle transition-colors hover:border-line-strong"
        >
          <Search size={16} aria-hidden className="shrink-0" />
          <span className="truncate">Search stories or the web…</span>
          <kbd className="ml-auto hidden rounded-md border border-line px-1.5 py-0.5 font-sans text-[10px] sm:inline">
            {searchShortcutLabel}
          </kbd>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="icon-button ml-auto shrink-0"
          aria-label="Refresh stories"
          title={updatedLabel || "Refresh stories"}
        >
          <RefreshCw
            size={17}
            aria-hidden
            className={isRefreshing ? "animate-spin" : undefined}
          />
        </button>
      </div>
    </header>
  )
}
