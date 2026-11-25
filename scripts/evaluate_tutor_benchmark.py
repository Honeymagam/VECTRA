"""Measure held-out synthetic formula retrieval, optionally including tutor QA.

The default run measures embedding retrieval only. Pass --include-tutor to make
100 tutor requests and also report numeric exact-match answer accuracy. Results
are diagnostic, not a publication-ready expert-labelled benchmark.
"""
from decimal import Decimal
from datetime import datetime, timezone
import argparse
import json
import math
import os
from pathlib import Path
import sys
import re
import tempfile

WORKSPACE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(WORKSPACE))
TEMP_ROOT = WORKSPACE / "data"
TEMP_ROOT.mkdir(exist_ok=True)
TEMP_DIR = tempfile.TemporaryDirectory(prefix="vectra_eval_", dir=TEMP_ROOT)
database_path = (Path(TEMP_DIR.name) / "eval.sqlite").resolve().as_posix()
os.environ["DATABASE_URL"] = f"sqlite:///{database_path}"
os.environ["ENVIRONMENT"] = "development"

from app.database import Base, SessionLocal, engine
from app.config import get_settings
from app.main import chat
from app.models.core import Concept, Document, DocumentChunk, Role, User
from app.schemas import TutorIn
from app.services import embedder, search


FORMULAS = {
    "Percentages": "Percentage increase: new value = original value x (100 + rate) / 100. Percentage decrease: new value = original value x (100 - rate) / 100.",
    "Ratio": "Ratio sharing: a total is divided into equal-sized ratio parts; one share equals total x that share ratio / sum of ratio terms.",
    "Profit & Loss": "Gain = selling price - cost price. Gain percentage = gain x 100 / cost price. Selling price = cost price x (100 + gain percentage) / 100.",
    "Average": "Average = sum of observations / number of observations.",
    "Simple Interest": "Simple interest = principal x rate x time / 100, when rate is annual and time is in years.",
    "Compound Interest": "For annual compounding, amount = principal x (1 + rate / 100) raised to the number of years. Compound interest = amount - principal.",
    "Time & Work": "One day's work is 1 / days required. Combined work rates are added; combined time is the reciprocal of the combined rate.",
    "Probability": "For equally likely outcomes, probability of an event = favourable outcomes / total outcomes.",
    "Data Interpretation": "Percentage change = (current value - previous value) x 100 / previous value.",
}


def fmt(value) -> str:
    return format(Decimal(value).quantize(Decimal("0.01")).normalize(), "f")


