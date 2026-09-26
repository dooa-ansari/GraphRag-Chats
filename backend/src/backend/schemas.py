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
