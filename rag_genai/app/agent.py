"""Agentic RAG pipeline: plan → use tools → retrieve → answer (streamed).

The planner is deterministic (entity + intent detection) so the agent stays
fast and reliable on CPU-only machines; the language model is used once, to
write the final grounded answer from the tool observations.
"""

import re
from collections.abc import Iterator
from dataclasses import dataclass, field
from functools import cached_property

from . import llm, retrieval
from .tools import format_inr, property_data, segment_label

CITY_ALIASES = {"gurugram": "Gurgaon", "new delhi": "Delhi", "ncr": None}
TYPE_ALIASES = {
    "builder floor": "Builder Floor", "independent floor": "Builder Floor",
    "apartment": "Apartment", "flat": "Apartment", "condo": "Apartment",
    "villa": "Villa", "bungalow": "Villa", "house": "Villa",
    "plot": "Plot", "land": "Plot",
}
FOLLOW_UP = re.compile(r"\b(there|that|those|same|it|what about|how about|and in|instead)\b", re.I)

INTENT_PATTERNS = {
    "estimate": re.compile(r"\b(estimate|valu(e|ation)|worth|predict|how much (is|would|will|for)|price (of|for) (a|an|my))\b", re.I),
    "compare": re.compile(r"\b(compare|comparison|vs\.?|versus|difference|cheap(er|est)|expensive|costliest|affordable|rank|which (city|locality|area))\b", re.I),
    "stats": re.compile(r"\b(average|median|typical|price per|per sq|rate|cost|prices?|market|range)\b", re.I),
    "factors": re.compile(r"\b(factor|affect|influence|impact|important|drive|matter|feature importance|why)\b", re.I),
}
MARKET_WORDS = re.compile(
    r"\b(price|cost|rate|cheap\w*|expensive|costliest|affordable|value|cit(y|ies)|localit(y|ies))\b",
    re.I,
)

SYSTEM_PROMPT = """You are EstateIQ's property assistant for Delhi-NCR.
Answer using ONLY the numbered context. Do not add outside knowledge.
Rules:
- Start with a one-sentence direct answer. If the context has dataset statistics or a model estimate, lead with those figures.
- Put the source marker right after every fact or number, e.g. "₹20,834 per sq ft [1]".
- Copy numbers exactly from the context. Never calculate new numbers or invent facts.
- Dataset figures are medians: call them "median", not "average".
- When the context states "Key findings", use them instead of comparing numbers yourself.
- Do not claim anything about schools, transport, safety or lifestyle unless the context says it.
- Dataset figures are historical records, not live prices. Model estimates are indicative, not appraisals.
- If the context does not answer the question, say so and suggest the Predict Price page.
- Keep it short: at most 5 sentences or a brief bullet list."""


@dataclass
class Plan:
    message: str
    cities: list[str] = field(default_factory=list)
    localities: list[str] = field(default_factory=list)
    property_type: str | None = None
    bedrooms: int | None = None
    area: float | None = None
    intents: set[str] = field(default_factory=set)
    carried_over: bool = False

    @property
    def location_segments(self) -> list[dict]:
        segments = [{"locality": name} for name in self.localities]
        covered = {property_data.locality_city.get(name) for name in self.localities}
        segments += [{"city": name} for name in self.cities if name not in covered]
        return segments


@dataclass
class Observation:
    title: str
    source: str
    content: str
    kind: str  # "data" or "doc"


class Vocabulary:
    @cached_property
    def cities(self) -> dict[str, str]:
        names = {city.lower(): city for city in property_data.cities}
        names.update({alias: city for alias, city in CITY_ALIASES.items() if city})
        return names

    @cached_property
    def localities(self) -> dict[str, str]:
        return {name.lower(): name for name in property_data.locality_city}


vocab = Vocabulary()


def _find_names(text: str, names: dict[str, str], plurals: bool = False) -> list[str]:
    found: list[str] = []
    lowered = text.lower()
    suffix = "(?:s|es)?" if plurals else ""
    # Longest names first so "greater noida" wins over "noida".
    for key in sorted(names, key=len, reverse=True):
        pattern = rf"(?<![a-z0-9]){re.escape(key)}{suffix}(?![a-z0-9])"
        if re.search(pattern, lowered):
            value = names[key]
            if value not in found:
                found.append(value)
            lowered = re.sub(pattern, " ", lowered)
    return found


