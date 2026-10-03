import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
import Button from '../components/Button'
import GraphNode from '../components/GraphNode'
import RelationshipEdge from '../components/RelationshipEdge'
import SearchPanel from '../components/SearchPanel'
import {
  generateEmbeddings,
  getGraph,
  saveGraph as apiSaveGraph,
  saveGraphText,
  type GraphExport,
} from '../api'
import { LinkContext, type LinkContextValue, type LinkDirection } from '../LinkContext'
import {
  IN_BOTTOM_HANDLE_ID,
  LINK_HANDLE_ID,
  LINK_UP_HANDLE_ID,
  createGraphEdge,
  createGraphNode,
  defaultNodeData,
  humanizeGraph,
  nodeEmbeddingTexts,
  toFlowEdge,
  toFlowNode,
  type GraphEdgeType,
  type GraphNodeType,
} from '../graph'

// Defined outside the component so React Flow doesn't see new objects every render.
const nodeTypes = { graph: GraphNode }
const edgeTypes = { relationship: RelationshipEdge }

function GraphEditorPage() {
  // Route is /graphs/new for a blank canvas, or /graphs/:id for a saved one.
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()

  const [nodes, setNodes, onNodesChange] = useNodesState<GraphNodeType>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphEdgeType>([])
  const [graphName, setGraphName] = useState('')

  // Loading an existing graph -------------------------------------------------

  const [loadState, setLoadState] = useState<
    { status: 'loading' } | { status: 'error'; message: string } | null
  >(isNew ? null : { status: 'loading' })

  useEffect(() => {
    if (isNew || !id) {
      setNodes([])
      setEdges([])
      setGraphName('')
      setGeneratedText(null)
      setEmbeddedNodeCount(null)
      setLoadState(null)
      return
    }

    let cancelled = false
    setLoadState({ status: 'loading' })
    getGraph(id)
      .then((graph) => {
        if (cancelled) return
        setNodes(graph.nodes.map(toFlowNode))
        setEdges(graph.edges.map(toFlowEdge))
        setGraphName(graph.name)
        setGeneratedText(graph.text ?? null)
        const embeddedNodes = graph.nodes.filter((node) => node.embeddingDimensions)
        setEmbeddedNodeCount(embeddedNodes.length)
        setEmbeddingDimensions(embeddedNodes[0]?.embeddingDimensions ?? null)
        setLoadState(null)
      })
      .catch((error) => {
        if (cancelled) return
        setLoadState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load graph',
        })
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setNodes/setEdges are stable
  }, [id, isNew])

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

  // Saving ------------------------------------------------------------------

  const [saveState, setSaveState] = useState<
    { status: 'saving' } | { status: 'success' | 'error'; message: string } | null
  >(null)

  const saveGraph = useCallback(async () => {
    const name = graphName.trim()
    if (!name) return

    const graph: GraphExport = {
      nodes: nodes.map(({ id, type, position, data }) => ({
        id,
        type,
        position,
        data,
      })),
      edges: edges.map(({ id, source, target, sourceHandle, targetHandle, data }) => ({
        id,
        source,
        target,
        sourceHandle,
        targetHandle,
        relationship: data?.relationship ?? '',
        bend: data?.bend,
      })),
    }

    setSaveState({ status: 'saving' })
    try {
      const result = await apiSaveGraph(name, graph)
      setSaveState({
        status: 'success',
        message: `Saved "${result.name}" (${result.nodes} node${result.nodes === 1 ? '' : 's'}, ${result.edges} edge${result.edges === 1 ? '' : 's'})`,
      })
      // A brand-new graph now has a real id — move the URL onto it so the
      // page (and the back button) reflect what's actually open, and so
      // further saves under a different name don't lose this one's id.
      if (isNew) navigate(`/graphs/${result.id}`, { replace: true })
    } catch (error) {
      setSaveState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Save failed',
      })
    }
  }, [graphName, nodes, edges, isNew, navigate])

  // The status message clears itself so it doesn't linger forever.
  useEffect(() => {
    if (!saveState || saveState.status === 'saving') return
    const timer = setTimeout(() => setSaveState(null), 4000)
    return () => clearTimeout(timer)
  }, [saveState])

  // Generating text for embeddings ---------------------------------------

  const [generatedText, setGeneratedText] = useState<string | null>(null)
  const [textState, setTextState] = useState<
    { status: 'generating' } | { status: 'success' | 'error'; message: string } | null
  >(null)
  const [textModalOpen, setTextModalOpen] = useState(false)

  const generateText = useCallback(async () => {
    if (!id || isNew) return
    const text = humanizeGraph(nodes)

    setTextState({ status: 'generating' })
    try {
      await saveGraphText(id, text)
      setGeneratedText(text)
      setTextState({ status: 'success', message: 'Text generated and saved' })
    } catch (error) {
      setTextState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate text',
      })
    }
  }, [id, isNew, nodes])

  useEffect(() => {
    if (!textState || textState.status === 'generating') return
    const timer = setTimeout(() => setTextState(null), 4000)
    return () => clearTimeout(timer)
  }, [textState])

  // Generating embeddings ------------------------------------------------
  // One vector per node (not one for the whole graph): each node's own text
  // is embedded separately, so each :GraphNode in Neo4j carries its own
  // embedding — but still as a single batched OpenRouter call, not one call
  // per node.

  const [embeddedNodeCount, setEmbeddedNodeCount] = useState<number | null>(null)
  const [embeddingDimensions, setEmbeddingDimensions] = useState<number | null>(null)
  const [embeddingState, setEmbeddingState] = useState<
    { status: 'generating' } | { status: 'success' | 'error'; message: string } | null
  >(null)

  const generateEmbeddingsForGraph = useCallback(async () => {
    if (!id || isNew) return
    const targets = nodeEmbeddingTexts(nodes, edges)
    if (targets.length === 0) {
      setEmbeddingState({ status: 'error', message: 'No named nodes to embed' })
      return
    }

    setEmbeddingState({ status: 'generating' })
    try {
      const result = await generateEmbeddings(id, targets)
      setEmbeddedNodeCount(result.count)
      setEmbeddingDimensions(result.dimensions)
      setEmbeddingState({
        status: 'success',
        message: `Generated embeddings for ${result.count} node${result.count === 1 ? '' : 's'} (${result.dimensions} dimensions each)`,
      })
    } catch (error) {
      setEmbeddingState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate embeddings',
      })
    }
  }, [id, isNew, nodes, edges])

  useEffect(() => {
    if (!embeddingState || embeddingState.status === 'generating') return
    const timer = setTimeout(() => setEmbeddingState(null), 4000)
    return () => clearTimeout(timer)
  }, [embeddingState])

  // Search panel --------------------------------------------------------

  const [searchOpen, setSearchOpen] = useState(false)

  if (loadState?.status === 'loading') {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-500">
        Loading graph…
      </div>
    )
  }

  if (loadState?.status === 'error') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-red-600">{loadState.message}</p>
        <Link to="/" className="text-primary-600 underline">
          Back to all graphs
        </Link>
      </div>
    )
  }

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
          <Panel position="top-left" className="flex flex-wrap items-start gap-2">
            <Link
              to="/"
              className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
            >
              ← All graphs
            </Link>
            <Button onClick={addNode}>Add node</Button>

            <input
              value={graphName}
              onChange={(e) => setGraphName(e.target.value)}
              placeholder="Graph name"
              aria-label="Graph name"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none"
            />
            <Button
              variant="secondary"
              onClick={saveGraph}
              disabled={saveState?.status === 'saving' || !graphName.trim()}
            >
              {saveState?.status === 'saving' ? 'Saving…' : 'Save graph'}
            </Button>

            {saveState && saveState.status !== 'saving' && (
              <span
                className={`rounded-md px-3 py-2 text-sm ${
                  saveState.status === 'success'
                    ? 'bg-secondary-100 text-secondary-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {saveState.message}
              </span>
            )}

            <Button
              variant="outline"
              onClick={generateText}
              disabled={isNew || nodes.length === 0 || textState?.status === 'generating'}
              title={isNew ? 'Save the graph first' : undefined}
            >
              {textState?.status === 'generating' ? 'Generating…' : 'Generate text'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setTextModalOpen(true)}
              disabled={!generatedText}
            >
              View text
            </Button>

            {textState && textState.status !== 'generating' && (
              <span
                className={`rounded-md px-3 py-2 text-sm ${
                  textState.status === 'success'
                    ? 'bg-secondary-100 text-secondary-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {textState.message}
              </span>
            )}

            <Button
              variant="outline"
              onClick={generateEmbeddingsForGraph}
              disabled={
                isNew || nodes.length === 0 || embeddingState?.status === 'generating'
              }
              title={isNew ? 'Save the graph first' : undefined}
            >
              {embeddingState?.status === 'generating'
                ? 'Generating…'
                : embeddedNodeCount
                  ? 'Regenerate embeddings'
                  : 'Generate embeddings'}
            </Button>

            {embeddingState && embeddingState.status !== 'generating' && (
              <span
                className={`rounded-md px-3 py-2 text-sm ${
                  embeddingState.status === 'success'
                    ? 'bg-secondary-100 text-secondary-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {embeddingState.message}
              </span>
            )}
            {/* No fresh success/error message right now (e.g. just after
                loading a saved graph) — show what's already stored, if any. */}
            {!embeddingState && !!embeddedNodeCount && (
              <span className="rounded-md bg-secondary-100 px-3 py-2 text-sm text-secondary-700">
                {embeddedNodeCount} node{embeddedNodeCount === 1 ? '' : 's'} embedded (
                {embeddingDimensions} dimensions each)
              </span>
            )}
            <Button
              variant="secondary"
              onClick={() => setSearchOpen(true)}
              disabled={isNew}
              title={isNew ? 'Save the graph first' : undefined}
            >
              Search
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

      {textModalOpen && generatedText && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setTextModalOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-xl flex-col rounded-lg bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Generated text</h2>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(generatedText)}
                >
                  Copy
                </Button>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setTextModalOpen(false)}
                  className="cursor-pointer text-xl leading-none text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <p className="overflow-auto whitespace-pre-wrap text-sm text-gray-700">
              {generatedText}
            </p>
          </div>
        </div>
      )}

      {!isNew && id && (
        <SearchPanel graphId={id} open={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </div>
  )
}

export default GraphEditorPage