def benchmark_cases():
    for index in range(100):
        group, sample = index % 10, index // 10
        if group == 0:
            base, rate = 327 + sample * 37, 7 + sample * 3
            answer = fmt(Decimal(base) * (100 + rate) / 100)
            yield "Percentages", f"A value is {base} and increases by {rate}%. What is the new value?", answer
        elif group == 1:
            base, rate = 731 + sample * 41, 6 + sample * 4
            answer = fmt(Decimal(base) * (100 - rate) / 100)
            yield "Percentages", f"A price is {base} and is discounted by {rate}%. What is the sale price?", answer
        elif group == 2:
            a, b, scale = 2 + sample % 4, 5 + sample % 3, 19 + sample
            total = (a + b) * scale
            answer = str(a * scale)
            yield "Ratio", f"A total of {total} items is split in ratio {a}:{b}. How many are in the first share?", answer
        elif group == 3:
            cost, rate = 463 + sample * 29, 9 + sample * 4
            answer = fmt(Decimal(cost) * (100 + rate) / 100)
            yield "Profit & Loss", f"An item costing {cost} is sold at a gain of {rate}%. Find the selling price.", answer
        elif group == 4:
            vals = [137 + sample * 11, 224 + sample * 7, 319 + sample * 13, 406 + sample * 5]
            answer = fmt(Decimal(sum(vals)) / len(vals))
            yield "Average", f"Find the average of {', '.join(map(str, vals))}.", answer
        elif group == 5:
            principal, rate, years = 1240 + sample * 137, 7 + sample, 2 + sample % 6
            answer = fmt(Decimal(principal * rate * years) / 100)
            yield "Simple Interest", f"Find simple interest on principal {principal} at {rate}% annually for {years} years.", answer
        elif group == 6:
            principal, rate, years = 1380 + sample * 113, 6 + sample, 2 + sample % 4
            amount = Decimal(principal) * (Decimal(1) + Decimal(rate) / 100) ** years
            answer = fmt(amount - principal)
            yield "Compound Interest", f"Find compound interest on {principal} at {rate}% annually for {years} years, compounded yearly.", answer
        elif group == 7:
            days_a, days_b = 7 + sample, 19 + sample * 2
            answer = fmt(Decimal(days_a * days_b) / Decimal(days_a + days_b))
            yield "Time & Work", f"A finishes a job in {days_a} days and B in {days_b} days. How long working together?", answer
        elif group == 8:
            sides = 10 + sample * 2
            answer = fmt(Decimal(sides // 2) / sides)
            yield "Probability", f"A fair {sides}-sided die has half its faces even. What is the probability of an even result?", answer
        else:
            previous, increase = 217 + sample * 31, 13 + sample * 2
            current = Decimal(previous) * (100 + increase) / 100
            answer = fmt(Decimal(increase))
            yield "Data Interpretation", f"Sales rise from {previous} to {fmt(current)}. What is the percentage increase?", answer


def normalize_numeric_values(text: str) -> set[str]:
    values = set()
    for match in re.findall(r"(?<![\w.])-?\d+(?:\.\d+)?", text):
        try:
            values.add(fmt(match))
        except Exception:
            continue
    return values


def wilson_interval(successes: int, total: int, z: float = 1.96) -> tuple[float, float]:
    if total == 0:
        return 0.0, 0.0
    p = successes / total
    denominator = 1 + z * z / total
    center = (p + z * z / (2 * total)) / denominator
    margin = z * ((p * (1 - p) / total + z * z / (4 * total * total)) ** 0.5) / denominator
    return max(0.0, center - margin) * 100, min(1.0, center + margin) * 100


def main() -> None:
    parser = argparse.ArgumentParser(description="Measure VECTRA tutor and embedding retrieval quality.")
    parser.add_argument("--include-tutor", action="store_true", help="also run 100 tutor prompts and measure numeric exact-match accuracy")
    args = parser.parse_args()
    include_tutor = args.include_tutor
    total = exact_matches = retrieval_hits = 0
    answer_total = 0
    reciprocal_rank_sum = precision_at_5_sum = ndcg_at_5_sum = 0.0
    per_topic: dict[str, dict[str, float]] = {}
    try:
        Base.metadata.create_all(engine)
        db = SessionLocal()
        try:
            user = User(name="Temporary Research Evaluator", email="research-eval@example.invalid", password_hash="not-a-login-account", role=Role.STUDENT)
            db.add(user)
            db.flush()
            concepts = {}
            for topic in FORMULAS:
                concept = Concept(name=topic, category="RESEARCH_BENCHMARK", embedding=embedder.embed(topic))
                db.add(concept)
                db.flush()
                concepts[topic] = concept
            document = Document(uploaded_by=user.id, filename="isolated-formula-reference.txt", file_type="txt", extracted_text=None)
            db.add(document)
            db.flush()
            for chunk_index, (topic, formula) in enumerate(FORMULAS.items()):
                db.add(DocumentChunk(
                    document_id=document.id,
                    chunk_text=f"Topic: {topic}. Formula reference: {formula}",
                    topic=topic,
                    chunk_index=chunk_index,
                    embedding=embedder.embed(f"{topic}. {formula}"),
                    metadata_json={},
                ))
            db.commit()
            db.refresh(user)

            for topic, prompt, expected in benchmark_cases():
                total += 1
                query = f"Topic: {topic}. {prompt}"
                if include_tutor:
                    payload = chat(TutorIn(message=query), user, db)
                    answer = payload.get("answer", "")
                    # Ignore retrieved passages: score only the tutor's own final response.
                    final_text = answer.rsplit("Work through the key idea", 1)[-1]
                    matched = expected in normalize_numeric_values(final_text)
                    exact_matches += int(matched)
                    answer_total += 1
                    sources = payload.get("sources", [])
                else:
                    sources = search(db, query, 5)
                relevant_rank = next((rank for rank, source in enumerate(sources[:5], start=1) if source.get("topic") == topic), None)
                topic_hit = relevant_rank is not None
                retrieval_hits += int(topic_hit)
                reciprocal_rank = 1 / relevant_rank if relevant_rank else 0.0
                ndcg = 1 / math.log2(relevant_rank + 1) if relevant_rank else 0.0
                precision = 1 / 5 if topic_hit else 0.0
                reciprocal_rank_sum += reciprocal_rank
                ndcg_at_5_sum += ndcg
                precision_at_5_sum += precision
                stats = per_topic.setdefault(topic, {"questions": 0, "exact_matches": 0, "answer_count": 0, "retrieval_hits": 0, "reciprocal_rank_sum": 0.0})
                stats["questions"] += 1
                if include_tutor:
                    stats["exact_matches"] += int(matched)
                    stats["answer_count"] += 1
                stats["retrieval_hits"] += int(topic_hit)
                stats["reciprocal_rank_sum"] += reciprocal_rank
                if total % 10 == 0:
                    print(f"Evaluated {total}/100 prompts", flush=True)
        finally:
            db.close()

        lower, upper = wilson_interval(exact_matches, answer_total) if answer_total else (None, None)
        settings = get_settings()
        report = {
            "evaluated_at": datetime.now(timezone.utc).isoformat(),
            "benchmark": "held-out synthetic arithmetic QA and formula retrieval" if include_tutor else "held-out synthetic formula retrieval",
            "sample_size": total,
            "topic_count": len(per_topic),
            "embedding_model": settings.embedding_model,
            "tutor_model": (settings.llm_model if settings.llm_provider.lower() in {"openai", "openai_compatible"} else settings.llm_provider) if include_tutor else None,
            "answer_accuracy": {
                "label": "Numeric exact-match accuracy",
                "percentage": round(exact_matches / answer_total * 100, 2) if answer_total else 0,
                "numerator": exact_matches,
                "denominator": answer_total,
                "confidence_95_percent": {"lower": round(lower, 2), "upper": round(upper, 2)},
            } if answer_total else None,
            "retrieval": {
                "hit_at_5_percent": round(retrieval_hits / total * 100, 2) if total else 0,
                "precision_at_5_percent": round(precision_at_5_sum / total * 100, 2) if total else 0,
                "recall_at_5_percent": round(retrieval_hits / total * 100, 2) if total else 0,
                "mrr_at_5_percent": round(reciprocal_rank_sum / total * 100, 2) if total else 0,
                "ndcg_at_5_percent": round(ndcg_at_5_sum / total * 100, 2) if total else 0,
                "numerator": retrieval_hits,
                "denominator": total,
            },
            "per_topic": {
                topic: {
                    "questions": int(stats["questions"]),
                    "answer_accuracy_percent": round(stats["exact_matches"] / stats["answer_count"] * 100, 2) if stats["answer_count"] else None,
                    "retrieval_hit_at_5_percent": round(stats["retrieval_hits"] / stats["questions"] * 100, 2),
                    "mrr_at_5_percent": round(stats["reciprocal_rank_sum"] / stats["questions"] * 100, 2),
                }
                for topic, stats in per_topic.items()
            },
            "limitations": [
                "Synthetic arithmetic questions with one formula passage per topic.",
                "Numeric exact match does not measure explanation quality or factuality; it is only run with --include-tutor.",
                "Diagnostic result only; it is not an expert-reviewed or general-purpose model score.",
            ],
        }
        report_path = WORKSPACE / "data" / "generated" / "model_evaluation_latest.json"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        print("VECTRA held-out synthetic formula retrieval benchmark")
        print(f"Questions: {total}")
        print(f"Embedding model: {report['embedding_model']}")
        if include_tutor:
            print(f"Tutor model: {report['tutor_model']}")
            print(f"End-to-end exact-answer accuracy: {exact_matches / answer_total * 100:.2f}% ({exact_matches}/{answer_total})")
            print(f"95% Wilson interval: {lower:.2f}% to {upper:.2f}%")
        else:
            print("Tutor answer accuracy: not run (use --include-tutor to measure)")
        print(f"Topic retrieval Hit@5: {retrieval_hits / total * 100:.2f}% ({retrieval_hits}/{total})")
        print(f"Precision@5: {precision_at_5_sum / total * 100:.2f}%")
        print(f"MRR@5: {reciprocal_rank_sum / total * 100:.2f}%")
        print(f"nDCG@5: {ndcg_at_5_sum / total * 100:.2f}%")
        print("Per topic (answer accuracy; retrieval Hit@5):")
        for topic, stats in per_topic.items():
            count = int(stats["questions"])
            answer_score = f"{stats['exact_matches'] / stats['answer_count'] * 100:.1f}%" if stats["answer_count"] else "not run"
            print(f"  {topic}: {answer_score}; {stats['retrieval_hits'] / count * 100:.1f}% ({count} questions)")
        print(f"Saved report: {report_path}")
        print("Limitations: synthetic arithmetic benchmark, one relevant formula passage per topic, and numeric exact-match does not rate explanation quality. Diagnostic only; not an expert-reviewed general-purpose model score.")
    finally:
        engine.dispose()
        TEMP_DIR.cleanup()


if __name__ == "__main__":
    main()
