#!/usr/bin/env python3
"""Train a CPU-friendly contract risk classifier using TF-IDF + linear model."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Tuple

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from sklearn.model_selection import train_test_split
from sklearn.pipeline import FeatureUnion, Pipeline


RISK_LABELS = ("low", "medium", "high")


def _load_label_map(path: str) -> Dict[str, str]:
    with open(path, "r", encoding="utf-8") as handle:
        raw = json.load(handle)

    if not isinstance(raw, dict):
        raise ValueError("Label map must be a JSON object")

    label_map: Dict[str, str] = {}
    for key, value in raw.items():
        mapped = str(value).strip().lower()
        if mapped not in RISK_LABELS:
            raise ValueError("Label map values must be low, medium, or high")
        label_map[str(key).strip().lower()] = mapped
    return label_map


def _normalize_text(value: Any) -> str:
    return " ".join(str(value or "").strip().split())


def _map_label(raw_label: str, label_map: Dict[str, str], default_label: str, unknown: Counter) -> str:
    key = raw_label.strip().lower()
    mapped = label_map.get(key)
    if mapped is None:
        unknown[key] += 1
        return default_label
    return mapped


def _load_examples(
    dataset_path: str,
    text_col: str,
    label_col: str,
    label_map: Dict[str, str],
    default_label: str,
    min_text_len: int,
) -> Tuple[List[Dict[str, str]], Counter]:
    frame = pd.read_csv(dataset_path)
    if text_col not in frame.columns or label_col not in frame.columns:
        raise ValueError(f"Dataset must contain columns '{text_col}' and '{label_col}'")

    examples: List[Dict[str, str]] = []
    unknown_labels: Counter = Counter()

    for row in frame[[text_col, label_col]].dropna().to_dict(orient="records"):
        text = _normalize_text(row.get(text_col, ""))
        if len(text) < min_text_len:
            continue
        raw_label = _normalize_text(row.get(label_col, ""))
        if not raw_label:
            continue
        examples.append(
            {
                "text": text,
                "label": _map_label(raw_label, label_map, default_label, unknown_labels),
            }
        )

    return examples, unknown_labels


def _split_dataset(examples: List[Dict[str, str]], val_size: float, seed: int) -> Tuple[List[Dict[str, str]], List[Dict[str, str]]]:
    labels = [row["label"] for row in examples]
    try:
        train_rows, val_rows = train_test_split(
            examples,
            test_size=val_size,
            random_state=seed,
            stratify=labels,
        )
    except ValueError:
        train_rows, val_rows = train_test_split(examples, test_size=val_size, random_state=seed)
    return train_rows, val_rows


def _build_pipeline(seed: int) -> Pipeline:
    features = FeatureUnion(
        [
            (
                "word",
                TfidfVectorizer(
                    analyzer="word",
                    ngram_range=(1, 2),
                    min_df=2,
                    max_df=0.95,
                    strip_accents="unicode",
                    sublinear_tf=True,
                ),
            ),
            (
                "char",
                TfidfVectorizer(
                    analyzer="char_wb",
                    ngram_range=(3, 5),
                    min_df=2,
                    sublinear_tf=True,
                ),
            ),
        ]
    )

    classifier = SGDClassifier(
        loss="log_loss",
        penalty="l2",
        alpha=1e-5,
        max_iter=2000,
        tol=1e-3,
        early_stopping=True,
        validation_fraction=0.1,
        n_iter_no_change=5,
        class_weight="balanced",
        random_state=seed,
    )

    return Pipeline([
        ("features", features),
        ("classifier", classifier),
    ])


def _evaluate_model(model: Pipeline, rows: List[Dict[str, str]]) -> Dict[str, float]:
    texts = [row["text"] for row in rows]
    labels = [row["label"] for row in rows]
    predictions = model.predict(texts)

    precision, recall, f1, _ = precision_recall_fscore_support(
        labels,
        predictions,
        average="macro",
        zero_division=0,
    )

    return {
        "accuracy": round(float(accuracy_score(labels, predictions)), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1": round(float(f1), 4),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a CPU-friendly contract risk classifier")
    parser.add_argument("--dataset", required=True, help="Path to Kaggle CSV dataset")
    parser.add_argument("--text-col", default="clause_text", help="Text column in the dataset")
    parser.add_argument("--label-col", default="clause_type", help="Label column in the dataset")
    parser.add_argument("--label-map", default="", help="JSON map from clause type to risk label")
    parser.add_argument("--default-label", default="low", help="Fallback label for unknown clause types")
    parser.add_argument("--min-text-len", type=int, default=30, help="Ignore extremely short rows")
    parser.add_argument("--output-dir", default="contract-review-backend/models/risk_classifier_sklearn", help="Model output directory")
    parser.add_argument("--val-size", type=float, default=0.15, help="Validation split fraction")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    dataset_path = Path(args.dataset)
    if not dataset_path.exists():
        raise SystemExit(f"Dataset not found: {dataset_path}")

    default_label = args.default_label.strip().lower()
    if default_label not in RISK_LABELS:
        raise SystemExit("default-label must be one of: low, medium, high")

    if not args.label_map:
        raise SystemExit("--label-map is required for training this risk classifier")

    label_map = _load_label_map(args.label_map)

    examples, unknown_labels = _load_examples(
        str(dataset_path),
        args.text_col,
        args.label_col,
        label_map,
        default_label,
        args.min_text_len,
    )

    if not examples:
        raise SystemExit("No usable examples were found in the dataset")

    if unknown_labels:
        top_unknown = ", ".join([f"{label}({count})" for label, count in unknown_labels.most_common(8)])
        print(f"Unknown labels mapped to '{default_label}': {top_unknown}")

    train_rows, val_rows = _split_dataset(examples, args.val_size, args.seed)
    print(f"Training rows: {len(train_rows)} | Validation rows: {len(val_rows)}")
    print(f"Risk label distribution: {Counter(row['label'] for row in examples)}")

    pipeline = _build_pipeline(args.seed)
    pipeline.fit([row["text"] for row in train_rows], [row["label"] for row in train_rows])

    metrics = _evaluate_model(pipeline, val_rows)
    print("Validation metrics:")
    for key, value in metrics.items():
        print(f"  {key}: {value}")

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, output_dir / "sklearn_pipeline.joblib")

    metadata = {
        "backend": "sklearn",
        "task": "risk_classification",
        "text_col": args.text_col,
        "label_col": args.label_col,
        "default_label": default_label,
        "metrics": metrics,
        "label_map_path": args.label_map,
        "classes": list(getattr(pipeline[-1], "classes_", [])),
    }
    with (output_dir / "metadata.json").open("w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2)

    print(f"Model saved to: {output_dir}")


if __name__ == "__main__":
    main()