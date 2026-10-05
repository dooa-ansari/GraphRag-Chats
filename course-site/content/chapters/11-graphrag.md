---
number: 11
slug: graphrag
title: GraphRAG
navTitle: GraphRAG
day: 5
minutes: 60
description: How GraphRAG adds graph traversal to RAG to answer multi-hop questions that plain vector search misses, with a family tree example.
---

## The big idea

GraphRAG is RAG plus one extra step: after vector search finds the matching nodes, it **follows their relationships** in the graph and adds those connected facts to the prompt.

Plain RAG finds things that *look like* your question. GraphRAG also finds things that are *connected to* what it found.

## The five steps

1. Turn the question into an embedding.
2. Vector search finds the closest nodes. These are the **matched** nodes.
3. Walk the graph: read every relationship touching those nodes. The nodes at the other end are the **traversed** nodes.
4. Write the matched nodes and their relationships into the prompt.
5. The LLM answers from those facts only.

<!-- diagram:graphrag -->

## Why it beats plain RAG: an example

Ask the Smith Family Tree: *who is the grandfather of Emily?*

Emily's node says: "James and Linda's eldest daughter; loves painting." Nothing about a grandfather. Plain RAG would find Emily and stop, so the LLM could only guess.

GraphRAG finds Emily, then walks her relationships and adds lines like these to the prompt:

```text
- Emily Smith ... James and Linda's eldest daughter; loves painting.
  James Smith Father Emily Smith.
  Robert Smith Grandfather Emily Smith.
```

Now the answer is right there: Robert Smith. The fact was never in Emily's text. It was in the link.

## Where it lives in GraphRAG Chats

In `search_graph` (`backend/src/backend/main.py`), step 3 is `_attach_relationships`, which calls `get_node_relationships` in `neo4j_client.py`. It reads the links fresh from Neo4j at question time, so if you add a new arrow, the very next question can use it without re-embedding. `_format_context` then writes the lines you saw above.

On the canvas, matched nodes and traversed nodes are highlighted differently, so you can see exactly which facts the answer came from.

## Practice: watch the graph walk

1. Open **Smith Family Tree** and make sure it has embeddings.
2. Click **Search** and ask: *who is the grandfather of Emily?*
3. Look at the canvas: which node was matched, and which were traversed?
4. Now add a new node, *Rex*, type *Pet*, and an arrow *Emily → Owns → Rex*. Save, then generate embeddings so Rex can be found.
5. Ask: *what is the name of Emily's pet?*

**You are done when** the answer uses a fact that only exists as an arrow.

## Check yourself

1. What extra step does GraphRAG add to RAG?
2. What is the difference between matched and traversed nodes?
3. Why could plain RAG fail on the grandfather question?

<!-- answers -->

1. Following the relationships of the matched nodes.
2. Matched nodes were found by meaning; traversed nodes were reached by following links.
3. The fact sits in a relationship, not in Emily's own text.
