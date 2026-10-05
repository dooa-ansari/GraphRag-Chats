---
number: 7
slug: similarity-and-vector-search
title: Similarity and vector search
navTitle: Similarity and vector search
day: 3
minutes: 40
description: Cosine similarity and nearest-neighbour search explained with a hand-worked Python example, then tried on a real FAQ graph.
---

## The big idea

Once every text is a list of numbers, "find texts that mean the same thing" becomes "find the closest lists of numbers". This is **vector search**, and it works even when the words are different: *ran out of storage* can find *your disk is full*.

## Measuring closeness: cosine similarity

The most common score is **cosine similarity**. It gives a number from about 0 (unrelated) to 1 (same meaning). You do not need the maths, just the idea: it checks whether two lists of numbers point in the same direction.

Using the toy vectors from Chapter 6:

```python
import math

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    size_a = math.sqrt(sum(x * x for x in a))
    size_b = math.sqrt(sum(y * y for y in b))
    return dot / (size_a * size_b)

cat = [0.90, 0.10]
kitten = [0.85, 0.20]
car = [0.10, 0.95]

print(round(cosine(cat, kitten), 3))  # 0.993, very similar
print(round(cosine(cat, car), 3))     # 0.214, not similar
```

## How a search works

1. Turn the question into an embedding, using the same model as the stored texts.
2. Score the question against every stored embedding.
3. Keep the top few. These are the "nearest neighbours".

## Where it lives in GraphRAG Chats

When you ask a question in the chat panel, the backend embeds your question, asks Neo4j for the most similar nodes, and keeps the top 5 with their scores. Those are the nodes the canvas highlights as **matched**.

## Practice: same meaning, different words

1. Open **Nimbus Cloud Storage FAQs** (embed it first if you have not).
2. Ask: *my storage is full*. Note which nodes light up.
3. Ask: *I ran out of space, what now?* Compare.
4. Ask something unrelated, like *best pizza in town*, and see how weak the matches are.
5. Look at the % match next to each result: that is the cosine similarity. Optional: open http://localhost:8000/docs, try `POST /graphs/{graph_id}/search`, and read the `score` of each result.

**You are done when** two differently worded questions find the same nodes.

## Check yourself

1. What does a cosine similarity close to 1 mean?
2. Why must the question use the same embedding model as the stored texts?
3. Why can vector search find a match with no words in common?

<!-- answers -->

1. The two texts mean nearly the same.
2. Different models make different maps, so their numbers cannot be compared.
3. It compares meanings, not words.
