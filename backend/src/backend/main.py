from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from backend import neo4j_client
from backend.schemas import GraphPayload, SaveGraphResponse


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


@app.post("/save-graph", response_model=SaveGraphResponse)
async def save_graph(payload: GraphPayload):
    await neo4j_client.save_graph(payload)
    return SaveGraphResponse(
        message="Graph saved successfully",
        status="success",
        nodes=len(payload.nodes),
        edges=len(payload.edges),
    )


@app.get("/graph", response_model=GraphPayload)
async def get_graph():
    return await neo4j_client.load_graph()
