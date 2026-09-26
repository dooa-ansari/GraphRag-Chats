import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Button from './components/Button'
import GraphNode from './components/GraphNode'
import RelationshipEdge from './components/RelationshipEdge'
import { LinkContext, type LinkContextValue, type LinkDirection } from './LinkContext'
import {
  IN_BOTTOM_HANDLE_ID,
  LINK_HANDLE_ID,
  LINK_UP_HANDLE_ID,
  createGraphEdge,
  createGraphNode,
  defaultNodeData,
  type GraphEdgeType,
  type GraphNodeType,
} from './graph'

// Defined outside the component so React Flow doesn't see new objects every render.
const nodeTypes = { graph: GraphNode }
const edgeTypes = { relationship: RelationshipEdge }

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphNodeType>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphEdgeType>([])

  // Every link gets its own edge, so nodes that are already connected can be
  // linked again, in either direction (each edge has its own relationship).
  const linkNodes = useCallback(
    (sourceId: string, targetId: string, direction: LinkDirection) => {
      setEdges((current) => [
        ...current,
        createGraphEdge(
          sourceId,
          targetId,
          direction === 'up'
            ? { sourceHandle: LINK_UP_HANDLE_ID, targetHandle: IN_BOTTOM_HANDLE_ID }
            : { sourceHandle: LINK_HANDLE_ID },
        ),
      ])
    },
    [setEdges],
  )

  // Dragging from a node's top button makes a reverse link, from the bottom one a normal link.
  const onConnect = useCallback(
    (connection: Connection) =>
      linkNodes(
        connection.source,
        connection.target,
        connection.sourceHandle === LINK_UP_HANDLE_ID ? 'up' : 'down',
      ),
    [linkNodes],
  )

  const isValidConnection = useCallback(
    (connection: Connection | GraphEdgeType) =>
      connection.source !== connection.target,
    [],
  )

  // Click-to-connect: click a node's blue "+" (or "↑" for a reverse link), then
  // click the node to link to.
  const [linking, setLinking] = useState<LinkContextValue['linking']>(null)

  const linkContext = useMemo<LinkContextValue>(
    () => ({
      linking,
      toggleLink: (nodeId, direction) =>
        setLinking((current) =>
          current?.nodeId === nodeId && current.direction === direction
            ? null
            : { nodeId, direction },
        ),
    }),
    [linking],
  )

  const onNodeClick = useCallback(
    (_: unknown, node: GraphNodeType) => {
      if (!linking || node.id === linking.nodeId) return
      linkNodes(linking.nodeId, node.id, linking.direction)
      setLinking(null)
    },
    [linking, linkNodes],
  )

  useEffect(() => {
    if (!linking) return
    const cancel = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLinking(null)
    }
    window.addEventListener('keydown', cancel)
    return () => window.removeEventListener('keydown', cancel)
  }, [linking])

  const addNode = useCallback(() => {
    setNodes((current) => [
      ...current,
      createGraphNode(
        { x: Math.random() * 400, y: Math.random() * 300 },
        defaultNodeData(current.length + 1),
      ),
    ])
  }, [setNodes])

  const saveGraph = useCallback(() => {
    const graph = {
      nodes: nodes.map(({ id, type, position, data }) => ({
        id,
        type,
        position,
        data,
      })),
      edges: edges.map(({ id, source, target, data }) => ({
        id,
        source,
        target,
        relationship: data?.relationship ?? '',
        bend: data?.bend,
      })),
    }
    console.log(JSON.stringify(graph, null, 2))
  }, [nodes, edges])

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <LinkContext.Provider value={linkContext}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          onNodeClick={onNodeClick}
          onPaneClick={() => setLinking(null)}
        >
          <Panel position="top-left" className="flex items-center gap-2">
            <Button onClick={addNode}>Add node</Button>
            <Button variant="secondary" onClick={saveGraph}>
              Save graph
            </Button>
            {linking && (
              <span className="rounded-md bg-primary-100 px-3 py-2 text-sm text-primary-700">
                {linking.direction === 'up'
                  ? 'Click the node this one points back to'
                  : 'Click the node to connect to'}{' '}
                (Esc to cancel)
              </span>
            )}
          </Panel>
          <Background />
          <Controls />
        </ReactFlow>
      </LinkContext.Provider>
    </div>
  )
}

export default App