def plan(message: str, history: list[dict] | None = None) -> Plan:
    result = Plan(message=message)
    result.localities = _find_names(message, vocab.localities)
    result.cities = [
        city for city in _find_names(message, vocab.cities)
        # "Dwarka Expressway" is a Gurgaon locality; don't also read "Dwarka" etc.
        if city not in {property_data.locality_city.get(l) for l in result.localities} or len(result.localities) == 0
    ]
    types = _find_names(message, TYPE_ALIASES, plurals=True)
    result.property_type = types[0] if types else None

    if bhk := re.search(r"(\d)\s*(?:bhk|bed(?:room)?s?|bed)", message, re.I):
        result.bedrooms = int(bhk.group(1))
    if area := re.search(r"(\d[\d,]{2,})\s*(?:sq\.?\s*(?:ft|feet)|sqft|sft|square\s*feet)", message, re.I):
        result.area = float(area.group(1).replace(",", ""))

    for intent, pattern in INTENT_PATTERNS.items():
        if pattern.search(message):
            result.intents.add(intent)
    location_count = len(result.cities) + len(result.localities)
    # "Difference between carpet and built-up area" is not a market comparison.
    if "compare" in result.intents and location_count < 2 and not MARKET_WORDS.search(message):
        result.intents.discard("compare")
    # "What factors affect prices?" needs feature importance, not market stats.
    if "factors" in result.intents and not location_count and not result.property_type:
        result.intents.discard("stats")
    if "estimate" in result.intents and not (result.area or result.bedrooms):
        result.intents.discard("estimate")
        result.intents.add("stats")
    if result.area and (result.cities or result.localities or result.property_type):
        result.intents.add("estimate")

    # Follow-ups ("what about villas there?") reuse the previous location.
    short_market_question = len(message.split()) <= 6 and bool(
        result.property_type or result.bedrooms or MARKET_WORDS.search(message)
    )
    if history and not (result.cities or result.localities) and (
        FOLLOW_UP.search(message) or short_market_question
    ):
        for turn in reversed(history):
            if turn.get("role") != "user":
                continue
            previous = plan(turn.get("content", ""))
            if previous.cities or previous.localities:
                result.cities, result.localities = previous.cities, previous.localities
                result.property_type = result.property_type or previous.property_type
                result.carried_over = True
                if not result.intents:
                    result.intents = previous.intents or {"stats"}
                break

    if (result.cities or result.localities or result.property_type) and not result.intents:
        result.intents.add("stats")
    return result


# ------------------------------------------------------------------ tool runs

def _stats_text(stats: dict) -> str:
    if not stats.get("count"):
        return "No matching records in the dataset."
    relaxed = (
        f" (no close match, so the {', '.join(stats['relaxed'])} filter was widened)"
        if stats.get("relaxed") else ""
    )
    return (
        f"{stats['count']} historical records{relaxed}. Median price "
        f"{format_inr(stats['median_price'])} (middle 50%: "
        f"{format_inr(stats['p25_price'])}–{format_inr(stats['p75_price'])}). "
        f"Median price per sq ft ₹{stats['median_ppsf']:,.0f}; median area "
        f"{stats['median_area']:,.0f} sq ft."
    )


def _comparison_summary(rows: list[dict]) -> str:
    """States the conclusions explicitly so small models don't have to infer them."""
    rows = [row for row in rows if row.get("count")]
    if len(rows) < 2:
        return "Not enough records to compare."
    highest, lowest = rows[0], rows[-1]
    gap = (highest["median_ppsf"] / lowest["median_ppsf"] - 1) * 100
    largest = max(rows, key=lambda row: row["median_area"])
    return (
        f"Key findings: {highest['label']} has the highest median price per sq ft "
        f"(₹{highest['median_ppsf']:,.0f}) and {lowest['label']} the lowest "
        f"(₹{lowest['median_ppsf']:,.0f}), a {gap:.1f}% difference. "
        f"{largest['label']} has the largest median area ({largest['median_area']:,.0f} sq ft)."
    )


NUMBER = re.compile(r"\d[\d,]*(?:\.\d+)?")


def _numbers(text: str) -> set[str]:
    return {match.replace(",", "") for match in NUMBER.findall(text)}


def ungrounded_numbers(answer: str, observations: list["Observation"], question: str) -> list[str]:
    """Self-check: figures in the answer that appear nowhere in the context."""
    allowed = _numbers(question)
    for observation in observations:
        allowed |= _numbers(observation.content)
    suspicious = []
    for number in _numbers(answer):
        try:
            if float(number) <= 10:  # small counts like "3 BHK" or "2 markets"
                continue
        except ValueError:
            continue
        if number not in allowed:
            suspicious.append(number)
    return suspicious


INTENT_PHRASES = {
    "estimate": "Estimate the price of",
    "compare": "Compare prices of",
    "stats": "Average price of",
}


