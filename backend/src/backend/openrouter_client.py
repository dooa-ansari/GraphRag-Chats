"""Client for OpenRouter's OpenAI-compatible embeddings API.

https://openrouter.ai/docs/api_reference/embeddings
"""

import os

import httpx

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Free-tier text embedding model, up to 512 tokens of input.
EMBEDDING_MODEL = "liquid/lfm-2.5-embedding-350m:free"
EMBEDDING_DIMENSIONS = 1024


class OpenRouterError(RuntimeError):
    """Raised when OpenRouter can't be reached, rejects the key, or returns an
    unexpected response shape."""


async def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """One batched call for all of `texts`, returned in the same order — not
    one call per text, so embedding a whole graph's nodes costs a single
    request."""
    if not texts:
        return []
    if not OPENROUTER_API_KEY:
        raise OpenRouterError("OPENROUTER_API_KEY is not set on the backend")

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{OPENROUTER_BASE_URL}/embeddings",
                headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
                json={"model": EMBEDDING_MODEL, "input": texts},
            )
        except httpx.HTTPError as error:
            raise OpenRouterError(f"Failed to reach OpenRouter: {error}") from error

    if response.status_code != 200:
        raise OpenRouterError(
            f"OpenRouter returned {response.status_code}: {response.text}"
        )

    body = response.json()
    try:
        # Sorted by index rather than trusted to already be in request order.
        items = sorted(body["data"], key=lambda item: item["index"])
        embeddings = [item["embedding"] for item in items]
    except (KeyError, TypeError) as error:
        raise OpenRouterError(
            f"Unexpected response shape from OpenRouter: {body}"
        ) from error

    if len(embeddings) != len(texts):
        raise OpenRouterError(
            f"Expected {len(texts)} embeddings back, got {len(embeddings)}"
        )
    return embeddings
