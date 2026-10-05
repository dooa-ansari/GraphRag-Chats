---
number: 4
slug: making-llm-calls
title: Making LLM calls
navTitle: Making LLM calls
day: 2
minutes: 45
description: Call an LLM from Python in 15 lines with OpenRouter, and learn what messages, roles and temperature do.
---

## The big idea

Calling an LLM is just sending a web request. You send your messages to a web address, and a reply comes back as JSON. That is all an "AI feature" is under the hood.

## Your first call

Save this as `ask.py`:

```python
import os
import requests

API_KEY = os.environ["OPENROUTER_API_KEY"]

response = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "model": "liquid/lfm-2.5-2.6b:free",
        "messages": [
            {"role": "system", "content": "You are a friendly teacher. Answer in two sentences."},
            {"role": "user", "content": "What is a knowledge graph?"},
        ],
        "temperature": 0.7,
    },
    timeout=60,
)
response.raise_for_status()
print(response.json()["choices"][0]["message"]["content"])
```

Run it:

```bash
pip install requests
export OPENROUTER_API_KEY=your-key-here
python ask.py
```

## What each part does

| Part | What it means |
| --- | --- |
| The URL | OpenRouter's chat address. Every model uses the same one. |
| `Authorization` header | Your API key, so OpenRouter knows who is asking. |
| `model` | Which LLM answers. Change this one word to switch models. |
| `messages` | The conversation so far: rules (`system`) and question (`user`). |
| `temperature` | Creativity. 0 gives nearly the same answer every time; around 1 gives more variety. |
| `choices[0].message.content` | Where the reply text sits in the JSON that comes back. |

**When it fails:** a 401 error means the key is wrong. A 429 error means too many requests; free models have limits, so wait a minute and try again. If the model is not found, it has probably been retired; pick a current free model at openrouter.ai/models (see the disclaimer in Chapter 3).

## Where it lives in GraphRAG Chats

`generate_answer` in `backend/src/backend/openrouter_client.py` does exactly this. It uses `httpx` instead of `requests` so the server can do other work while it waits, but the URL, header, model, messages and reply path are the same.

## Practice: make it your own

1. Run `ask.py` and read the answer.
2. Set `temperature` to 0 and run it three times. Then set it to 1.2 and run it three times. Notice the difference.
3. Change the system message to "Answer like a pirate." and run it again.

**You are done when** you can change the model's behaviour just by editing the messages.

## Check yourself

1. Which part of the request picks the model?
2. You get a 429 error. What happened?
3. What does a low temperature do?

<!-- answers -->

1. The `model` field.
2. Too many requests; wait and retry.
3. Makes answers more predictable and repeatable.
