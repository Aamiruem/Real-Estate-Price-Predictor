"""Minimal Ollama client: model status, embeddings and streaming chat."""

import json
import threading
import time
from collections.abc import Iterator
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from . import config

EMBED_BATCH_SIZE = 24


class OllamaError(RuntimeError):
    pass


def _open(path: str, payload: dict | None, timeout: float):
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = Request(
        f"{config.OLLAMA_BASE_URL}{path}",
        data=body,
        headers={"Content-Type": "application/json"} if body is not None else {},
        method="POST" if body is not None else "GET",
    )
    try:
        return urlopen(request, timeout=timeout)
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise OllamaError(f"Ollama returned HTTP {error.code}: {detail}") from error
    except (URLError, TimeoutError, OSError) as error:
        raise OllamaError(
            "Cannot reach Ollama. Start it and make sure it listens at "
            f"{config.OLLAMA_BASE_URL}."
        ) from error


def ollama_request(path: str, payload: dict | None = None, timeout: float | None = None) -> dict:
    with _open(path, payload, timeout or config.OLLAMA_TIMEOUT) as response:
        try:
            result = json.loads(response.read().decode("utf-8"))
        except json.JSONDecodeError as error:
            raise OllamaError("Ollama returned an invalid JSON response.") from error
    if not isinstance(result, dict):
        raise OllamaError("Ollama returned an unexpected response.")
    if result.get("error"):
        raise OllamaError(str(result["error"]))
    return result


def _matches(name: str, wanted: str) -> bool:
    # "qwen2.5:1.5b" matches exactly; "llama3.2" also matches "llama3.2:latest".
    return name == wanted or (":" not in wanted and name.startswith(f"{wanted}:"))


class _StatusCache:
    """Caches Ollama availability briefly so every request doesn't probe it."""

    ttl_seconds = 15.0

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._checked_at = 0.0
        self._value: dict = {}

    def get(self, force: bool = False) -> dict:
        with self._lock:
            if not force and time.monotonic() - self._checked_at < self.ttl_seconds:
                return self._value
            try:
                response = ollama_request("/api/tags", timeout=4)
                models = [
                    model.get("name", "")
                    for model in response.get("models", [])
                    if isinstance(model, dict)
                ]
                value = {
                    "connected": True,
                    "chat_ready": any(_matches(m, config.OLLAMA_CHAT_MODEL) for m in models),
                    "embed_ready": any(_matches(m, config.OLLAMA_EMBED_MODEL) for m in models),
                    "models": models,
                    "detail": "",
                }
            except OllamaError as error:
                value = {
                    "connected": False,
                    "chat_ready": False,
                    "embed_ready": False,
                    "models": [],
                    "detail": str(error),
                }
            self._value, self._checked_at = value, time.monotonic()
            return value


status = _StatusCache()


def embed_texts(texts: list[str]) -> list[list[float]]:
    embeddings: list[list[float]] = []
    for start in range(0, len(texts), EMBED_BATCH_SIZE):
        batch = texts[start : start + EMBED_BATCH_SIZE]
        response = ollama_request(
            "/api/embed",
            {"model": config.OLLAMA_EMBED_MODEL, "input": batch},
        )
        vectors = response.get("embeddings")
        if not isinstance(vectors, list) or len(vectors) != len(batch):
            raise OllamaError("Ollama returned incomplete embeddings.")
        for vector in vectors:
            if not isinstance(vector, list) or not vector:
                raise OllamaError("Ollama returned an invalid embedding.")
            embeddings.append([float(value) for value in vector])
    return embeddings


def chat_stream(messages: list[dict], temperature: float = 0.1) -> Iterator[str]:
    """Yields answer text chunks from Ollama's streaming chat endpoint."""
    payload = {
        "model": config.OLLAMA_CHAT_MODEL,
        "messages": messages,
        "stream": True,
        "options": {"temperature": temperature, "num_ctx": 4096},
    }
    with _open("/api/chat", payload, config.OLLAMA_TIMEOUT) as response:
        for raw_line in response:
            line = raw_line.decode("utf-8").strip()
            if not line:
                continue
            try:
                event = json.loads(line)
            except json.JSONDecodeError as error:
                raise OllamaError("Ollama streamed an invalid response.") from error
            if event.get("error"):
                raise OllamaError(str(event["error"]))
            text = (event.get("message") or {}).get("content", "")
            if text:
                yield text
            if event.get("done"):
                break
