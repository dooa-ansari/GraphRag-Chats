import type { SearchResultNode } from '../api'

// Flags are stored as string "true"/"false" properties (see seed_data.py's
// PRODUCTS table) — shown as pill badges instead of a plain name/value row.
const FLAG_LABELS: Record<string, string> = {
  sugarFree: 'Sugar-free',
  organic: 'Organic',
  gmoFree: 'GMO-free',
  seedOilFree: 'Seed-oil-free',
  lactoseFree: 'Lactose-free',
}

function isFlagProperty(name: string): boolean {
  return name in FLAG_LABELS
}

function ProductCard({ result, showScore = true }: { result: SearchResultNode; showScore?: boolean }) {
  const isProduct = result.type === 'Product'
  const price = result.properties.find((p) => p.name === 'price')?.value
  const flags = result.properties.filter((p) => isFlagProperty(p.name) && p.value === 'true')
  const otherProperties = result.properties.filter(
    (p) => p.name !== 'price' && !isFlagProperty(p.name),
  )

  const category = result.relationships.find((r) => r.relationship === 'belongs to')
  const brand = result.relationships.find((r) => r.relationship === 'is made by')
  const allergens = result.relationships.filter((r) => r.relationship === 'contains allergen')

  return (
    <article className="flex flex-col gap-2 rounded-xl border border-primary-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{result.name}</h3>
          <p className="text-xs text-primary-muted">
            {brand ? brand.otherName : result.type}
            {category ? ` · ${category.otherName}` : ''}
          </p>
        </div>
        {showScore && (
          <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
            {Math.round(result.score * 100)}% match
          </span>
        )}
      </div>

      {result.description && <p className="text-sm text-gray-600">{result.description}</p>}

      {isProduct && price && <p className="text-lg font-bold text-gray-900">{price}</p>}

      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {flags.map((flag) => (
            <span
              key={flag.name}
              className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700"
            >
              {FLAG_LABELS[flag.name]}
            </span>
          ))}
        </div>
      )}

      {allergens.length > 0 && (
        <p className="text-xs text-gray-500">
          Contains: {allergens.map((a) => a.otherName).join(', ')}
        </p>
      )}

      {otherProperties.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 border-t border-primary-50 pt-2 text-xs">
          {otherProperties.map((property) => (
            <div key={property.name} className="contents">
              <dt className="font-medium text-primary-muted">{property.name}</dt>
              <dd className="text-gray-700">{property.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  )
}

export default ProductCard
