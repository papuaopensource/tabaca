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
    <div className="flex items-center gap-1.5 flex-wrap">
      {SOURCE_OPTIONS.map((opt) => {
        const count = counts[opt.id]
        const isActive = active === opt.id

        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={isActive ? "btn-filter-active" : "btn-filter"}
          >
            {opt.label}
            {count !== undefined && (
              <span className={`ml-0.5 tabular-nums ${isActive ? "text-white/70" : "text-ink-300"}`}>
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
