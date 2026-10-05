---
number: 12
slug: capstone
title: Capstone, your own GraphRAG
navTitle: Capstone
day: 5
minutes: 90
description: Build a GraphRAG knowledge graph about your CV, a book or a hobby, test it with ten questions, and fix wrong answers.
---

## The goal

Build a graph about something you know well, then prove it can answer real questions. This is the piece you can show in a portfolio or a job interview.

## Pick a topic

Choose something with clear things and clear links between them. Some ideas:

- **Your CV:** you, your jobs, skills, projects and the tools each project used.
- **A book or series:** characters, places, and who is related to whom.
- **A hobby:** recipes and ingredients, a football team and its players, plants and their care needs.

## Build it in six steps

1. Click **+ New graph** and give it a name.
2. Add 15 to 30 nodes. Give each a type, a one-line description and a few properties.
3. Connect them with clear labels: *Worked at*, *Used*, *Friend of*, *Needs*.
4. Click **Save graph**, then **Generate embeddings**.
5. Write 10 questions: 5 that one node can answer, and 5 that need a relationship.
6. Ask all 10, and note which were right, which were wrong, and why.

## When an answer is wrong

| What you see | Likely cause | Fix |
| --- | --- | --- |
| The wrong nodes are matched | Node descriptions are too short or vague | Write clearer descriptions, then regenerate embeddings |
| The right node is matched, but the answer misses a fact | The link is missing or badly labelled | Add or rename the relationship |
| The facts are there but the answer is clumsy | The model is too small | Try another free model, or a paid one (Chapter 5) |

## You did it

In 5 days you have called an LLM from Python, turned text into numbers, searched by meaning, used a vector index, built RAG by hand, and run a working GraphRAG app on your own data. That is the core toolkit of Applied AI.

## Keep going with GraphRAG Chats

The app is open source at [github.com/dooa-ansari/GraphRag-Chats](https://github.com/dooa-ansari/GraphRag-Chats). Star it, read the code, and try one of these next challenges:

- Follow relationships two steps instead of one.
- Turn a pasted paragraph of text into nodes and relationships automatically, using an LLM.
- Add a setting to pick the chat model from the screen.

**You are done when** your graph answers at least 8 of your 10 questions correctly.
