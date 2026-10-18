import asyncio
import json
import unittest
from unittest.mock import patch

from pydantic import ValidationError

from rag_genai.app import agent as agent_module
from rag_genai.app import llm, main as service
from rag_genai.app.agent import Agent, plan
from rag_genai.app.retrieval import (
    BM25,
    Chunk,
    KnowledgeIndex,
    chunk_markdown,
    cosine_similarity,
    reciprocal_rank_fusion,
    tokenize,
)
from rag_genai.app.tools import format_inr, property_data

OFFLINE = {"connected": False, "chat_ready": False, "embed_ready": False, "models": [], "detail": "down"}
ONLINE = {"connected": True, "chat_ready": True, "embed_ready": True, "models": [], "detail": ""}


def collect(events):
    return list(events)


class RetrievalTests(unittest.TestCase):
    def test_tokenize_stems_plurals_and_drops_stopwords(self):
        self.assertEqual(tokenize("The prices of amenities"), ["price", "amenity"])

    def test_chunk_markdown_splits_by_heading(self):
        chunks = chunk_markdown("# Guide\n\n## Area\n\nArea text.\n\n## City\n\nCity text.", "Doc", "kb/doc.md")
        self.assertEqual([c.section for c in chunks], ["Area", "City"])
        self.assertEqual(chunks[0].title, "Guide")

    def test_bm25_ranks_matching_document_first(self):
        index = BM25([tokenize("carpet area definition"), tokenize("metro distance")])
        scores = index.scores(tokenize("what is carpet area"))
        self.assertGreater(scores[0], scores[1])

    def test_rrf_rewards_documents_ranked_by_both_retrievers(self):
        fused = reciprocal_rank_fusion([[0, 1], [1, 0], [1]])
        self.assertGreater(fused[1], fused[0])

    def test_similarity_rejects_different_dimensions(self):
        with self.assertRaises(ValueError):
            cosine_similarity([1.0], [1.0, 0.0])

    def test_keyword_search_works_without_ollama(self):
        index = KnowledgeIndex([
            Chunk("Glossary", "BHK", "kb.md", "BHK means bedroom hall kitchen."),
            Chunk("Glossary", "Plot", "kb.md", "A plot is residential land."),
        ])
        with patch.object(llm.status, "get", return_value=OFFLINE):
            results, mode = index.search("what does BHK mean")
        self.assertEqual(mode, "keyword")
        self.assertEqual(results[0][0].section, "BHK")


class PlannerTests(unittest.TestCase):
    def test_extracts_city_type_bedrooms_and_area(self):
        result = plan("Estimate a 3 BHK apartment of 1,500 sq ft in Gurugram")
        self.assertEqual(result.cities, ["Gurgaon"])
        self.assertEqual(result.property_type, "Apartment")
        self.assertEqual((result.bedrooms, result.area), (3, 1500.0))
        self.assertIn("estimate", result.intents)

    def test_plural_types_and_longest_city_match(self):
        result = plan("Average price of villas in Greater Noida")
        self.assertEqual(result.cities, ["Greater Noida"])
        self.assertEqual(result.property_type, "Villa")
        self.assertIn("stats", result.intents)

    def test_cheapest_city_triggers_comparison(self):
        self.assertIn("compare", plan("Which city is the cheapest per sq ft?").intents)

    def test_definition_question_is_not_a_market_comparison(self):
        self.assertNotIn("compare", plan("Difference between carpet area and built-up area?").intents)

    def test_follow_up_reuses_previous_location(self):
        history = [{"role": "user", "content": "Prices of builder floors in Rohini"}]
        result = plan("And villas there?", history)
        self.assertTrue(result.carried_over)
        self.assertEqual(result.localities, ["Rohini"])
        self.assertEqual(result.property_type, "Villa")

    def test_follow_up_is_rewritten_as_standalone_question(self):
        history = [{"role": "user", "content": "Average price of apartments in Gurgaon"}]
        self.assertEqual(
            agent_module.rewrite_question(plan("And villas there?", history)),
            "Average price of villas in Gurgaon",
        )

    def test_unrelated_short_question_does_not_carry_over(self):
        history = [{"role": "user", "content": "Prices in Rohini"}]
        self.assertFalse(plan("What is BHK?", history).carried_over)


