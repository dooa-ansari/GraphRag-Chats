"""Neo4j connection and the Cypher that persists/reads the graph.

Each save replaces the whole graph with the one the frontend sent, which
matches the "Save graph" button: it always sends every node and edge, not
a diff.
"""

import json
import os

from neo4j import AsyncDriver, AsyncGraphDatabase

from backend.schemas import (
    GraphEdge,
    GraphNode,
    GraphNodeData,
    GraphPayload,
    NodeProperty,
    Position,
)

NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "password")

_driver: AsyncDriver | None = None


def get_driver() -> AsyncDriver:
    global _driver
    if _driver is None:
        _driver = AsyncGraphDatabase.driver(
            NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)
        )
    return _driver


async def close_driver() -> None:
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None


async def verify_connectivity() -> None:
    await get_driver().verify_connectivity()


def _node_params(node: GraphNode) -> dict:
    return {
        "id": node.id,
        "reactFlowType": node.type,
        "positionX": node.position.x,
        "positionY": node.position.y,
        "name": node.data.name,
        "entityType": node.data.type,
        "description": node.data.description,
        # Neo4j properties can't hold a list of maps, so the name/value pairs
        # are stored as a JSON string and decoded again on the way out.
        "propertiesJson": json.dumps([p.model_dump() for p in node.data.properties]),
    }


def _edge_params(edge: GraphEdge) -> dict:
    return {
        "id": edge.id,
        "source": edge.source,
        "target": edge.target,
        "relationship": edge.relationship,
        "bendX": edge.bend.x if edge.bend else None,
        "bendY": edge.bend.y if edge.bend else None,
    }


async def _save_graph_tx(tx, nodes: list[dict], edges: list[dict]) -> None:
    # Replace the previous graph entirely rather than diffing it, since the
    # frontend always sends a full snapshot.
    await tx.run("MATCH (n:GraphNode) DETACH DELETE n")
    await tx.run(
        """
        UNWIND $nodes AS node
        CREATE (n:GraphNode {id: node.id})
        SET n.reactFlowType = node.reactFlowType,
            n.positionX = node.positionX,
            n.positionY = node.positionY,
            n.name = node.name,
            n.entityType = node.entityType,
            n.description = node.description,
            n.propertiesJson = node.propertiesJson
        """,
        nodes=nodes,
    )
    await tx.run(
        """
        UNWIND $edges AS edge
        MATCH (source:GraphNode {id: edge.source})
        MATCH (target:GraphNode {id: edge.target})
        CREATE (source)-[r:RELATES_TO {id: edge.id}]->(target)
        SET r.relationship = edge.relationship,
            r.bendX = edge.bendX,
            r.bendY = edge.bendY
        """,
        edges=edges,
    )


async def save_graph(payload: GraphPayload) -> None:
    node_params = [_node_params(node) for node in payload.nodes]
    edge_params = [_edge_params(edge) for edge in payload.edges]
    async with get_driver().session() as session:
        await session.execute_write(_save_graph_tx, node_params, edge_params)


async def _load_graph_tx(tx) -> GraphPayload:
    node_records = await tx.run(
        """
        MATCH (n:GraphNode)
        RETURN n.id AS id,
               n.reactFlowType AS reactFlowType,
               n.positionX AS positionX,
               n.positionY AS positionY,
               n.name AS name,
               n.entityType AS entityType,
               n.description AS description,
               n.propertiesJson AS propertiesJson
        """
    )
    nodes = [
        GraphNode(
            id=record["id"],
            type=record["reactFlowType"],
            position=Position(x=record["positionX"], y=record["positionY"]),
            data=GraphNodeData(
                name=record["name"],
                type=record["entityType"],
                description=record["description"],
                properties=[
                    NodeProperty(**item)
                    for item in json.loads(record["propertiesJson"] or "[]")
                ],
            ),
        )
        async for record in node_records
    ]

    edge_records = await tx.run(
        """
        MATCH (source:GraphNode)-[r:RELATES_TO]->(target:GraphNode)
        RETURN r.id AS id,
               source.id AS source,
               target.id AS target,
               r.relationship AS relationship,
               r.bendX AS bendX,
               r.bendY AS bendY
        """
    )
    edges = [
        GraphEdge(
            id=record["id"],
            source=record["source"],
            target=record["target"],
            relationship=record["relationship"] or "",
            bend=(
                Position(x=record["bendX"], y=record["bendY"])
                if record["bendX"] is not None and record["bendY"] is not None
                else None
            ),
        )
        async for record in edge_records
    ]

    return GraphPayload(nodes=nodes, edges=edges)


async def load_graph() -> GraphPayload:
    async with get_driver().session() as session:
        return await session.execute_read(_load_graph_tx)
