---
number: 10
slug: knowledge-graphs-and-neo4j
title: Knowledge graphs and Neo4j
navTitle: Knowledge graphs and Neo4j
day: 4
minutes: 60
description: Nodes, relationships and properties explained simply, plus a two-minute intro to Cypher queries in Neo4j.
---

## The big idea

A **knowledge graph** stores facts as things and the links between them. Instead of a sentence like "James is Emily's father", you store two **nodes** (James, Emily) and one **relationship** (James → Father → Emily).

Because the links are stored directly, you can follow them: from Emily to her father, from her father to his parents, and so on.

## Three building blocks

| Block | What it is | Example |
| --- | --- | --- |
| Node | A thing | Emily Smith |
| Relationship | A labelled, one-way link between two nodes | James → Father → Emily |
| Property | A detail stored on a node | age: 12 |

## Talking to Neo4j: Cypher in two minutes

Neo4j is a graph database. You ask it questions in **Cypher**, which draws the pattern you want with brackets and arrows:

- `(a)` is a node, `-[r]->` is a relationship.
- `MATCH` describes the pattern to find, `RETURN` says what to show.

```cypher
MATCH (a:GraphNode)-[r:RELATES_TO]->(b:GraphNode)
RETURN a.name, r.relationship, b.name
LIMIT 10
```

Read it as: find any node linked to another node, and show both names and the link's label.

## Where it lives in GraphRAG Chats

Every graph you draw is saved in Neo4j like this:

- One `SavedGraph` node holds the graph's name.
- It links to each of your boxes with `HAS_NODE`. Each box is a `GraphNode` with a name, type, description and properties.
- Your arrows are `RELATES_TO` relationships, with your label stored as `relationship`.

The Cypher lives in `backend/src/backend/neo4j_client.py`.

## Practice: build and query your own graph

1. On the graphs page, click **+ New graph** and name it *My team*.
2. Add four nodes: three people and one project. Use Add node for the first one and the + on a node for the rest. Give each a type (Person, Project) and a one-line description.
3. Connect them with labelled arrows, such as *Works on* and *Manages*.
4. Click **Save graph**.
5. In the Neo4j Browser, run:

   ```cypher
   MATCH (g:SavedGraph {name: 'My team'})-[:HAS_NODE]->(a)-[r:RELATES_TO]->(b)
   RETURN a.name, r.relationship, b.name
   ```

**You are done when** Neo4j lists the same links you drew on the canvas.

## Check yourself

1. Name the three building blocks of a graph.
2. In Cypher, what does `-[r]->` stand for?
3. Where does the app store the label you type on an arrow?

<!-- answers -->

1. Nodes, relationships and properties.
2. A relationship going from one node to another.
3. In the `relationship` property of a `RELATES_TO` relationship.
