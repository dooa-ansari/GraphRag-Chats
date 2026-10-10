// Same-origin path: nginx.conf proxies it to the backend in the built app,
// and vite.config.ts's dev server proxy does the same for `npm run dev`.
const API_BASE = '/api'

// The grocery catalog is seeded with this exact name (see
// backend/src/backend/seed_data.py's _build_grocery_graph) — its id is a
// random uuid assigned at seed/save time, so it's resolved by name instead
// of being hardcoded.
export const CATALOG_NAME = 'Grocery Store Catalog'

export type SavedGraphSummary = {
  id: string
  name: string
  updatedAt: string
  nodes: number
  edges: number
}

export type RelationshipFact = {
  relationship: string
  direction: 'outgoing' | 'incoming'
  otherId: string
  otherName: string
}

export type SearchResultNode = {
  id: string
  name: string
  type: string
  description?: string | null
  properties: Array<{ name: string; value: string }>
  score: number
  relationships: RelationshipFact[]
}

export type SearchResponse = {
  query: string
  results: SearchResultNode[]
}

// Vector search matches across every node type in the graph (Category,
// Brand, Ingredient, Allergen, ...), not just Product — this storefront
// only ever displays products, so callers filter with this before
// rendering. The raw, unfiltered `results` from a search are kept as-is
// (not mutated) in case something else needs the non-product matches later.
export const PRODUCT_TYPE = 'Product'

export function onlyProducts(results: SearchResultNode[]): SearchResultNode[] {
  return results.filter((result) => result.type === PRODUCT_TYPE)
}

export type GraphNode = {
  id: string
  data: {
    name: string
    type: string
    description?: string | null
    properties: Array<{ name: string; value: string }>
  }
}

export type GraphEdge = {
  id: string
  source: string
  target: string
  relationship: string
}

export type NamedGraphPayload = {
  id: string
  name: string
  nodes: GraphNode[]
  edges: GraphEdge[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })

  if (!response.ok) {
    // FastAPI errors come back as JSON ({"detail": ...}); anything else (a
    // proxy error page, a 500) is plain text.
    const body = await response.text()
    let detail = body
    try {
      detail = JSON.stringify(JSON.parse(body).detail)
    } catch {
      // Not JSON — use the raw text as-is.
    }
    throw new Error(`Request failed (${response.status}): ${detail}`)
  }

  return response.json()
}

export function listGraphs(): Promise<SavedGraphSummary[]> {
  return request('/graphs')
}

/** Finds the seeded catalog graph's id by name. Null if it hasn't been seeded yet. */
export async function findCatalogGraphId(): Promise<string | null> {
  const graphs = await listGraphs()
  return graphs.find((graph) => graph.name === CATALOG_NAME)?.id ?? null
}

export function searchGraph(graphId: string, query: string, limit = 12): Promise<SearchResponse> {
  return request(`/graphs/${encodeURIComponent(graphId)}/search`, {
    method: 'POST',
    body: JSON.stringify({ query, limit }),
  })
}

export function getGraph(graphId: string): Promise<NamedGraphPayload> {
  return request(`/graphs/${encodeURIComponent(graphId)}`)
}

/**
 * Lists every Product node as a SearchResultNode (score 1, since nothing was
 * ranked), with relationships derived from the graph's own edges — used for
 * the initial "all products" listing, shown before any search has run.
 */
export async function listProducts(graphId: string): Promise<SearchResultNode[]> {
  const graph = await getGraph(graphId)
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]))

  return graph.nodes
    .filter((node) => node.data.type === 'Product')
    .map((node) => {
      const relationships: RelationshipFact[] = []
      for (const edge of graph.edges) {
        if (edge.source === node.id) {
          const other = nodesById.get(edge.target)
          if (other) {
            relationships.push({
              relationship: edge.relationship,
              direction: 'outgoing',
              otherId: other.id,
              otherName: other.data.name,
            })
          }
        } else if (edge.target === node.id) {
          const other = nodesById.get(edge.source)
          if (other) {
            relationships.push({
              relationship: edge.relationship,
              direction: 'incoming',
              otherId: other.id,
              otherName: other.data.name,
            })
          }
        }
      }
      return {
        id: node.id,
        name: node.data.name,
        type: node.data.type,
        description: node.data.description,
        properties: node.data.properties,
        score: 1,
        relationships,
      }
    })
}
