import type { GraphNodeType } from './graph'

// Same-origin path: nginx.conf proxies it to the backend in the built app,
// and vite.config.ts's dev server proxy does the same for `npm run dev`.
const API_BASE = '/api'

export type GraphExportEdge = {
  id: string
  source: string
  target: string
  relationship: string
  bend?: { x: number; y: number }
  sourceHandle?: string | null
  targetHandle?: string | null
}

export type GraphExport = {
  nodes: Array<Pick<GraphNodeType, 'id' | 'type' | 'position' | 'data'>>
  edges: GraphExportEdge[]
}

export type SaveGraphResponse = {
  message: string
  status: string
  id: string
  name: string
  nodes: number
  edges: number
}

export type SavedGraphSummary = {
  id: string
  name: string
  updatedAt: string
  nodes: number
  edges: number
}

export type NamedGraphPayload = GraphExport & {
  id: string
  name: string
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

export function saveGraph(
  name: string,
  graph: GraphExport,
): Promise<SaveGraphResponse> {
  return request('/graphs', {
    method: 'POST',
    body: JSON.stringify({ name, ...graph }),
  })
}

export function listGraphs(): Promise<SavedGraphSummary[]> {
  return request('/graphs')
}

export function getGraph(id: string): Promise<NamedGraphPayload> {
  return request(`/graphs/${encodeURIComponent(id)}`)
}
