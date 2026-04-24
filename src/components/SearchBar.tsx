import { Search, X } from "lucide-react"
import type { FC } from "react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

const SearchBar: FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="relative w-full max-w-sm">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari cerita..."
        className="w-full pl-8 pr-8 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-gray-100"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Hapus pencarian"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}

export default SearchBar
