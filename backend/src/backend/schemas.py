"""Request/response shapes for the graph API, mirroring the frontend's React
Flow graph shape (see frontend-chats/src/graph.ts)."""

from typing import Literal

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
    # Length of the stored embedding vector, not the vector itself. Response-only.
    embeddingDimensions: int | None = None


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str = ""
    bend: Position | None = None
    # Which node handle the edge is attached to (e.g. "+" vs the "↑" reverse-link).
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
    # Humanized whole-graph description for viewing (separate from per-node
    # embedding text). None until "Generate text" has been used.
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
    """One node's embedding input: its id and its humanized text."""

    id: str
    text: str


class GenerateEmbeddingsRequest(BaseModel):
    nodes: list[NodeText]


class GenerateEmbeddingsResponse(BaseModel):
    status: str
    message: str
    count: int
    dimensions: int


class SearchRequest(BaseModel):
    query: str
    limit: int = 5


class RelationshipFact(BaseModel):
    """One edge touching a matched node, read live from Neo4j at search time."""

    relationship: str
    direction: Literal["outgoing", "incoming"]
    otherId: str
    otherName: str


class SearchResultNode(BaseModel):
    id: str
    name: str
    type: str
    description: str | None = None
    properties: list[NodeProperty] = []
    # Cosine similarity between the query and this node, 1.0 = identical.
    score: float
    # The text actually embedded for this node (attributes only).
    embeddingText: str | None = None
    # This node's edges, fetched fresh from Neo4j for this search.
    relationships: list[RelationshipFact] = []


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResultNode]
    # None if there were no results, or the LLM call failed.
    answer: str | None = None
