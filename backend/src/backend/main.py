import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

logger = logging.getLogger(__name__)

from backend import neo4j_client, openrouter_client
from backend.schemas import (
    GenerateEmbeddingsRequest,
    GenerateEmbeddingsResponse,
    NamedGraphPayload,
    SaveGraphRequest,
    SaveGraphResponse,
    SavedGraphSummary,
    SaveTextRequest,
    SaveTextResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Best-effort: if Neo4j isn't reachable yet, don't crash startup over it —
    # /health already reports that degraded state, and every write path below
    # works fine without the index (it just makes vector search possible).
    try:
        await neo4j_client.ensure_vector_index()
    except Exception:
        logger.warning("Could not ensure the vector index on startup", exc_info=True)
    yield
    await neo4j_client.close_driver()


app = FastAPI(lifespan=lifespan)


@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI"}


@app.get("/health")
async def health_check():
    try:
        await neo4j_client.verify_connectivity()
    except Exception as error:
        raise HTTPException(
            status_code=503, detail=f"Neo4j unavailable: {error}"
        ) from error
    return {"status": "ok", "neo4j": "connected"}


@app.post("/graphs", response_model=SaveGraphResponse)
async def save_graph(payload: SaveGraphRequest):
    if not payload.name.strip():
        raise HTTPException(status_code=422, detail="Graph name is required")
    summary = await neo4j_client.save_graph(payload)
    return SaveGraphResponse(
        message="Graph saved successfully",
        status="success",
        id=summary.id,
        name=summary.name,
        nodes=summary.nodes,
        edges=summary.edges,
    )


@app.get("/graphs", response_model=list[SavedGraphSummary])
async def list_graphs():
    return await neo4j_client.list_graphs()


@app.get("/graphs/{graph_id}", response_model=NamedGraphPayload)
async def get_graph(graph_id: str):
    graph = await neo4j_client.get_graph(graph_id)
    if graph is None:
        raise HTTPException(status_code=404, detail="Graph not found")
    return graph


@app.put("/graphs/{graph_id}/text", response_model=SaveTextResponse)
async def save_graph_text(graph_id: str, payload: SaveTextRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=422, detail="Text is required")
    found = await neo4j_client.save_graph_text(graph_id, payload.text)
    if not found:
        raise HTTPException(status_code=404, detail="Graph not found")
    return SaveTextResponse(status="success", message="Text saved")


@app.post("/graphs/{graph_id}/embeddings", response_model=GenerateEmbeddingsResponse)
async def generate_embeddings(graph_id: str, payload: GenerateEmbeddingsRequest):
    if not payload.nodes:
        raise HTTPException(status_code=422, detail="No nodes to embed")

    # One batched request for every node's text, not one request per node.
    texts = [node.text for node in payload.nodes]
    try:
        embeddings = await openrouter_client.generate_embeddings(texts)
    except openrouter_client.OpenRouterError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    node_ids = [node.id for node in payload.nodes]
    found = await neo4j_client.save_node_embeddings(graph_id, node_ids, embeddings)
    if not found:
        raise HTTPException(status_code=404, detail="Graph not found")

    return GenerateEmbeddingsResponse(
        status="success",
        message=f"Generated embeddings for {len(embeddings)} node(s)",
        count=len(embeddings),
        dimensions=len(embeddings[0]),
    )
