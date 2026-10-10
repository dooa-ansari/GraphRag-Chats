import { useEffect, useState } from 'react'
import { findCatalogGraphId, listProducts, onlyProducts, searchGraph, type SearchResultNode } from './api'
import ProductCard from './components/ProductCard'
import SearchBar from './components/SearchBar'
import SearchResults from './components/SearchResults'

type CatalogState =
  | { status: 'loading' }
  | { status: 'ready'; graphId: string }
  | { status: 'missing' }
  | { status: 'error'; message: string }

// The unfiltered catalog listing, shown until a search narrows it down.
type ProductsState =
  | { status: 'loading' }
  | { status: 'ready'; products: SearchResultNode[] }
  | { status: 'error'; message: string }

type SearchState =
  | { status: 'idle' }
  | { status: 'searching'; query: string }
  | { status: 'done'; query: string; results: SearchResultNode[] }
  | { status: 'error'; query: string; message: string }

function App() {
  const [catalog, setCatalog] = useState<CatalogState>({ status: 'loading' })
  const [products, setProducts] = useState<ProductsState>({ status: 'loading' })
  const [search, setSearch] = useState<SearchState>({ status: 'idle' })

  useEffect(() => {
    let cancelled = false
    findCatalogGraphId()
      .then((graphId) => {
        if (cancelled) return
        setCatalog(graphId ? { status: 'ready', graphId } : { status: 'missing' })
        if (!graphId) return
        return listProducts(graphId).then((result) => {
          if (!cancelled) setProducts({ status: 'ready', products: result })
        })
      })
      .catch((error) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Failed to load the catalog'
        setCatalog({ status: 'error', message })
        setProducts({ status: 'error', message })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const runSearch = async (query: string) => {
    if (catalog.status !== 'ready') return
    setSearch({ status: 'searching', query })
    try {
      const response = await searchGraph(catalog.graphId, query)
      setSearch({ status: 'done', query, results: response.results })
    } catch (error) {
      setSearch({
        status: 'error',
        query,
        message: error instanceof Error ? error.message : 'Search failed',
      })
    }
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-primary-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-4 sm:flex-row sm:justify-between">
          <h1 className="text-lg font-bold text-primary-700">Fresh Mart</h1>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <SearchBar
              onSearch={runSearch}
              searching={search.status === 'searching'}
              disabled={catalog.status !== 'ready'}
            />
            {search.status !== 'idle' && (
              <button
                type="button"
                onClick={() => setSearch({ status: 'idle' })}
                className="shrink-0 cursor-pointer text-sm font-medium text-primary-muted hover:text-primary-700"
              >
                All products
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {catalog.status === 'loading' && (
          <p className="text-center text-sm text-gray-500">Loading the catalog…</p>
        )}

        {catalog.status === 'missing' && (
          <p className="mx-auto max-w-md text-center text-sm text-gray-500">
            No "Grocery Store Catalog" graph was found. Seed the backend (it seeds automatically on
            first run against an empty database) or build one in the graph editor first.
          </p>
        )}

        {catalog.status === 'error' && (
          <p className="mx-auto max-w-md text-center text-sm text-red-600">{catalog.message}</p>
        )}

        {catalog.status === 'ready' && search.status === 'idle' && (
          <div className="flex flex-col gap-4">
            {products.status === 'loading' && (
              <p className="text-center text-sm text-gray-500">Loading products…</p>
            )}
            {products.status === 'error' && (
              <p className="mx-auto max-w-md text-center text-sm text-red-600">
                {products.message}
              </p>
            )}
            {products.status === 'ready' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.products.map((result) => (
                  <ProductCard key={result.id} result={result} showScore={false} />
                ))}
              </div>
            )}
          </div>
        )}

        {search.status === 'searching' && (
          <p className="text-center text-sm text-gray-500">Searching…</p>
        )}

        {search.status === 'error' && (
          <p className="mx-auto max-w-md text-center text-sm text-red-600">{search.message}</p>
        )}

        {search.status === 'done' &&
          (() => {
            // search.results keeps every matched node (categories, brands,
            // ingredients, allergens, ...) as the backend returned them —
            // only the rendered list is narrowed to products.
            const productMatches = onlyProducts(search.results)
            return productMatches.length === 0 ? (
              <p className="text-center text-sm text-gray-500">
                No products matched "{search.query}".
              </p>
            ) : (
              <SearchResults key={search.query} results={productMatches} />
            )
          })()}
      </main>
    </div>
  )
}

export default App
