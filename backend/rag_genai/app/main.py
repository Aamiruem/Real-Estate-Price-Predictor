import json
from typing import Annotated, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator

from . import config, llm
from .agent import agent
from .tools import property_data

app = FastAPI(
    title="EstateIQ Agentic RAG Assistant",
    description=(
        "Plans each question, runs dataset and price-model tools, retrieves "
        "guide passages (hybrid BM25 + embeddings) and answers with a local "
        "Ollama model, citing sources."
    ),
    version="2.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.FRONTEND_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class Turn(BaseModel):
    role: Literal["user", "assistant"]
    content: Annotated[str, Field(max_length=4000)]


class ChatRequest(BaseModel):
    message: Annotated[str, Field(min_length=1, max_length=2000)]
    history: Annotated[list[Turn], Field(max_length=12)] = []

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        message = value.strip()
        if not message:
            raise ValueError("Message cannot be blank.")
        return message


def _history(request: ChatRequest) -> list[dict]:
    return [turn.model_dump() for turn in request.history]


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "EstateIQ Agentic RAG Assistant", "docs": "/docs"}


@app.get("/health")
def health() -> dict:
    status = llm.status.get(force=True)
    try:
        tools_ready = bool(len(property_data.frame)) and property_data.model is not None
        tools_detail = ""
    except Exception as error:  # noqa: BLE001 - report any data/model load issue
        tools_ready, tools_detail = False, f"Dataset or model unavailable: {error}"

    if status["chat_ready"] and status["embed_ready"] and tools_ready:
        overall = "ready"
    elif tools_ready:
        # Tools and keyword retrieval still work; answers are built without the LLM.
        overall = "degraded"
    else:
        overall = "unavailable"

    missing = [
        name
        for name, ready in (
            (config.OLLAMA_CHAT_MODEL, status["chat_ready"]),
            (config.OLLAMA_EMBED_MODEL, status["embed_ready"]),
        )
        if status["connected"] and not ready
    ]
    if not status["connected"]:
        detail = "Ollama is not running, so answers are built directly from the data tools."
    elif missing:
        detail = "Missing Ollama models: " + ", ".join(missing) + ". Run: ollama pull " + " && ollama pull ".join(missing)
    else:
        detail = tools_detail

    return {
        "status": overall,
        "ollama_connected": status["connected"],
        "chat_model": config.OLLAMA_CHAT_MODEL,
        "embedding_model": config.OLLAMA_EMBED_MODEL,
        "chat_model_available": status["chat_ready"],
        "embedding_model_available": status["embed_ready"],
        "tools_ready": tools_ready,
        "knowledge_chunks": len(agent.index.chunks),
        "detail": detail,
    }


@app.post("/chat")
def chat(request: ChatRequest) -> dict:
    steps, final = [], None
    try:
        for event in agent.run(request.message, _history(request)):
            if event["type"] == "step":
                steps.append({"tool": event["tool"], "label": event["label"]})
            elif event["type"] == "done":
                final = event
    except Exception as error:  # noqa: BLE001 - surface a clean API error
        raise HTTPException(status_code=500, detail=f"The assistant failed: {error}") from error

    if not final or not final["answer"]:
        raise HTTPException(status_code=502, detail="The assistant returned an empty answer.")
    return {
        "answer": final["answer"],
        "mode": final["mode"],
        "sources": final["sources"],
        "cards": final["cards"],
        "steps": steps,
    }


@app.post("/chat/stream")
def chat_stream(request: ChatRequest) -> StreamingResponse:
    """Streams newline-delimited JSON events: step, sources, data, token, done."""
    history = _history(request)

    def events():
        try:
            for event in agent.run(request.message, history):
                yield json.dumps(event, ensure_ascii=False) + "\n"
        except Exception as error:  # noqa: BLE001 - report mid-stream failures
            yield json.dumps({"type": "error", "detail": f"The assistant failed: {error}"}) + "\n"

    return StreamingResponse(
        events(),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
