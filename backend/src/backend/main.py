from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from backend import neo4j_client
from backend.schemas import (
    NamedGraphPayload,
    SaveGraphRequest,
    SaveGraphResponse,
    SavedGraphSummary,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
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
