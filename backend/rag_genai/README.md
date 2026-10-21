# EstateIQ agentic RAG assistant

A local AI assistant for EstateIQ. For each question it:

1. **Plans** — detects cities, localities, property type, BHK and area, and
   decides which tools the question needs (estimate, statistics, comparison,
   key factors). Follow-ups like "And villas there?" reuse the previous
   location and are **rewritten** into a standalone question.
2. **Acts** — runs tools on real project data:
   - `market_stats` and `compare_markets` over `data/property_data.csv`
   - `estimate_price` with the trained model `model/model.pkl`
   - `model_factors` from the model's feature importance
3. **Retrieves** — hybrid search of `knowledge_base/` (BM25 keywords fused with
   `nomic-embed-text` embeddings via reciprocal rank fusion).
4. **Answers** — a local Ollama model writes a short answer from the numbered
   context with source markers, streamed token by token.
5. **Self-checks** — every figure in the answer is verified against the tool
   data; unsupported figures replace the answer with a verified data answer.

If Ollama is not running, steps 1–3 still work and the answer is built
directly from the tool results ("data mode"). Nothing is sent to a hosted AI
provider.

## Requirements

- Python 3.12 (the `backend/.venv312` environment already has every package)
- [Ollama](https://ollama.com) running at `http://localhost:11434` with:

```powershell
ollama pull qwen2.5:1.5b
ollama pull nomic-embed-text
```

`qwen2.5:1.5b` answers in roughly 10–30 seconds on a CPU-only laptop. On a
faster machine set `OLLAMA_CHAT_MODEL=qwen2.5:3b` (or `llama3.2`) in `.env` for
better wording.

## Run (PowerShell, from the `backend` folder)

```powershell
Copy-Item rag_genai\.env.example rag_genai\.env   # first time only
.venv312\Scripts\python.exe -m uvicorn rag_genai.app.main:app --port 8002
```

Or with its own environment:

```powershell
py -3.12 -m venv rag_genai\.venv
rag_genai\.venv\Scripts\pip install -r rag_genai\requirements.txt
rag_genai\.venv\Scripts\python.exe -m uvicorn rag_genai.app.main:app --port 8002
```

Open **AI Assistant** in EstateIQ. In development the frontend reaches this
service through the Vite proxy at `/ai`.

## API

- `GET /health` — `ready`, `degraded` (no Ollama, data mode) or `unavailable`
- `POST /chat` — `{ "message": "...", "history": [...] }` → answer, steps, sources, cards
- `POST /chat/stream` — same input; streams NDJSON events
  `step`, `sources`, `data`, `token`, `done` (or `error`)

## Knowledge base

Add Markdown files to `knowledge_base/`. Documents are split by `##`
headings; restart the service to re-index.

## Test

```powershell
.venv312\Scripts\python.exe -m unittest rag_genai.tests.test_rag
```
