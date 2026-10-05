---
number: 5
slug: choosing-an-llm
title: Choosing an LLM
navTitle: Choosing an LLM
day: 2
minutes: 45
description: How to pick the right LLM for a job, read model names, and decide between free models and paid ones like GPT or Claude.
---

## The big idea

There is no single best LLM. There is the best one for your job. Pick by asking five questions, then test two or three models on your real questions.

## Five questions to ask

| Question | What to look for |
| --- | --- |
| Is it good enough? | Try your real questions. Bigger models usually answer better. |
| Is it fast enough? | Small models reply quicker. Users notice a slow chat. |
| What does it cost? | Free models cost nothing. Paid ones charge per million tokens. |
| How much can it read? | The context window. Bigger lets you send more facts. |
| Where does my data go? | Free providers may keep prompts. Use a trusted paid model for private data. |

**Reading a model name:** in `liquid/lfm-2.5-2.6b:free`, `liquid` is the company, `lfm-2.5` is the model family, `2.6b` means 2.6 billion parameters (its size) and `:free` means it costs nothing.

## Free or paid?

- **Start free.** Free models are perfect for learning and for simple tasks, like this app's short grounded answers.
- **Move to paid when free is not good enough.** Paid models such as GPT (OpenAI) or Claude (Anthropic) follow instructions better, reason better and are more reliable. On OpenRouter you only change the `model` name and add credit; your code stays the same.

A simple rule: use the smallest, cheapest model that gives answers you are happy with.

## Where it lives in GraphRAG Chats

The app picks its answer model in one line of `backend/src/backend/openrouter_client.py`:

```python
CHAT_MODEL = "liquid/lfm-2.5-2.6b:free"
```

It uses a small free model because its job is easy: the graph supplies the facts, and the model only has to write a few clear sentences.

## Practice: a model taste test

1. On [openrouter.ai/models](https://openrouter.ai/models), find another free chat model and copy its name.
2. Open **Nimbus Cloud Storage FAQs** and ask: *I'm on the free plan and ran out of storage, can I still share links that don't expire?* Note the answer.
3. Change `CHAT_MODEL` to your new model and save the file. The app reloads by itself; if it does not, restart it.
4. Ask the same question again and compare.

**You are done when** you can say which model answered better, and why.

## Check yourself

1. What does `2.6b` in a model name tell you?
2. When should you switch from a free model to a paid one?
3. Why is a small model fine for this app's answers?

<!-- answers -->

1. Its size: 2.6 billion parameters.
2. When free answers are not good enough, or the data is private.
3. The graph gives it the facts, so it only has to write them up.