def rewrite_question(current: Plan) -> str:
    """Turns a follow-up like "And villas there?" into a standalone question."""
    if not current.carried_over:
        return current.message
    intent = next((i for i in ("estimate", "compare", "stats") if i in current.intents), "stats")
    subject = " ".join(
        part for part in (
            f"{current.bedrooms} BHK" if current.bedrooms else None,
            f"{current.property_type.lower()}s" if current.property_type else "properties",
        ) if part
    )
    places = " and ".join(current.localities + current.cities)
    return f"{INTENT_PHRASES[intent]} {subject} in {places}"


def run_tools(current: Plan) -> tuple[list[dict], list[Observation], list[dict]]:
    """Executes the planned tools. Returns (steps, observations, data cards)."""
    steps: list[dict] = []
    observations: list[Observation] = []
    cards: list[dict] = []
    dataset = "ml_backend/data/property_data.csv"

    if current.carried_over:
        steps.append({"tool": "memory", "label": "Used the location from your previous question"})

    if "estimate" in current.intents:
        location = (current.localities or current.cities or [None])[0]
        spec = {
            "locality": location if location in property_data.locality_city else None,
            "city": location if location in property_data.cities else None,
            "property_type": current.property_type,
            "bedrooms": current.bedrooms,
            "area": current.area,
        }
        result = property_data.estimate_price(spec)
        steps.append({"tool": "estimate_price", "label": "Ran the trained price model"})
        observations.append(Observation(
            "Model estimate",
            "Trained Random Forest model (ml_backend/model/model.pkl)",
            f"Estimated value {format_inr(result['estimate'])} "
            f"(₹{result['price_per_sqft']:,.0f}/sq ft) for "
            + ", ".join(f"{k}: {v}" for k, v in result["inputs"].items())
            + ". Assumed: " + "; ".join(result["assumptions"]) + ".",
            "data",
        ))
        cards.append({"kind": "estimate", **result, "estimate_label": format_inr(result["estimate"])})

    segments = current.location_segments
    wants_compare = "compare" in current.intents
    if wants_compare and len(segments) < 2:
        # "Which city is cheapest?" → compare every city.
        segments = [{"city": city} for city in property_data.cities]
    if wants_compare:
        for segment in segments:
            segment.update({"property_type": current.property_type, "bedrooms": current.bedrooms})
        rows = property_data.compare(segments)
        steps.append({"tool": "compare_markets", "label": f"Compared {len(rows)} markets in the dataset"})
        observations.append(Observation(
            "Market comparison (sorted by price per sq ft)",
            dataset,
            _comparison_summary(rows) + " | "
            + " | ".join(f"{row['label']}: {_stats_text(row)}" for row in rows),
            "data",
        ))
        cards.append({
            "kind": "compare",
            "rows": [
                {
                    "label": row["label"],
                    "count": row.get("count", 0),
                    "median_price": format_inr(row["median_price"]) if row.get("count") else "—",
                    "median_ppsf": f"₹{row['median_ppsf']:,.0f}" if row.get("count") else "—",
                }
                for row in rows
            ],
        })
    elif "stats" in current.intents or "estimate" in current.intents:
        for segment in (segments or [{}])[:3]:
            segment.update({"property_type": current.property_type, "bedrooms": current.bedrooms})
            stats = property_data.market_stats(**segment)
            label = segment_label(segment)
            steps.append({"tool": "market_stats", "label": f"Queried dataset statistics for {label}"})
            observations.append(Observation(f"Dataset statistics: {label}", dataset, _stats_text(stats), "data"))
            if stats.get("count"):
                cards.append({
                    "kind": "stats",
                    "title": label,
                    "metrics": [
                        {"label": "Median price", "value": format_inr(stats["median_price"])},
                        {"label": "Price / sq ft", "value": f"₹{stats['median_ppsf']:,.0f}"},
                        {"label": "Typical range", "value": f"{format_inr(stats['p25_price'])}–{format_inr(stats['p75_price'])}"},
                        {"label": "Records", "value": str(stats["count"])},
                    ],
                })

    if "factors" in current.intents:
        factors = property_data.top_factors()
        steps.append({"tool": "model_factors", "label": "Read the model's feature importance"})
        observations.append(Observation(
            "Model feature importance",
            "Trained Random Forest model (ml_backend/model/model.pkl)",
            "Share of the model's decision weight: "
            + ", ".join(f"{f['factor']} {f['share'] * 100:.1f}%" for f in factors) + ".",
            "data",
        ))
        cards.append({
            "kind": "factors",
            "factors": [{"factor": f["factor"], "share": round(f["share"] * 100, 1)} for f in factors],
        })

    return steps, observations, cards


# ------------------------------------------------------------- answer writing

