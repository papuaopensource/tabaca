import type { FC } from "react"
import type { SourceId } from "@/storage/schema"

interface SourceOption {
  id: SourceId | "all"
  label: string
}

const SOURCE_OPTIONS: SourceOption[] = [
  { id: "all", label: "Semua" },
  { id: "bbc", label: "BBC" },
  { id: "theconversation", label: "The Conversation" },
  { id: "jubi", label: "Jubi" },
  { id: "antara-papua", label: "Antara Papua" }
]

interface SourceFilterProps {
  active: SourceId | "all"
  onChange: (source: SourceId | "all") => void
  counts: Partial<Record<SourceId | "all", number>>
}

const SourceFilter: FC<SourceFilterProps> = ({ active, onChange, counts }) => {
  return (
    <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
      {SOURCE_OPTIONS.map((opt) => {
        const count = counts[opt.id]
        const isActive = active === opt.id

        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={[
              "relative flex items-center gap-1.5 px-4 h-12 text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors duration-150",
              isActive
                ? "text-terra-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-terra-500 after:rounded-t-full"
                : "text-ink-400 hover:text-ink-700 hover:bg-cream-100"
            ].join(" ")}
          >
            {opt.label}
            {count !== undefined && (
              <span
                className={`tabular-nums text-[10px] font-medium ${
                  isActive ? "text-terra-400" : "text-ink-300"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default SourceFilter
