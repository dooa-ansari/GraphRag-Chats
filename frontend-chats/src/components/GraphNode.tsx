import { useContext } from 'react'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { LinkContext } from '../LinkContext'
import {
  CHILD_HANDLE_ID,
  IN_BOTTOM_HANDLE_ID,
  LINK_HANDLE_ID,
  LINK_UP_HANDLE_ID,
  createGraphEdge,
  createGraphNode,
  defaultNodeData,
  type GraphEdgeType,
  type GraphNodeData,
  type GraphNodeType,
  type NodeProperty,
} from '../graph'

const CHILD_GAP_Y = 160
const CHILD_SPACING_X = 340

// `nodrag` / `nowheel` stop React Flow from dragging the node or zooming the
// canvas while the user is interacting with a field.
const inputClass =
  'nodrag nowheel w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 ' +
  'placeholder:text-gray-400 focus:border-primary-500 focus:outline-none ' +
  'aria-invalid:border-red-500'

function GraphNode({ id, data }: NodeProps<GraphNodeType>) {
  const { getNode, getNodes, getEdges, addNodes, addEdges, updateNodeData } =
    useReactFlow<GraphNodeType, GraphEdgeType>()
  const { linking, toggleLink } = useContext(LinkContext)
  const linkingHere = linking?.nodeId === id
  const isLinkTarget = linking !== null && !linkingHere

  const update = (patch: Partial<GraphNodeData>) => updateNodeData(id, patch)

  const updateProperty = (index: number, patch: Partial<NodeProperty>) =>
    update({
      properties: data.properties.map((property, i) =>
        i === index ? { ...property, ...patch } : property,
      ),
    })

  const addProperty = () =>
    update({ properties: [...data.properties, { name: '', value: '' }] })

  const removeProperty = (index: number) =>
    update({ properties: data.properties.filter((_, i) => i !== index) })

  const addChild = () => {
    const parent = getNode(id)
    if (!parent) return

    // Place the child below the parent (using its rendered height) and spread
    // siblings horizontally so they don't stack on top of each other.
    const siblings = getEdges().filter((edge) => edge.source === id).length
    const child = createGraphNode(
      {
        x: parent.position.x + siblings * CHILD_SPACING_X,
        y: parent.position.y + (parent.measured?.height ?? 100) + CHILD_GAP_Y,
      },
      defaultNodeData(getNodes().length + 1),
    )

    addNodes(child)
    addEdges(createGraphEdge(id, child.id, { sourceHandle: CHILD_HANDLE_ID }))
  }

  return (
    <div
      className={`relative w-64 rounded-lg border bg-white p-3 text-left shadow-sm ${
        isLinkTarget
          ? 'cursor-pointer border-primary-600 ring-2 ring-primary-300'
          : 'border-primary-300'
      }`}
    >
      {/* Larger than the default so it's easy to drop a dragged connection on. */}
      <Handle
        type="target"
        position={Position.Top}
        className="size-4! border-primary-600! bg-white!"
      />

      <div className="flex flex-col gap-2">
        <input
          className={`${inputClass} font-semibold text-primary-700`}
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Name *"
          aria-label="Name"
          aria-invalid={data.name.trim() === ''}
          required
        />
        <input
          className={inputClass}
          value={data.type}
          onChange={(e) => update({ type: e.target.value })}
          placeholder="Type *"
          aria-label="Type"
          aria-invalid={data.type.trim() === ''}
          required
        />
        <textarea
          className={`${inputClass} resize-none`}
          value={data.description ?? ''}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Description (optional)"
          aria-label="Description"
          rows={2}
        />
      </div>

      <div className="mt-2 border-t border-secondary-100 pt-2">
        <div className="mb-1 text-xs font-medium text-secondary-700">
          Properties
        </div>
        <div className="flex flex-col gap-1">
          {data.properties.map((property, index) => (
            <div key={index} className="flex items-center gap-1">
              <input
                className={inputClass}
                value={property.name}
                onChange={(e) => updateProperty(index, { name: e.target.value })}
                placeholder="Name"
                aria-label={`Property ${index + 1} name`}
              />
              <input
                className={inputClass}
                value={property.value}
                onChange={(e) =>
                  updateProperty(index, { value: e.target.value })
                }
                placeholder="Value"
                aria-label={`Property ${index + 1} value`}
              />
              <button
                type="button"
                aria-label={`Remove property ${index + 1}`}
                onClick={() => removeProperty(index)}
                className="nodrag shrink-0 cursor-pointer px-1 text-sm leading-none text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addProperty}
          className="nodrag mt-1 cursor-pointer text-xs font-medium text-secondary-600 hover:text-secondary-700"
        >
          + Add property
        </button>
      </div>

      {/* Drag from this blue "+" onto another node's top handle to add an edge,
          even between nodes that are already connected. */}
      <Handle
        id={LINK_HANDLE_ID}
        type="source"
        position={Position.Bottom}
        style={{ left: '75%' }}
        title="Click, then click another node (or drag onto its top handle) to connect"
        aria-label="Connect to another node"
        onClick={() => toggleLink(id, 'down')}
        className={`size-6! rounded-full! border-0! bg-primary-600! flex items-center justify-center text-base leading-none text-white ${
          linkingHere && linking.direction === 'down' ? 'ring-4 ring-primary-300' : ''
        }`}
      >
        +
      </Handle>

      {/* Reverse link (e.g. child to parent): leaves from this node's top and
          arrives at the bottom of the node you pick. */}
      <Handle
        id={LINK_UP_HANDLE_ID}
        type="source"
        position={Position.Top}
        style={{ left: '90%' }}
        title="Click, then click another node to point back to it (reverse link)"
        aria-label="Connect back to another node"
        onClick={() => toggleLink(id, 'up')}
        className={`size-6! rounded-full! border-0! bg-primary-600! flex items-center justify-center text-base leading-none text-white ${
          linkingHere && linking.direction === 'up' ? 'ring-4 ring-primary-300' : ''
        }`}
      >
        ↑
      </Handle>

      {/* Where reverse links arrive. */}
      <Handle
        id={IN_BOTTOM_HANDLE_ID}
        type="target"
        position={Position.Bottom}
        style={{ left: '90%' }}
        className="opacity-0"
      />

      {/* Invisible anchor so edges start at the "+" button. */}
      <Handle
        id={CHILD_HANDLE_ID}
        type="source"
        position={Position.Bottom}
        isConnectableStart={false}
        className="opacity-0"
      />
      <button
        type="button"
        aria-label="Add child node"
        onClick={addChild}
        className="nodrag absolute -bottom-3 left-1/2 flex size-6 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full bg-secondary-600 text-base leading-none text-white transition-colors hover:bg-secondary-700"
      >
        +
      </button>
    </div>
  )
}

export default GraphNode
