import { MarkerType, type Edge, type Node, type XYPosition } from '@xyflow/react'
import { v4 as uuidv4 } from 'uuid'

export type NodeProperty = {
  name: string
  value: string
}

export type GraphNodeData = {
  name: string
  type: string
  description?: string
  properties: NodeProperty[]
}

export type GraphNodeType = Node<GraphNodeData, 'graph'>

export type GraphEdgeData = {
  relationship: string
  // Offset from the edge's default midpoint, if the user dragged it.
  bend?: XYPosition
}

export type GraphEdgeType = Edge<GraphEdgeData, 'relationship'>

// Same value as --color-primary-600 in index.css (SVG marker colors can't use CSS variables).
export const EDGE_COLOR = '#2563eb'

// Ids of a node's source handles. Edges must always name one explicitly:
// with no id React Flow attaches to whichever source handle comes first.
export const CHILD_HANDLE_ID = 'child'
export const LINK_HANDLE_ID = 'link'
// Reverse-link handles (e.g. child to parent): top-to-bottom instead of bottom-to-top.
export const LINK_UP_HANDLE_ID = 'link-up'
export const IN_BOTTOM_HANDLE_ID = 'in-bottom'

// Builds a styled React Flow edge from plain data — used for both new and loaded edges.
export function toFlowEdge(edge: {
  id: string
  source: string
  target: string
  relationship: string
  bend?: XYPosition
  sourceHandle?: string | null
  targetHandle?: string | null
}): GraphEdgeType {
  return {
    id: edge.id,
    type: 'relationship',
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    // Arrowhead at the target end shows the direction of the relationship.
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: EDGE_COLOR,
    },
    data: { relationship: edge.relationship, bend: edge.bend },
  }
}

export function createGraphEdge(
  source: string,
  target: string,
  {
    sourceHandle,
    targetHandle,
    relationship = '',
  }: {
    sourceHandle?: string | null
    targetHandle?: string | null
    relationship?: string
  } = {},
): GraphEdgeType {
  return toFlowEdge({
    // Random id, not `${source}-${target}`: two nodes can have several edges.
    id: uuidv4(),
    source,
    target,
    relationship,
    sourceHandle,
    targetHandle,
  })
}

export function createGraphNode(
  position: XYPosition,
  data: GraphNodeData,
): GraphNodeType {
  return {
    id: uuidv4(),
    type: 'graph',
    position,
    data,
  }
}

export function toFlowNode(node: {
  id: string
  position: XYPosition
  data: GraphNodeData
}): GraphNodeType {
  return { id: node.id, type: 'graph', position: node.position, data: node.data }
}

export function defaultNodeData(index: number): GraphNodeData {
  return { name: `Node ${index}`, type: 'Entity', properties: [] }
}

// Turns one node's fields into plain sentences, e.g. "Dooa is a person. Dooa's age is 33."
function describeNode({ name, type, description, properties }: GraphNodeData): string {
  const trimmedName = name.trim()
  if (!trimmedName) return ''

  const sentences: string[] = []
  const trimmedType = type.trim()
  if (trimmedType) {
    const article = /^[aeiou]/i.test(trimmedType) ? 'an' : 'a'
    sentences.push(`${trimmedName} is ${article} ${trimmedType.toLowerCase()}.`)
  }
  // Written as-is, not as an "X's description is ..." property sentence.
  const trimmedDescription = description?.trim()
  if (trimmedDescription) {
    sentences.push(/[.!?]$/.test(trimmedDescription) ? trimmedDescription : `${trimmedDescription}.`)
  }
  for (const property of properties) {
    const propertyName = property.name.trim()
    const propertyValue = property.value.trim()
    if (propertyName && propertyValue) {
      sentences.push(`${trimmedName}'s ${propertyName} is ${propertyValue}.`)
    }
  }
  return sentences.join(' ')
}

// Renders the whole graph as plain English, for "Generate text"/"View text". Edges aren't included.
export function humanizeGraph(nodes: GraphNodeType[]): string {
  return nodes.map((node) => describeNode(node.data)).filter(Boolean).join(' ')
}

// One embedding input per node (attributes only — search reads relationships
// live from Neo4j instead, so they can't go stale).
export function nodeEmbeddingTexts(
  nodes: GraphNodeType[],
): Array<{ id: string; text: string }> {
  return nodes
    .map((node) => ({ id: node.id, text: describeNode(node.data) }))
    .filter((entry) => entry.text)
}
