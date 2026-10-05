---
number: 9
slug: rag
title: RAG, retrieve then answer
navTitle: RAG
day: 4
minutes: 60
description: Build a complete Retrieval-Augmented Generation (RAG) loop in about 40 lines of Python, and learn where plain RAG goes wrong.
---

## The big idea

An LLM only knows what it learned in training. It has never seen your shop's return policy or your family tree. **RAG** (Retrieval-Augmented Generation) fixes that in three steps:

1. **Retrieve:** find the facts that match the question (vector search, Chapter 7).
2. **Augment:** paste those facts into the prompt.
3. **Generate:** let the LLM answer using only those facts.

Like an open-book exam: the model does not need to remember, it just needs the right page in front of it.

<!-- diagram:rag -->

## A complete RAG in about 40 lines

```python
import math
import os
import requests

URL = "https://openrouter.ai/api/v1"
HEADERS = {"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}"}

facts = [
    "The shop opens at 9am and closes at 6pm.",
    "Returns are accepted within 30 days with a receipt.",
    "Delivery is free on orders over 50 euros.",
]
question = "Can I send something back after two weeks?"

def embed(texts):
    r = requests.post(f"{URL}/embeddings", headers=HEADERS, timeout=60,
                      json={"model": "liquid/lfm-2.5-embedding-350m:free", "input": texts})
    r.raise_for_status()
    return [item["embedding"] for item in r.json()["data"]]

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    return dot / (math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b)))

# 1. Retrieve: the fact closest in meaning to the question
fact_vectors = embed(facts)
question_vector = embed([question])[0]
best = max(range(len(facts)), key=lambda i: cosine(question_vector, fact_vectors[i]))

# 2. Augment: put that fact in the prompt
prompt = f"Facts:\n{facts[best]}\n\nQuestion: {question}"

# 3. Generate
r = requests.post(f"{URL}/chat/completions", headers=HEADERS, timeout=60, json={
    "model": "liquid/lfm-2.5-2.6b:free",
    "messages": [
        {"role": "system", "content": "Answer using only the facts. If they do not contain the answer, say so."},
        {"role": "user", "content": prompt},
    ],
})
r.raise_for_status()
print("Used fact:", facts[best])
print("Answer:", r.json()["choices"][0]["message"]["content"])
```

No words match between "send something back" and "Returns", yet the right fact is found. That is vector search doing its job.

## Where RAG goes wrong

- **Wrong facts retrieved:** the answer can only be as good as what was found.
- **Facts spread across pieces:** if the answer needs two facts that are not similar to each other, plain RAG often finds only one. Chapter 11 fixes this with a graph.

## Where it lives in GraphRAG Chats

The `search_graph` function in `backend/src/backend/main.py` is the app's RAG loop:

1. Retrieve: `generate_embeddings` turns your question into numbers, and `search_graph_nodes` finds the closest nodes.
2. Augment: `_format_context` writes those nodes as text.
3. Generate: `generate_answer` asks the LLM, using the prompt you read in Chapter 2.

## Practice: build and break a RAG

1. Run the script above and check which fact it used.
2. Change the question to *Is delivery free for a 20 euro order?* and run it again.
3. Change it to *Do you sell gift cards?* The answer should say the facts do not cover it.
4. Open `search_graph` in `main.py` and find the three steps.

**You are done when** you can name the three RAG steps in both your script and the app.

## Check yourself

1. What do the letters R, A and G stand for?
2. Why does RAG reduce made-up answers?
3. When does plain RAG struggle?

<!-- answers -->

1. Retrieval, Augmented, Generation.
2. The model answers from facts you give it, and is told to admit when they are missing.
3. When the answer needs several facts that are not similar to the question or to each other.
