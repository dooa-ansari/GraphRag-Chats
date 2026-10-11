import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  availableFlags,
  filterByFlags,
  findCatalogGraphId,
  listProducts,
  onlyProducts,
  type SearchResultNode,
} from './api'

function product(
  id: string,
  flags: Record<string, 'true' | 'false'> = {},
): SearchResultNode {
  return {
    id,
    name: id,
    type: 'Product',
    properties: Object.entries(flags).map(([name, value]) => ({ name, value })),
    score: 1,
    relationships: [],
  }
}

describe('findCatalogGraphId', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the id of the graph named "Grocery Store Catalog"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify([
            { id: 'g-other', name: 'Smith Family Tree', updatedAt: '', nodes: 1, edges: 0 },
            { id: 'g-catalog', name: 'Grocery Store Catalog', updatedAt: '', nodes: 1, edges: 0 },
          ]),
          { status: 200 },
        ),
      ),
    )

    await expect(findCatalogGraphId()).resolves.toBe('g-catalog')
  })

  it('returns null when no catalog graph has been seeded yet', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })))

    await expect(findCatalogGraphId()).resolves.toBeNull()
  })
})

describe('listProducts', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lists only Product nodes, with relationships derived from the graph edges', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            id: 'g-catalog',
            name: 'Grocery Store Catalog',
            nodes: [
              {
                id: 'cat-bars',
                data: { name: 'Protein Bars', type: 'Category', properties: [] },
              },
              {
                id: 'prod-choco',
                data: {
                  name: 'ChocoFit Protein Bar',
                  type: 'Product',
                  description: 'A chocolate protein bar.',
                  properties: [{ name: 'price', value: '$2.99' }],
                },
              },
            ],
            edges: [{ id: 'e1', source: 'prod-choco', target: 'cat-bars', relationship: 'belongs to' }],
          }),
          { status: 200 },
        ),
      ),
    )

    const products = await listProducts('g-catalog')

    expect(products).toEqual([
      {
        id: 'prod-choco',
        name: 'ChocoFit Protein Bar',
        type: 'Product',
        description: 'A chocolate protein bar.',
        properties: [{ name: 'price', value: '$2.99' }],
        score: 1,
        relationships: [
          { relationship: 'belongs to', direction: 'outgoing', otherId: 'cat-bars', otherName: 'Protein Bars' },
        ],
      },
    ])
  })
})

describe('onlyProducts', () => {
  it('drops non-Product matches (categories, brands, ingredients, allergens) without touching the rest', () => {
    const results: SearchResultNode[] = [
      { id: 'p1', name: 'ChocoFit Protein Bar', type: 'Product', properties: [], score: 0.9, relationships: [] },
      { id: 'c1', name: 'Protein Bars', type: 'Category', properties: [], score: 0.85, relationships: [] },
      { id: 'i1', name: 'Cocoa Powder', type: 'Ingredient', properties: [], score: 0.7, relationships: [] },
      { id: 'p2', name: 'Vanilla Clean Bar', type: 'Product', properties: [], score: 0.6, relationships: [] },
    ]

    expect(onlyProducts(results)).toEqual([results[0], results[3]])
    // The input array itself is untouched — callers that need the full,
    // unfiltered match set (e.g. to show later) still have it.
    expect(results).toHaveLength(4)
  })
})

describe('availableFlags', () => {
  it('lists only flags actually set true on at least one product, in FLAG_LABELS order', () => {
    const results = [
      product('p1', { organic: 'true', sugarFree: 'false' }),
      product('p2', { gmoFree: 'true' }),
    ]

    expect(availableFlags(results)).toEqual(['organic', 'gmoFree'])
  })

  it('returns an empty list when nothing has any flag set', () => {
    expect(availableFlags([product('p1', { sugarFree: 'false' })])).toEqual([])
  })
})

describe('filterByFlags', () => {
  const sugarFreeOrganic = product('p1', { sugarFree: 'true', organic: 'true' })
  const sugarFreeOnly = product('p2', { sugarFree: 'true', organic: 'false' })
  const neither = product('p3', {})
  const all = [sugarFreeOrganic, sugarFreeOnly, neither]

  it('returns everything unfiltered when no flags are selected', () => {
    expect(filterByFlags(all, [])).toBe(all)
  })

  it('keeps only products with every selected flag set true (AND, not OR)', () => {
    expect(filterByFlags(all, ['sugarFree'])).toEqual([sugarFreeOrganic, sugarFreeOnly])
    expect(filterByFlags(all, ['sugarFree', 'organic'])).toEqual([sugarFreeOrganic])
  })
})
