import { BookOpen, RefreshCw } from "lucide-react"
import type { FC } from "react"

interface EmptyStateProps {
  isLoading: boolean
  hasFilter: boolean
  onRefresh: () => void
}

const EmptyState: FC<EmptyStateProps> = ({ isLoading, hasFilter, onRefresh }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-10 h-10 border-2 border-terra-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-ink-400 font-medium">
          Mengumpulkan cerita dari Papua…
        </p>
      </div>
    )
  }

  if (hasFilter) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <BookOpen size={32} className="text-cream-300" />
        <p className="text-sm font-semibold text-ink-600">
          Tidak ada cerita yang cocok
        </p>
        <p className="text-xs text-ink-400">
          Coba pilih sumber yang berbeda.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-16 h-16 rounded-2xl bg-terra-50 border border-terra-100 flex items-center justify-center">
        <BookOpen size={28} className="text-terra-300" />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-bold text-ink-700">
          Belum ada cerita
        </p>
        <p className="text-sm text-ink-400 max-w-xs">
          Cerita dari Papua akan muncul di sini setelah pengambilan pertama.
        </p>
      </div>
      <button onClick={onRefresh} className="btn-terra-outline mt-1">
        <RefreshCw size={13} />
        Ambil cerita sekarang
      </button>
    </div>
  )
}

export default EmptyState
