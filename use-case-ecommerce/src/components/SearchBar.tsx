import { useState, type FormEvent } from 'react'

function SearchBar({
  onSearch,
  searching,
  disabled,
}: {
  onSearch: (query: string) => void
  searching: boolean
  disabled?: boolean
}) {
  const [value, setValue] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const query = value.trim()
    if (!query || searching) return
    onSearch(query)
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-2xl items-center gap-2">
      <div className="relative flex-1">
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-primary-muted"
        >
          <circle cx="8.5" cy="8.5" r="6" />
          <path strokeLinecap="round" d="M13.5 13.5 18 18" />
        </svg>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search products, e.g. &quot;sugar free protein snack&quot;"
          aria-label="Search the product catalog"
          disabled={disabled}
          className="w-full rounded-full border border-primary-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
      <button
        type="submit"
        disabled={searching || disabled || !value.trim()}
        className="shrink-0 cursor-pointer rounded-full bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {searching ? 'Searching…' : 'Search'}
      </button>
    </form>
  )
}

export default SearchBar