def _fallback_answer(observations: list[Observation]) -> str:
    """Grounded answer built directly from tool results when no LLM is available."""
    data = [(i, o) for i, o in enumerate(observations, start=1) if o.kind == "data"]
    docs = [(i, o) for i, o in enumerate(observations, start=1) if o.kind == "doc"]
    lines = []
    for index, observation in data:
        if " | " in observation.content:
            rows = "\n".join(f"- {row}" for row in observation.content.split(" | "))
            lines.append(f"**{observation.title}** [{index}]\n{rows}")
        else:
            lines.append(f"**{observation.title}:** {observation.content} [{index}]")
    if docs:
        index, observation = docs[0]
        excerpt = observation.content.split("\n\n")[0]
        if len(excerpt) > 420:
            excerpt = excerpt[:420].rsplit(" ", 1)[0] + "…"
        lines.append(f"{excerpt} [{index}]")
    if not lines:
        return (
            "I couldn't find information about that in EstateIQ's guide or dataset. "
            "Try asking about a Delhi-NCR city, a property type, or how valuations work."
        )
    return "\n\n".join(lines)


def _build_messages(message: str, observations: list[Observation], history: list[dict]) -> list[dict]:
    context = "\n\n".join(
        f"[{index}] {o.title} (source: {o.source})\n{o.content}"
        for index, o in enumerate(observations, start=1)
    ) or "No context was retrieved."
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for turn in history[-4:]:
        if turn.get("role") in {"user", "assistant"} and turn.get("content"):
            messages.append({"role": turn["role"], "content": str(turn["content"])[:800]})
    messages.append({
        "role": "user",
        "content": f"Context:\n{context}\n\nQuestion: {message}",
    })
    return messages


class Agent:
    def __init__(self) -> None:
        self._index: retrieval.KnowledgeIndex | None = None

    @property
    def index(self) -> retrieval.KnowledgeIndex:
        if self._index is None:
            self._index = retrieval.KnowledgeIndex(retrieval.load_chunks())
        return self._index

    def run(self, message: str, history: list[dict] | None = None) -> Iterator[dict]:
        """Yields events: step, sources, data, token, done."""
        history = history or []
        current = plan(message, history)
        intents = ", ".join(sorted(current.intents)) or "general question"
        yield {"type": "step", "tool": "planner", "label": f"Planned the answer ({intents})"}

        question = rewrite_question(current)
        if question != message:
            yield {"type": "step", "tool": "memory", "label": f'Rewrote the follow-up as "{question}"'}

        steps, observations, cards = run_tools(current)
        for step in steps:
            if step["tool"] != "memory":  # already reported by the rewrite step
                yield {"type": "step", **step}

        chunks, mode = self.index.search(question, limit=2 if observations else 4)
        if chunks:
            yield {
                "type": "step",
                "tool": "search_knowledge",
                "label": f"Searched the EstateIQ guide ({mode} retrieval, {len(chunks)} passages)",
            }
        for chunk, _ in chunks:
            observations.append(Observation(f"{chunk.title} — {chunk.section}", chunk.source, chunk.text, "doc"))

        sources = [
            {"number": index, "title": o.title, "source": o.source, "kind": o.kind}
            for index, o in enumerate(observations, start=1)
        ]
        yield {"type": "sources", "sources": sources}
        if cards:
            yield {"type": "data", "cards": cards}

        status = llm.status.get()
        answer_parts: list[str] = []
        answer_mode = "offline"
        if status["chat_ready"]:
            yield {"type": "step", "tool": "llm", "label": f"Writing the answer with {llm.config.OLLAMA_CHAT_MODEL}"}
            try:
                for text in llm.chat_stream(_build_messages(question, observations, history)):
                    answer_parts.append(text)
                    yield {"type": "token", "text": text}
                answer_mode = "llm"
            except llm.OllamaError:
                answer_parts = []

        if answer_mode == "llm":
            # Reflection step: verify the model's figures against the tool data.
            suspicious = ungrounded_numbers("".join(answer_parts), observations, message)
            if suspicious:
                yield {
                    "type": "step",
                    "tool": "self_check",
                    "label": "Self-check found unsupported figures; switched to the verified data answer",
                }
                answer_parts = []
            else:
                count = len(_numbers("".join(answer_parts)))
                yield {
                    "type": "step",
                    "tool": "self_check",
                    "label": f"Self-check passed: {count} figure{'s' if count != 1 else ''} verified against the data",
                }

        if not "".join(answer_parts).strip():
            text = _fallback_answer(observations)
            answer_parts = [text]
            answer_mode = "offline"
            yield {"type": "token", "text": text, "replace": True}

        yield {
            "type": "done",
            "answer": "".join(answer_parts).strip(),
            "mode": answer_mode,
            "sources": sources,
            "cards": cards,
        }


agent = Agent()
