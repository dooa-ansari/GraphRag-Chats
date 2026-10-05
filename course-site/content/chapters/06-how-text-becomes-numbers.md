---
number: 6
slug: how-text-becomes-numbers
title: How text becomes numbers
navTitle: How text becomes numbers
day: 3
minutes: 40
description: What embeddings are, explained with a tiny two-number example, and how to create real 1024-number embeddings in Python.
---

## The big idea

Computers cannot compare meanings, but they are great at comparing numbers. So we turn each piece of text into a list of numbers, called an **embedding** (or a **vector**). Texts with similar meanings get similar numbers.

Think of it as a map. Every text gets a spot on the map, and texts about the same thing land close together.

## A tiny example

Imagine an embedding with only two numbers: how much a text is about animals, and how much it is about vehicles.

| Text | Animal | Vehicle |
| --- | --- | --- |
| cat | 0.90 | 0.10 |
| kitten | 0.85 | 0.20 |
| car | 0.10 | 0.95 |

"cat" and "kitten" sit close together; "car" sits far away. Real embeddings work the same way, but with hundreds or thousands of numbers, and nobody chooses what each number means. An **embedding model** learns them from huge amounts of text.

## Text to tokens to numbers

1. The text is split into tokens (Chapter 2).
2. The embedding model reads all the tokens together.
3. Out comes one fixed-length list of numbers for the whole text. In GraphRAG Chats that list is 1024 numbers long.

## Try it in Python

```python
import os
import requests

response = requests.post(
    "https://openrouter.ai/api/v1/embeddings",
    headers={"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}"},
    json={"model": "liquid/lfm-2.5-embedding-350m:free", "input": ["cat", "kitten", "car"]},
    timeout=60,
)
response.raise_for_status()
for item in response.json()["data"]:
    vector = item["embedding"]
    print(len(vector), vector[:5])
```

You will see three lines, each saying 1024 followed by the first five numbers.

## Where it lives in GraphRAG Chats

When you click **Generate embeddings**, the app writes a short text for each node (its name, type, description and properties), sends it to the embedding model, and saves the 1024 numbers on the node in Neo4j as `embedding`, next to the text it came from as `embeddingText`.

## Practice: see a real embedding

1. Run the Python example above.
2. Open the Neo4j Browser at http://localhost:7474 and log in as `neo4j` with your `NEO4J_PASSWORD`.
3. Run:

   ```cypher
   MATCH (n:GraphNode) WHERE n.embedding IS NOT NULL
   RETURN n.name, n.embeddingText, size(n.embedding), n.embedding[0..5]
   LIMIT 3
   ```

**You are done when** you can see a node's text and the first numbers of its 1024-number embedding.

## Check yourself

1. What is an embedding, in one sentence?
2. Two texts mean almost the same thing. What do you expect from their embeddings?
3. How many numbers are in each embedding in GraphRAG Chats?

<!-- answers -->

1. A list of numbers that captures what a text means.
2. They are very similar, close together on the map.
3. 1024.
