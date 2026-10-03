"""Request/response shapes for the graph API.

The node/edge shapes mirror the JSON the frontend's React Flow graph builds
(see frontend-chats/src/graph.ts), so a payload can be passed straight
through to Neo4j, and a loaded graph passed straight back, without
reshaping it on either side.
"""

from pydantic import BaseModel


class Position(BaseModel):
    x: float
    y: float


class NodeProperty(BaseModel):
    name: str
    value: str


class GraphNodeData(BaseModel):
    name: str
    type: str
    description: str | None = None
    properties: list[NodeProperty] = []


class GraphNode(BaseModel):
    id: str
    type: str
    position: Position
    data: GraphNodeData
    # Length of this node's stored embedding vector, not the vector itself —
    # enough to show "embedded" state without pulling ~1024 floats per node on
    # every graph load. Response-only: ignored (and not required) on save.
    embeddingDimensions: int | None = None


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str = ""
    bend: Position | None = None
    # Which of a node's handles the edge is attached to (e.g. the "+" button vs
    # the reverse-link "↑" button). Needed to redraw a loaded edge the same way
    # it looked when it was saved.
    sourceHandle: str | None = None
    targetHandle: str | None = None


class GraphPayload(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class SaveGraphRequest(GraphPayload):
    name: str


class NamedGraphPayload(GraphPayload):
    id: str
    name: str
    # The "humanized" natural-language description generated client-side from
    # this graph's nodes/edges, meant for viewing — separate from the per-node
    # embedding text below. None until "Generate text" has been used at least once.
    text: str | None = None


class SaveGraphResponse(BaseModel):
    message: str
    status: str
    id: str
    name: str
    nodes: int
    edges: int


class SavedGraphSummary(BaseModel):
    id: str
    name: str
    updatedAt: str
    nodes: int
    edges: int


class SaveTextRequest(BaseModel):
    text: str


class SaveTextResponse(BaseModel):
    status: str
    message: str


class NodeText(BaseModel):
    """One node's embedding input — its id (to write the result back to the
    right :GraphNode) and its humanized text (built client-side from that
    node's own name/type/description/properties, same rules as "Generate
    text" but per-node instead of for the whole graph)."""

    id: str
    text: str


class GenerateEmbeddingsRequest(BaseModel):
    nodes: list[NodeText]


class GenerateEmbeddingsResponse(BaseModel):
    status: str
    message: str
    count: int
    dimensions: int
