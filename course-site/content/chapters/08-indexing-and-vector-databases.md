---
number: 8
slug: indexing-and-vector-databases
title: Database indexing and vector databases
navTitle: Indexing and vector databases
day: 3
minutes: 40
description: Why indexes make search fast, B-tree vs vector indexes, and what a vector database like Pinecone, pgvector or Neo4j does.
---

## The big idea

An **index** lets a database find things without reading every row, just like the index at the back of a book lets you jump to the right page. With 50 nodes it does not matter. With 5 million, it is the difference between a millisecond and a minute.

## Two kinds of index

| Kind | Answers questions like | How it works, simply |
| --- | --- | --- |
| Regular index (B-tree) | "Find the user with this email" | Keeps values sorted, like a phone book, so an exact match is found in a few steps. |
| Vector index | "Find the 5 texts closest in meaning to this one" | Groups vectors that are near each other, so a search only checks a small neighbourhood instead of everything. |

A vector index gives an **approximate** answer: it may very rarely miss a close match, in exchange for being hugely faster. For almost every app that trade is worth it.

## What is a vector database?

A database that stores embeddings and has a vector index built in. Popular choices:

- Dedicated vector databases: Pinecone, Qdrant, Weaviate, Chroma.
- Normal databases that added vector search: PostgreSQL with pgvector, and **Neo4j**.

GraphRAG Chats uses Neo4j because it stores the graph and the vectors in one place, so one database can do both the meaning search and the relationship walk.

## Where it lives in GraphRAG Chats

When the backend starts, `ensure_vector_index` in `backend/src/backend/neo4j_client.py` creates the index:

```cypher
CREATE VECTOR INDEX node_embedding_index IF NOT EXISTS
FOR (n:GraphNode) ON (n.embedding)
OPTIONS {indexConfig: {
  `vector.dimensions`: 1024,
  `vector.similarity_function`: 'cosine'
}}
```

In plain words: index the `embedding` of every `GraphNode`, expect 1024 numbers, and compare them with cosine similarity (Chapter 7).

## Practice: find the index

1. Open the Neo4j Browser at http://localhost:7474.
2. Run `SHOW INDEXES` and find `node_embedding_index`. Check that its type is `VECTOR`.
3. Find the search query in `neo4j_client.py`: it starts with `CALL db.index.vector.queryNodes`. That one line is the vector search.

**You are done when** you can point to the index in Neo4j and to the line of code that uses it.

## Check yourself

1. Why does a database need an index?
2. What is the trade-off a vector index makes?
3. Why does GraphRAG Chats use Neo4j instead of a separate vector database?

<!-- answers -->

1. To find things without reading every row.
2. A tiny chance of missing a match, in exchange for big speed.
3. It keeps the graph and the vectors together in one database.
