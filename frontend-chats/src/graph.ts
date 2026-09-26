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
  return {
    // Random id, not `${source}-${target}`: two nodes can have several edges.
    id: uuidv4(),
    type: 'relationship',
    source,
    target,
    sourceHandle,
    targetHandle,
    // Arrowhead at the target end shows the direction of the relationship.
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: EDGE_COLOR,
    },
    data: { relationship },
  }
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

export function defaultNodeData(index: number): GraphNodeData {
  return { name: `Node ${index}`, type: 'Entity', properties: [] }
}
