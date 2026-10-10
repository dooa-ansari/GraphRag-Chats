import { useState } from 'react'
import type { SearchResultNode } from '../api'
import ProductCard from './ProductCard'

// Results arrive sorted by score descending (see backend's
// search_graph_nodes, ORDER BY score DESC) — the first one is the best match.
function SearchResults({ results }: { results: SearchResultNode[] }) {
  const [revealSimilar, setRevealSimilar] = useState(false)
  const [best, ...rest] = results

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 text-xs font-semibold tracking-wide text-primary-muted uppercase">
          Best match
        </h2>
        <div className="mx-auto max-w-sm">
          <ProductCard result={best} />
        </div>
      </div>

      {rest.length > 0 && (
        <div className="flex flex-col gap-4">
          {!revealSimilar ? (
            <button
              type="button"
              onClick={() => setRevealSimilar(true)}
              className="mx-auto cursor-pointer rounded-full border border-accent-300 px-5 py-2 text-sm font-semibold text-accent-700 transition-colors hover:bg-accent-50"
            >
              Similar products ({rest.length})
            </button>
          ) : (
            <>
              <h2 className="text-xs font-semibold tracking-wide text-primary-muted uppercase">
                Similar products
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((result) => (
                  <ProductCard key={result.id} result={result} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchResults
