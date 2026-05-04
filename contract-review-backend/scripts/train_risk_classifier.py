#!/usr/bin/env python3
"""Train a clause-level risk classifier (low/medium/high)."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Dict, List, Tuple

import pandas as pd
import torch
from datasets import Dataset
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    EarlyStoppingCallback,
    Trainer,
    TrainingArguments,
)

RISK_LABELS = ["low", "medium", "high"]


def _load_label_map(path: str | None) -> Dict[str, str]:
    if not path:
        return {}
    with open(path, "r", encoding="utf-8") as handle:
        raw = json.load(handle)
    if not isinstance(raw, dict):
        raise ValueError("Label map must be a JSON object")
    mapped: Dict[str, str] = {}
    for key, value in raw.items():
        mapped_label = str(value).strip().lower()
        if mapped_label not in RISK_LABELS:
            raise ValueError("Label map values must be: low, medium, high")
        mapped[str(key).strip().lower()] = mapped_label
    return mapped


def _normalize_text(value: object) -> str:
    return " ".join(str(value or "").strip().split())


def _map_label(
    raw_label: str,
    label_map: Dict[str, str],
    default_label: str,
    unknown_counter: Counter,
) -> str:
    key = raw_label.strip().lower()
    if label_map:
        mapped = label_map.get(key)
        if not mapped:
            unknown_counter[key] += 1
            return default_label
        return mapped
    if key not in RISK_LABELS:
        unknown_counter[key] += 1
        return default_label
    return key


def _load_csv_examples(
    path: str,
    text_col: str,
    label_col: str,
    label_map: Dict[str, str],
    default_label: str,
    min_text_len: int,
) -> Tuple[List[Dict[str, str]], Counter]:
    df = pd.read_csv(path)
    if text_col not in df.columns or label_col not in df.columns:
        raise ValueError(f"CSV must include columns '{text_col}' and '{label_col}'")

    df = df[[text_col, label_col]].dropna()

    examples: List[Dict[str, str]] = []
    unknown = Counter()

    for row in df.to_dict(orient="records"):
        text = _normalize_text(row.get(text_col, ""))
        if len(text) < min_text_len:
            continue
        raw_label = _normalize_text(row.get(label_col, ""))
        if not raw_label:
            continue
        label = _map_label(raw_label, label_map, default_label, unknown)
        examples.append({"text": text, "label": label})

    return examples, unknown


def _train_val_split(
    examples: List[Dict[str, str]],
    val_size: float,
    seed: int,
) -> Tuple[List[Dict[str, str]], List[Dict[str, str]]]:
    labels = [row["label"] for row in examples]
    try:
        train_rows, val_rows = train_test_split(
            examples,
            test_size=val_size,
            random_state=seed,
            stratify=labels,
        )
    except ValueError:
        train_rows, val_rows = train_test_split(
            examples,
            test_size=val_size,
            random_state=seed,
        )
    return train_rows, val_rows


class WeightedTrainer(Trainer):
    def __init__(self, *args, class_weights: torch.Tensor | None = None, **kwargs):
        super().__init__(*args, **kwargs)
        self.class_weights = class_weights

    def compute_loss(self, model, inputs, return_outputs=False):
        labels = inputs.pop("labels")
        outputs = model(**inputs)
        logits = outputs.logits
        if self.class_weights is not None:
            weights = self.class_weights.to(logits.device)
        else:
            weights = None
        loss_fct = torch.nn.CrossEntropyLoss(weight=weights)
        loss = loss_fct(logits, labels)
        return (loss, outputs) if return_outputs else loss


def _compute_metrics(pred):
    preds = pred.predictions.argmax(axis=1)
    labels = pred.label_ids
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels,
        preds,
        average="macro",
        zero_division=0,
    )
    acc = accuracy_score(labels, preds)
    return {
        "accuracy": round(acc, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a clause-level risk classifier")
    parser.add_argument("--dataset", required=True, help="Path to CSV dataset")
    parser.add_argument("--text-col", default="clause_text", help="Text column name")
    parser.add_argument("--label-col", default="clause_type", help="Label column name")
    parser.add_argument("--label-map", default="", help="JSON map from label to risk label")
    parser.add_argument("--default-label", default="low", help="Fallback label for unknowns")
    parser.add_argument("--min-text-len", type=int, default=30, help="Minimum text length")
    parser.add_argument("--model-name", default="nlpaueb/legal-bert-base-uncased", help="HF model name")
    parser.add_argument("--output-dir", default="models/risk_classifier", help="Output directory")
    parser.add_argument("--epochs", type=int, default=4)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--weight-decay", type=float, default=0.01)
    parser.add_argument("--warmup-ratio", type=float, default=0.1)
    parser.add_argument("--max-length", type=int, default=256)
    parser.add_argument("--val-size", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--class-weights", action="store_true", help="Use class weights")
    parser.add_argument("--fp16", action="store_true", help="Enable fp16 if CUDA is available")
    args = parser.parse_args()

    dataset_path = Path(args.dataset)
    if not dataset_path.exists():
        raise SystemExit(f"Dataset not found: {dataset_path}")

    default_label = args.default_label.strip().lower()
    if default_label not in RISK_LABELS:
        raise SystemExit("default-label must be one of: low, medium, high")

    label_map = _load_label_map(args.label_map) if args.label_map else {}

    examples, unknown = _load_csv_examples(
        str(dataset_path),
        args.text_col,
        args.label_col,
        label_map,
        default_label,
        args.min_text_len,
    )

    if not examples:
        raise SystemExit("No training examples after filtering")

    if unknown:
        top_unknown = ", ".join([f"{k}({v})" for k, v in unknown.most_common(5)])
        print(f"Unknown labels mapped to '{default_label}': {top_unknown}")

    train_rows, val_rows = _train_val_split(examples, args.val_size, args.seed)

    label2id = {label: idx for idx, label in enumerate(RISK_LABELS)}
    id2label = {idx: label for label, idx in label2id.items()}

    def to_dataset(rows: List[Dict[str, str]]) -> Dataset:
        return Dataset.from_list(
            [{"text": row["text"], "label": label2id[row["label"]]} for row in rows]
        )

    train_ds = to_dataset(train_rows)
    val_ds = to_dataset(val_rows)

    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    model = AutoModelForSequenceClassification.from_pretrained(
        args.model_name,
        num_labels=len(RISK_LABELS),
        id2label=id2label,
        label2id=label2id,
    )

    def tokenize(batch):
        return tokenizer(
            batch["text"],
            truncation=True,
            max_length=args.max_length,
        )

    train_ds = train_ds.map(tokenize, batched=True, remove_columns=["text"])
    val_ds = val_ds.map(tokenize, batched=True, remove_columns=["text"])

    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    use_fp16 = bool(args.fp16 and torch.cuda.is_available())
    if args.fp16 and not use_fp16:
        print("fp16 requested but CUDA not available; continuing without fp16")

    class_weights = None
    if args.class_weights:
        train_label_ids = [label2id[row["label"]] for row in train_rows]
        weights = compute_class_weight(
            class_weight="balanced",
            classes=list(label2id.values()),
            y=train_label_ids,
        )
        class_weights = torch.tensor(weights, dtype=torch.float)

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        greater_is_better=True,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        learning_rate=args.lr,
        weight_decay=args.weight_decay,
        warmup_ratio=args.warmup_ratio,
        logging_steps=50,
        save_total_limit=2,
        fp16=use_fp16,
        report_to="none",
        seed=args.seed,
    )

    trainer_kwargs = dict(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        tokenizer=tokenizer,
        data_collator=data_collator,
        compute_metrics=_compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
    )

    if class_weights is not None:
        trainer = WeightedTrainer(class_weights=class_weights, **trainer_kwargs)
    else:
        trainer = Trainer(**trainer_kwargs)

    trainer.train()
    metrics = trainer.evaluate()
    print("Evaluation metrics:")
    for key, value in metrics.items():
        if key.startswith("eval_"):
            print(f"  {key}: {value}")

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"Model saved to: {output_dir}")


if __name__ == "__main__":
    main()
