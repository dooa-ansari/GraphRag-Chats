import { afterEach, describe, expect, it, vi } from 'vitest'
import { findCatalogGraphId, listProducts, onlyProducts, type SearchResultNode } from './api'

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
