---
number: 1
slug: welcome
title: Welcome to Applied AI
navTitle: Welcome
day: 1
minutes: 40
description: Why applied AI skills matter, why GraphRAG beats plain RAG, and how to get the GraphRAG Chats practice app running.
---

## Why take this course?

AI is everywhere now: in search, email, shopping, support chats and the tools you code with. There is no avoiding it. Companies now expect developers to know how to plug an LLM into a product, the same way they expect you to know databases and APIs.

The good news: you do not need a maths degree. You need a handful of ideas and some hands-on practice. That is exactly what the next 5 days give you, about 2 hours a day, ending with a working AI app on your own machine.

**Why graphs, not just regular RAG?** Most AI apps today use plain RAG: they find text that looks similar to your question and hand it to the LLM. That works for simple lookups, but it misses facts that are connected rather than similar.

Ask a library app for *a fantasy novel by an award-winning author*. The book's text says "fantasy". The author's text says "award". No single piece of text says both, so plain RAG can miss it. GraphRAG finds the book, then follows the arrow from the book to its author and reads the award there. It answers questions that need two or three steps, and it shows you exactly which facts it used. That is the skill that sets you apart, and it is what you will build by Day 5.

## The big idea

Applied AI means using ready-made AI models to build useful things. You do not train or invent a model. You plug one in, the same way you plug in a database or a payment service.

In this course you learn the handful of ideas you need, and you see each one working inside a real app: **GraphRAG Chats**.

## What GraphRAG Chats does

You draw a small map of facts as boxes and arrows (people in a family, products in a shop, books in a library). Then you ask it a question in plain English. Behind the scenes it does four things:

1. Turns your question into numbers.
2. Finds the boxes (nodes) whose meaning is closest to your question.
3. Follows the arrows (relationships) from those boxes to collect related facts.
4. Asks an LLM to write a short answer using only those facts.

<!-- diagram:app -->

By Day 5 you will understand every one of those steps.

## Words you will meet

| Word | Plain meaning | Chapter |
| --- | --- | --- |
| LLM | A program that reads text and writes text back, like ChatGPT | 2 |
| Prompt | The text you send to an LLM | 2 |
| Embedding | A piece of text turned into a list of numbers that captures its meaning | 6 |
| Vector database | A database that can find the closest lists of numbers quickly | 8 |
| RAG | Find the right facts first, then let the LLM answer from them | 9 |
| Graph | Facts stored as nodes connected by relationships | 10 |
| GraphRAG | RAG that also follows the relationships in a graph | 11 |

## Practice: get the app running

You need Git and Docker Desktop installed.

1. Download the project and make your settings file:

   ```bash
   git clone https://github.com/dooa-ansari/GraphRag-Chats.git
   cd GraphRag-Chats
   cp .env.example .env
   ```

2. Open `.env` and change `NEO4J_PASSWORD` to a password only you know. Leave `OPENROUTER_API_KEY` empty for now; you add it in Chapter 3.
3. Start everything with `docker compose up --build`. The first run downloads a lot, so give it a few minutes.
4. Open http://localhost:3000 in your browser. You should see six example graphs.
5. Open **Smith Family Tree**. Drag a few nodes around, click one to see its details, then click **Generate text** to see the graph written as plain sentences.

**You are done when** the family tree is on your screen.

## Check yourself

1. In one sentence, what makes AI "applied"?
2. When you ran `docker compose up`, which three parts started?
3. Why should you change `NEO4J_PASSWORD`?

<!-- answers -->

1. You build something useful with a model that already exists.
2. The web app, the backend API and the Neo4j database.
3. The app has no login of its own, so that password is what protects your data.
