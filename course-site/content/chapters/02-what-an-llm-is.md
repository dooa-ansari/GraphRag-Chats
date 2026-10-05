---
number: 2
slug: what-an-llm-is
title: What an LLM is
navTitle: What an LLM is
day: 1
minutes: 30
description: Tokens, prompts, context windows and hallucinations, explained for beginners, with the real prompt GraphRAG Chats sends.
---

## The big idea

An LLM (large language model) is a very good guesser of the next word. It has read a huge amount of text, and when you give it some words it predicts what comes next, again and again, until it has written a reply.

It does not look anything up. It writes what sounds right, which is usually, but not always, what is true.

## Four ideas you need

**Tokens.** An LLM reads text in small chunks called tokens. A token is often a whole short word or part of a longer one. In English, 100 tokens is roughly 75 words. Prices and limits are counted in tokens.

**Prompt.** The text you send. Most apps send it as a list of messages, each with a role:

- `system`: the rules ("Be short. Only use the facts I give you.")
- `user`: the question
- `assistant`: the model's reply

**Context window.** The most tokens a model can read in one go: your prompt plus its reply. Anything beyond that, it simply cannot see.

**Hallucination.** When the model confidently writes something false. It happens because the model is guessing what sounds right. The cure used in this course: give the model the real facts inside the prompt, and tell it to say "I don't know" when the facts are missing. That is RAG, coming in Chapter 9.

## Where it lives in GraphRAG Chats

Open `backend/src/backend/openrouter_client.py` and find `generate_answer`. This is the app's whole conversation with the LLM. The system message says:

> You answer questions about a knowledge graph using only the entities given to you as context. Be concise — a few sentences at most. If the context doesn't contain the answer, say so rather than guessing.

The user message holds the facts found in the graph, then the question.

## Practice: read the prompt

1. Open `openrouter_client.py` in any editor.
2. Find the `messages` list inside `generate_answer`.
3. Write down, in your own words, the three rules in the system message.
4. Find the part of the user message that holds the question.

**You are done when** you can explain which line stops the model from making things up.

## Check yourself

1. What does an LLM do at each step while writing a reply?
2. Which two message roles does GraphRAG Chats send?
3. Why can an LLM state something false with confidence?

<!-- answers -->

1. It predicts the next token.
2. `system` and `user`.
3. It writes what sounds likely, not what it has checked.
