import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BASE_DIR.parent

load_dotenv(BASE_DIR / ".env")

KNOWLEDGE_DIR = BASE_DIR / "knowledge_base"
DATA_PATH = Path(
    os.getenv(
        "PROPERTY_DATA_PATH",
        PROJECT_DIR / "ml_backend" / "data" / "property_data.csv",
    )
)
MODEL_PATH = Path(
    os.getenv(
        "PRICE_MODEL_PATH",
        PROJECT_DIR / "ml_backend" / "model" / "model.pkl",
    )
)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
# A 1.5B model keeps CPU-only answers responsive; override in .env if the
# machine can run a larger one (e.g. llama3.2 or qwen2.5:7b).
OLLAMA_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "qwen2.5:1.5b")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "300"))

FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://localhost:5174,"
        "http://127.0.0.1:5173,http://127.0.0.1:5174",
    ).split(",")
    if origin.strip()
]
