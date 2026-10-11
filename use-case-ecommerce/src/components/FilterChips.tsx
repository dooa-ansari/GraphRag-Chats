import { FLAG_LABELS } from '../api'

function FilterChips({
  flags,
  selected,
  onToggle,
}: {
  // Which flags to offer — only ones actually present in the current list,
  // so a chip never filters everything out by itself.
  flags: string[]
  selected: Set<string>
  onToggle: (flag: string) => void
}) {
  if (flags.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold tracking-wide text-primary-muted uppercase">Filter</span>
      {flags.map((flag) => {
        const isSelected = selected.has(flag)
        return (
          <button
            key={flag}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(flag)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              isSelected
                ? 'border-accent-600 bg-accent-600 text-white'
                : 'border-accent-300 text-accent-700 hover:bg-accent-50'
            }`}
          >
            {FLAG_LABELS[flag]}
          </button>
        )
      })}
    </div>
  )
}

export default FilterChips