class ToolTests(unittest.TestCase):
    def test_format_inr_uses_crore_and_lakh(self):
        self.assertEqual(format_inr(25_000_000), "₹2.50 Cr")
        self.assertEqual(format_inr(4_500_000), "₹45.0 L")

    def test_market_stats_relaxes_narrow_filters(self):
        stats = property_data.market_stats(locality="Saket", property_type="Plot", bedrooms=5)
        self.assertGreaterEqual(stats["count"], 5)
        self.assertIn("bedrooms", stats["relaxed"])

    def test_estimate_price_reports_assumptions(self):
        result = property_data.estimate_price({"city": "Noida", "area": 1500, "bedrooms": 3})
        self.assertGreater(result["estimate"], 0)
        self.assertEqual(result["inputs"]["City"], "Noida")
        self.assertTrue(any("Property type" in item for item in result["assumptions"]))

    def test_top_factors_sum_one_hot_columns(self):
        factors = property_data.top_factors(limit=2)
        self.assertEqual(factors[0]["factor"], "Built-up area")
        self.assertEqual(factors[1]["factor"], "City")


class AgentTests(unittest.TestCase):
    def test_offline_answer_is_built_from_tool_results(self):
        with patch.object(llm.status, "get", return_value=OFFLINE):
            events = collect(Agent().run("Compare Saket and Golf Course Road"))
        done = events[-1]
        self.assertEqual(done["mode"], "offline")
        self.assertIn("Saket", done["answer"])
        self.assertTrue(any(e["type"] == "step" and e["tool"] == "compare_markets" for e in events))
        self.assertEqual(done["cards"][0]["kind"], "compare")

    def test_llm_answer_is_streamed(self):
        with (
            patch.object(llm.status, "get", return_value=ONLINE),
            patch.object(agent_module.llm, "embed_texts", side_effect=llm.OllamaError("no")),
            patch.object(agent_module.llm, "chat_stream", return_value=iter(["Delhi ", "leads [1]."])),
        ):
            events = collect(Agent().run("Which city is the most expensive?"))
        tokens = [e["text"] for e in events if e["type"] == "token"]
        self.assertEqual(tokens, ["Delhi ", "leads [1]."])
        self.assertEqual(events[-1]["mode"], "llm")
        self.assertEqual(events[-1]["answer"], "Delhi leads [1].")

    def test_self_check_replaces_answer_with_invented_figures(self):
        with (
            patch.object(llm.status, "get", return_value={**ONLINE, "embed_ready": False}),
            patch.object(
                agent_module.llm,
                "chat_stream",
                return_value=iter(["Saket costs ₹99,999 per sq ft [1]."]),
            ),
        ):
            events = collect(Agent().run("Compare Saket and Golf Course Road"))
        self.assertTrue(any(e.get("tool") == "self_check" and "unsupported" in e["label"] for e in events))
        self.assertEqual(events[-1]["mode"], "offline")
        self.assertNotIn("99,999", events[-1]["answer"])

    def test_comparison_states_key_findings(self):
        with patch.object(llm.status, "get", return_value=OFFLINE):
            events = collect(Agent().run("Compare Saket and Golf Course Road"))
        self.assertIn("Key findings: Saket has the highest median price per sq ft", events[-1]["answer"])

    def test_llm_failure_falls_back_to_offline_answer(self):
        def broken(_messages):
            raise llm.OllamaError("crashed")
            yield  # pragma: no cover - makes this a generator

        with (
            patch.object(llm.status, "get", return_value={**ONLINE, "embed_ready": False}),
            patch.object(agent_module.llm, "chat_stream", side_effect=broken),
        ):
            events = collect(Agent().run("What factors affect prices?"))
        self.assertEqual(events[-1]["mode"], "offline")
        self.assertIn("Built-up area", events[-1]["answer"])


class ApiTests(unittest.TestCase):
    def test_chat_rejects_blank_messages(self):
        with self.assertRaises(ValidationError):
            service.ChatRequest(message="   ")

    def test_chat_returns_answer_steps_and_sources(self):
        with patch.object(llm.status, "get", return_value=OFFLINE):
            response = service.chat(service.ChatRequest(message="Average price in Noida"))
        self.assertIn("Noida", response["answer"])
        self.assertTrue(response["steps"])
        self.assertTrue(response["sources"])

    def test_stream_emits_ndjson_events_ending_with_done(self):
        with patch.object(llm.status, "get", return_value=OFFLINE):
            response = service.chat_stream(service.ChatRequest(message="What is BHK?"))
            lines = [json.loads(line) for line in self._drain(response)]
        self.assertEqual(lines[0]["type"], "step")
        self.assertEqual(lines[-1]["type"], "done")

    def test_health_is_degraded_without_ollama(self):
        with patch.object(llm.status, "get", return_value=OFFLINE):
            response = service.health()
        self.assertEqual(response["status"], "degraded")
        self.assertTrue(response["tools_ready"])

    @staticmethod
    def _drain(response):
        # Starlette wraps the sync generator in an async iterator.
        async def read():
            return [chunk async for chunk in response.body_iterator]

        for chunk in asyncio.run(read()):
            text = chunk if isinstance(chunk, str) else chunk.decode("utf-8")
            yield from (line for line in text.splitlines() if line.strip())


if __name__ == "__main__":
    unittest.main()
