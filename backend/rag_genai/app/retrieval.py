"""Knowledge-base chunking and hybrid retrieval (BM25 + embeddings)."""

import math
import re
import threading
import time
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

from . import config, llm

STOPWORDS = frozenset(
    "a an the and or of to in on for with is are be by as at it its this that "
    "what how why which who when where do does can i my me you your we our "
    "from about into than then there their them they will would should".split()
)


@dataclass(frozen=True)
class Chunk:
    title: str
    section: str
    source: str
    text: str


def tokenize(text: str) -> list[str]:
    tokens = []
    for word in re.findall(r"[a-z0-9]+", text.lower()):
        if word in STOPWORDS or len(word) < 2:
            continue
        # Light stemming so "prices"/"price" and "amenities"/"amenity" match.
        if word.endswith("ies") and len(word) > 4:
            word = word[:-3] + "y"
        elif word.endswith("s") and not word.endswith("ss") and len(word) > 3:
            word = word[:-1]
        tokens.append(word)
    return tokens


def chunk_markdown(text: str, title: str, source: str, max_chars: int = 900) -> list[Chunk]:
    """Splits a Markdown document by `##` headings, then by paragraphs."""
    chunks: list[Chunk] = []
    section = title
    buffer: list[str] = []

    def flush() -> None:
        body = "\n\n".join(part for part in buffer if part.strip()).strip()
        if body:
            chunks.append(Chunk(title, section, source, body))
        buffer.clear()

    for block in re.split(r"\n\s*\n", text.strip()):
        heading = re.match(r"^(#{1,3})\s+(.*)", block.strip())
        if heading:
            flush()
            if len(heading.group(1)) == 1:
                title = heading.group(2).strip()
            section = heading.group(2).strip()
            remainder = block.strip()[heading.end():].strip()
            if remainder:
                buffer.append(remainder)
            continue
        if sum(len(part) for part in buffer) + len(block) > max_chars:
            flush()
        buffer.append(block.strip())
    flush()
    return chunks


def load_chunks(directory: Path = config.KNOWLEDGE_DIR) -> list[Chunk]:
    chunks: list[Chunk] = []
    for path in sorted(directory.rglob("*")):
        if path.suffix.lower() not in {".md", ".txt"}:
            continue
        text = path.read_text(encoding="utf-8")
        title = path.stem.replace("_", " ").title()
        chunks.extend(chunk_markdown(text, title, path.relative_to(directory.parent).as_posix()))
    return chunks


class BM25:
    def __init__(self, documents: list[list[str]], k1: float = 1.5, b: float = 0.75):
        self.k1, self.b = k1, b
        self.docs = [Counter(doc) for doc in documents]
        self.lengths = [len(doc) for doc in documents]
        self.avg_length = (sum(self.lengths) / len(self.lengths)) if self.lengths else 0
        frequency = Counter(term for doc in self.docs for term in doc)
        total = len(documents)
        self.idf = {
            term: math.log(1 + (total - count + 0.5) / (count + 0.5))
            for term, count in frequency.items()
        }

    def scores(self, query: list[str]) -> list[float]:
        results = []
        for doc, length in zip(self.docs, self.lengths):
            score = 0.0
            for term in query:
                tf = doc.get(term, 0)
                if not tf:
                    continue
                norm = tf + self.k1 * (1 - self.b + self.b * length / (self.avg_length or 1))
                score += self.idf.get(term, 0) * tf * (self.k1 + 1) / norm
            results.append(score)
        return results


def cosine_similarity(first: list[float], second: list[float]) -> float:
    if len(first) != len(second):
        raise ValueError("Embedding dimensions do not match.")
    first_norm = math.sqrt(sum(value * value for value in first))
    second_norm = math.sqrt(sum(value * value for value in second))
    if first_norm == 0 or second_norm == 0:
        return 0.0
    return sum(a * b for a, b in zip(first, second)) / (first_norm * second_norm)


def reciprocal_rank_fusion(rankings: list[list[int]], k: int = 60) -> dict[int, float]:
    fused: dict[int, float] = {}
    for ranking in rankings:
        for rank, index in enumerate(ranking):
            fused[index] = fused.get(index, 0.0) + 1.0 / (k + rank + 1)
    return fused


class KnowledgeIndex:
    """BM25 always; embeddings are added lazily when Ollama can provide them."""

    retry_seconds = 60.0

    def __init__(self, chunks: list[Chunk]):
        self.chunks = chunks
        self.bm25 = BM25([tokenize(f"{c.title} {c.section} {c.text}") for c in chunks])
        self.vectors: list[list[float]] | None = None
        self._lock = threading.Lock()
        self._last_attempt = 0.0

    def _ensure_vectors(self) -> bool:
        if self.vectors is not None:
            return True
        if not llm.status.get()["embed_ready"]:
            return False
        with self._lock:
            if self.vectors is not None:
                return True
            if time.monotonic() - self._last_attempt < self.retry_seconds:
                return False
            self._last_attempt = time.monotonic()
            try:
                self.vectors = llm.embed_texts(
                    [f"{c.title}. {c.section}. {c.text}" for c in self.chunks]
                )
            except llm.OllamaError:
                self.vectors = None
        return self.vectors is not None

    def search(self, query: str, limit: int = 4) -> tuple[list[tuple[Chunk, float]], str]:
        """Returns ranked chunks and the retrieval mode used."""
        if not self.chunks:
            return [], "none"

        keyword_scores = self.bm25.scores(tokenize(query))
        keyword_rank = [
            index
            for index in sorted(range(len(self.chunks)), key=lambda i: -keyword_scores[i])
            if keyword_scores[index] > 0
        ]

        rankings = [keyword_rank]
        mode = "keyword"
        if self._ensure_vectors():
            try:
                query_vector = llm.embed_texts([query])[0]
                semantic = [cosine_similarity(query_vector, v) for v in self.vectors]
                rankings.append(
                    sorted(range(len(self.chunks)), key=lambda i: -semantic[i])[: limit * 3]
                )
                mode = "hybrid"
            except llm.OllamaError:
                pass

        fused = reciprocal_rank_fusion(rankings)
        ranked = sorted(fused.items(), key=lambda item: -item[1])[:limit]
        return [(self.chunks[index], score) for index, score in ranked], mode
