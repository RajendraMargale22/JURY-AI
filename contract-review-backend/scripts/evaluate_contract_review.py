#!/usr/bin/env python3
"""
Lightweight evaluation scaffold for contract-review accuracy.

Usage:
  python scripts/evaluate_contract_review.py --dataset scripts/eval_dataset.sample.json

Dataset format (JSON array):
[
  {
    "id": "case-1",
    "contract_text": "...",
    "expected": {
      "risk_level": "high",
      "missing_clauses": ["Liability", "Termination"],
      "key_clauses_found": ["Payment Terms"]
    }
  }
]
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from typing import Any, Dict, List, Set

from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import main
from services import runtime_state


@dataclass
class EvalStats:
    total: int = 0
    risk_level_correct: int = 0
    missing_precision_sum: float = 0.0
    missing_recall_sum: float = 0.0
    key_precision_sum: float = 0.0
    key_recall_sum: float = 0.0


def _norm_set(items: List[str]) -> Set[str]:
    return {str(item).strip().lower() for item in items if str(item).strip()}


def _precision_recall(predicted: Set[str], expected: Set[str]) -> tuple[float, float]:
    if not predicted and not expected:
        return 1.0, 1.0
    if not predicted:
        return 1.0, 0.0
    if not expected:
        return 0.0, 1.0

    tp = len(predicted.intersection(expected))
    precision = tp / len(predicted) if predicted else 0.0
    recall = tp / len(expected) if expected else 0.0
    return precision, recall


def evaluate(dataset_path: str, api_key: str) -> Dict[str, Any]:
    with open(dataset_path, "r", encoding="utf-8") as handle:
        dataset = json.load(handle)

    if not isinstance(dataset, list):
        raise ValueError("Dataset must be a JSON array")

    client = TestClient(main.app)
    runtime_state.legacy_analyzer = None  # evaluate native path only

    stats = EvalStats(total=len(dataset))
    details: List[Dict[str, Any]] = []

    for row in dataset:
        case_id = row.get("id", f"case-{len(details)+1}")
        text = row.get("contract_text", "")
        expected = row.get("expected", {}) or {}

        response = client.post(
            "/contract-review/analyze",
            data={"contract_text": text},
            headers={"X-API-Key": api_key},
        )

        if response.status_code != 200:
            details.append(
                {
                    "id": case_id,
                    "status": response.status_code,
                    "error": response.text,
                }
            )
            continue

        payload = response.json()
        expected_risk = str(expected.get("risk_level", "")).lower().strip()
        actual_risk = str(payload.get("risk_level", "")).lower().strip()
        risk_ok = expected_risk == actual_risk if expected_risk else True
        if risk_ok:
            stats.risk_level_correct += 1

        pred_missing = _norm_set(payload.get("missing_clauses", []))
        exp_missing = _norm_set(expected.get("missing_clauses", []))
        missing_precision, missing_recall = _precision_recall(pred_missing, exp_missing)
        stats.missing_precision_sum += missing_precision
        stats.missing_recall_sum += missing_recall

        pred_key = _norm_set(payload.get("key_clauses_found", []))
        exp_key = _norm_set(expected.get("key_clauses_found", []))
        key_precision, key_recall = _precision_recall(pred_key, exp_key)
        stats.key_precision_sum += key_precision
        stats.key_recall_sum += key_recall

        details.append(
            {
                "id": case_id,
                "risk_expected": expected_risk,
                "risk_actual": actual_risk,
                "risk_match": risk_ok,
                "missing_precision": round(missing_precision, 4),
                "missing_recall": round(missing_recall, 4),
                "key_precision": round(key_precision, 4),
                "key_recall": round(key_recall, 4),
                "risk_score": payload.get("risk_score"),
            }
        )

    evaluated = max(1, stats.total)
    summary = {
        "cases": stats.total,
        "risk_level_accuracy": round(stats.risk_level_correct / evaluated, 4),
        "missing_clause_precision": round(stats.missing_precision_sum / evaluated, 4),
        "missing_clause_recall": round(stats.missing_recall_sum / evaluated, 4),
        "key_clause_precision": round(stats.key_precision_sum / evaluated, 4),
        "key_clause_recall": round(stats.key_recall_sum / evaluated, 4),
    }

    return {"summary": summary, "details": details}


def main_cli() -> None:
    parser = argparse.ArgumentParser(description="Evaluate contract review quality on labeled dataset")
    parser.add_argument("--dataset", required=True, help="Path to evaluation dataset JSON")
    parser.add_argument("--api-key", default=os.getenv("API_KEY", "dev-local-key"), help="API key header value")
    parser.add_argument("--out", default="", help="Optional output file for JSON report")
    args = parser.parse_args()

    report = evaluate(args.dataset, args.api_key)

    print("=== Evaluation Summary ===")
    for k, v in report["summary"].items():
        print(f"{k}: {v}")

    if args.out:
        with open(args.out, "w", encoding="utf-8") as handle:
            json.dump(report, handle, indent=2)
        print(f"\nDetailed report written to: {args.out}")


if __name__ == "__main__":
    main_cli()
