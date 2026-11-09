import { Clock, Info, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/cn"
import logoSrc from "@@/assets/icon.png"

export type FeedView = "foryou" | "latest"

interface SidebarProps {
  expanded: boolean
  view: FeedView
  onViewChange: (view: FeedView) => void
  onAbout: () => void
}

export default function Sidebar({
  expanded,
  view,
  onViewChange,
  onAbout
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-canvas transition-[width] duration-200 md:flex",
        expanded ? "w-16 lg:w-60" : "w-16"
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-4">
        <Logo />
        <span
          className={cn(
            "text-[15px] font-bold tracking-tight text-fg",
            expanded ? "hidden lg:inline" : "sr-only"
          )}
        >
          tabaca
        </span>
      </div>

      <nav aria-label="Navigation" className="flex flex-col gap-1 px-3 pt-2">
        <NavItem
          expanded={expanded}
          icon={Sparkles}
          label="For you"
          active={view === "foryou"}
          onClick={() => onViewChange("foryou")}
        />
        <NavItem
          expanded={expanded}
          icon={Clock}
          label="Latest"
          active={view === "latest"}
          onClick={() => onViewChange("latest")}
        />
      </nav>

      <div className="mt-auto flex flex-col gap-1 px-3 pb-4">
        <NavItem
          expanded={expanded}
          icon={Info}
          label="About"
          onClick={onAbout}
        />
      </div>
    </aside>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    // The icon file has generous padding, so it's scaled up and clipped by the tile.
    <span
      className={cn(
        "relative size-8 shrink-0 overflow-hidden rounded-[10px] bg-white",
        className
      )}
    >
      <img
        src={logoSrc}
        alt=""
        className="absolute top-1/2 left-1/2 size-12 max-w-none -translate-x-1/2 -translate-y-1/2"
      />
    </span>
  )
}

interface NavItemProps {
  expanded: boolean
  icon: LucideIcon
  label: string
  active?: boolean
  onClick: () => void
}

function NavItem({
  expanded,
  icon: Icon,
  label,
  active,
  onClick
}: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring flex h-10 items-center gap-3 rounded-xl px-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-surface-muted text-fg"
          : "text-muted hover:bg-surface-muted hover:text-fg"
      )}
    >
      <Icon size={18} aria-hidden className="shrink-0" />
      <span
        className={cn("truncate", expanded ? "hidden lg:inline" : "sr-only")}
      >
        {label}
      </span>
    </button>
  )
}
