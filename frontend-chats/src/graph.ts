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
  // How far the user has dragged the middle of the edge from where it would sit
  // by default. Stored relative to the default so it follows the nodes around.
  bend?: XYPosition
}

export type GraphEdgeType = Edge<GraphEdgeData, 'relationship'>

// Same value as --color-primary-600 in index.css (SVG marker colors can't use CSS variables).
export const EDGE_COLOR = '#2563eb'

// Ids of a node's source handles. Edges must always name one explicitly:
// with no id React Flow attaches to whichever source handle comes first.
export const CHILD_HANDLE_ID = 'child'
export const LINK_HANDLE_ID = 'link'
// Handles for reverse links (e.g. child to parent): they leave from a node's top
// and arrive at the other node's bottom.
export const LINK_UP_HANDLE_ID = 'link-up'
export const IN_BOTTOM_HANDLE_ID = 'in-bottom'

// Builds a React Flow edge from plain data — used both for a brand-new edge
// (createGraphEdge) and for one loaded back from a saved graph, so both end up
// styled and wired up identically.
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

// Builds a React Flow node from a saved node (its `type` is always "graph",
// but keeping it explicit here makes the field's origin clear at the call site).
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

// Turns one node's fields into plain sentences, e.g. for a node named "Dooa"
// of type "Person" with a property {name: "age", value: "33"}:
// "Dooa is a person. Dooa's age is 33."
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

// Renders the current graph as plain English — for the "Generate text"/"View
// text" buttons. Each node becomes a few sentences about its name, type,
// description and properties. Edges aren't included.
export function humanizeGraph(nodes: GraphNodeType[]): string {
  return nodes.map((node) => describeNode(node.data)).filter(Boolean).join(' ')
}

// A node's relationships to its directly connected neighbors, as sentences —
// e.g. if Rashid --Father--> Dooa, Dooa's list includes "Rashid Father Dooa."
// and Rashid's includes the same sentence too (each node describes every edge
// touching it, regardless of which end it's on). Edges with no relationship
// label, or whose other end has no name, are skipped.
function describeNodeRelationships(
  nodeId: string,
  nodeName: string,
  edges: GraphEdgeType[],
  nodesById: Map<string, GraphNodeType>,
): string[] {
  const sentences: string[] = []
  for (const edge of edges) {
    const relationship = edge.data?.relationship.trim()
    if (!relationship) continue

    if (edge.source === nodeId) {
      const targetName = nodesById.get(edge.target)?.data.name.trim()
      if (targetName) sentences.push(`${nodeName} ${relationship} ${targetName}.`)
    }
    if (edge.target === nodeId) {
      const sourceName = nodesById.get(edge.source)?.data.name.trim()
      if (sourceName) sentences.push(`${sourceName} ${relationship} ${nodeName}.`)
    }
  }
  return sentences
}

// One embedding input per node — each node gets its own vector, computed from
// its own attributes (same sentence rules as humanizeGraph) plus, unlike
// humanizeGraph, sentences for every edge touching it. Without this, a vector
// search has no way to answer relationship questions ("who is X's father?"),
// since a node's own attributes never mention who it's connected to. Nodes
// with no name produce no text and are left out, since there'd be nothing to embed.
export function nodeEmbeddingTexts(
  nodes: GraphNodeType[],
  edges: GraphEdgeType[],
): Array<{ id: string; text: string }> {
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  return nodes
    .map((node) => {
      const own = describeNode(node.data)
      if (!own) return { id: node.id, text: '' }
      const relationships = describeNodeRelationships(
        node.id,
        node.data.name.trim(),
        edges,
        nodesById,
      )
      return { id: node.id, text: [own, ...relationships].join(' ') }
    })
    .filter((entry) => entry.text)
}
