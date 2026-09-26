"""Request/response shapes for the graph API.

These mirror the JSON the frontend's "Save graph" button produces
(see frontend-chats/src/App.tsx `saveGraph`), so the payload can be
passed straight through to Neo4j without reshaping it first.
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


class GraphPayload(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class SaveGraphResponse(BaseModel):
    message: str
    status: str
    nodes: int
    edges: int
