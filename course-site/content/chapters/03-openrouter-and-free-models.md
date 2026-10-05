---
number: 3
slug: openrouter-and-free-models
title: OpenRouter and free models
navTitle: OpenRouter and free models
day: 1
minutes: 50
description: What OpenRouter is, how to get an API key, and how to use free LLMs and embedding models in your own projects.
---

## The big idea

There are hundreds of LLMs from many companies, each with its own website, account and bill. **OpenRouter** is one door to all of them: one account, one API key, one way of calling. Change one word (the model name) and you are talking to a different model.

## Free and paid models

- **Free models** have `:free` at the end of their name, for example `liquid/lfm-2.5-2.6b:free`. They cost nothing but have daily request limits and can be slower or busier. Some free providers may keep your prompts, so never send private data to them.
- **Paid models**, such as GPT from OpenAI or Claude from Anthropic, are usually stronger. You add a little credit to your OpenRouter account and pay per token used. For learning, a few dollars goes a long way.

This course uses free models everywhere, so you can finish it without paying anything. Browse all models at [openrouter.ai/models](https://openrouter.ai/models).

> **Disclaimer about the models in this course.** GraphRAG Chats and the examples in this course use `liquid/lfm-2.5-2.6b:free` for answers and `liquid/lfm-2.5-embedding-350m:free` for embeddings. Free models are often retired or renamed, so these may no longer exist when you read this. Always check [openrouter.ai/models](https://openrouter.ai/models) for current free models, and swap in a new name wherever the course uses one. If you change the embedding model, pick one that returns 1024 numbers, or change the vector index size to match (Chapter 8).

## Where it lives in GraphRAG Chats

At the top of `backend/src/backend/openrouter_client.py` you will find two lines that pick the models:

```python
EMBEDDING_MODEL = "liquid/lfm-2.5-embedding-350m:free"
CHAT_MODEL = "liquid/lfm-2.5-2.6b:free"
```

The first turns text into numbers (Chapter 6). The second writes the answers.

## Practice: switch on the AI features

1. Sign up at [openrouter.ai](https://openrouter.ai) and create a key at [openrouter.ai/keys](https://openrouter.ai/keys).
2. Paste it into `.env` after `OPENROUTER_API_KEY=`. Never share this key or commit it to Git.
3. Restart the app: `docker compose down`, then `docker compose up`.
4. Open **Grocery Store Catalog** and click **Generate embeddings**.
5. Click Search to open the chat panel and ask: *chocolate protein bar without any sugar*.
6. Now ask something the graph cannot know, like *what is the shop's phone number?*

**You are done when** step 5 gives an answer with highlighted nodes, and step 6 says the answer is not in the graph.

## Check yourself

1. What does OpenRouter give you that calling each company directly does not?
2. How can you tell a model is free?
3. Why should you keep your API key out of Git?

<!-- answers -->

1. One key and one way of calling for hundreds of models.
2. Its name ends in `:free`.
3. Anyone who finds it can use it, and for paid models, spend your money.
