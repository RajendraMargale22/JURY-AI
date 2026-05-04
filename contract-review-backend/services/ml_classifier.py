import json
import os
import importlib
import re
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import joblib

from logger import logger


DEFAULT_LABELS = {
    0: "low",
    1: "medium",
    2: "medium",
    3: "high",
    4: "high",
}

SKLEARN_MODEL_FILENAMES = (
    "sklearn_pipeline.joblib",
    "model.joblib",
)

HF_CONFIG_FILENAME = "config.json"


def _map_prediction_to_risk(model, pred_idx: int) -> str:
    config = getattr(model, "config", None)
    if config is None:
        return DEFAULT_LABELS.get(pred_idx, "medium")

    id2label = getattr(config, "id2label", {}) or {}
    label_name = str(id2label.get(pred_idx, "")).lower()
    if any(token in label_name for token in ["negative", "contradiction", "unacceptable", "bad"]):
        return "medium"
    if any(token in label_name for token in ["positive", "acceptable", "good"]):
        return "low"
    if "neutral" in label_name:
        return "medium"
    if any(token in label_name for token in ["high", "severe", "critical", "risk_2", "label_2"]):
        return "high"
    if any(token in label_name for token in ["medium", "moderate", "risk_1", "label_1"]):
        return "medium"
    if any(token in label_name for token in ["low", "safe", "risk_0", "label_0"]):
        return "low"

    num_labels = int(getattr(config, "num_labels", 0) or 0)
    if num_labels == 2:
        return "high" if pred_idx == 1 else "low"
    if num_labels == 3:
        return {0: "low", 1: "medium", 2: "high"}.get(pred_idx, "medium")
    return DEFAULT_LABELS.get(pred_idx, "medium")


def _heuristic_classifier(text: str) -> Dict:
    text_lower = text.lower()
    high_patterns = [
        r"unlimited\s+liability",
        r"sole\s+discretion",
        r"without\s+notice",
        r"termination\s+fee",
        r"unconditional\s+and\s+irrevocable",
    ]
    medium_patterns = [
        r"exclusive\s+jurisdiction",
        r"revocable\s+license",
        r"without\s+cause",
        r"non-?solicit.*\b(3|4|5|6|7|8|9|10)\s*years",
        r"deemed\s+acceptance|continued\s+use\s+.*acceptance",
    ]

    if any(re.search(pattern, text_lower) for pattern in high_patterns):
        return {"risk_level": "high", "confidence": 0.78, "source": "heuristic"}
    if any(re.search(pattern, text_lower) for pattern in medium_patterns):
        return {"risk_level": "medium", "confidence": 0.66, "source": "heuristic"}
    return {"risk_level": "low", "confidence": 0.62, "source": "heuristic"}


def _detect_trained_model_path() -> Tuple[Optional[str], Optional[str]]:
    model_root = os.getenv("CONTRACT_REVIEW_MODEL_PATH", "").strip()
    if not model_root:
        return None, None

    root_path = Path(model_root)
    if root_path.is_file():
        if root_path.name in SKLEARN_MODEL_FILENAMES:
            return "sklearn", str(root_path)
        if root_path.name == HF_CONFIG_FILENAME and root_path.parent.exists():
            return "transformers", str(root_path.parent)
        return None, None

    if root_path.is_dir():
        for filename in SKLEARN_MODEL_FILENAMES:
            candidate = root_path / filename
            if candidate.exists():
                return "sklearn", str(candidate)
        if (root_path / HF_CONFIG_FILENAME).exists():
            return "transformers", str(root_path)

    return None, None


def get_ml_model_status() -> Dict[str, Optional[str]]:
    model_type, model_path = _detect_trained_model_path()
    return {
        "ready": bool(model_type and model_path),
        "model_type": model_type,
        "model_path": model_path,
    }


@lru_cache(maxsize=1)
def _load_sklearn_stack():
    model_root = os.getenv("CONTRACT_REVIEW_MODEL_PATH", "").strip()
    if not model_root:
        return None

    root_path = Path(model_root)
    candidate_files = []
    if root_path.is_file():
        candidate_files = [root_path]
    elif root_path.is_dir():
        candidate_files = [root_path / filename for filename in SKLEARN_MODEL_FILENAMES]
    else:
        return None

    for candidate in candidate_files:
        if not candidate.exists():
            continue

        try:
            pipeline = joblib.load(candidate)
            metadata_path = candidate.with_name("metadata.json")
            metadata = {}
            if metadata_path.exists():
                with metadata_path.open("r", encoding="utf-8") as handle:
                    metadata = json.load(handle)
            logger.info(f"Loaded sklearn classifier from: {candidate}")
            return pipeline, metadata
        except Exception as error:  # pylint: disable=broad-except
            logger.warning(f"Failed to load sklearn classifier from {candidate}: {error}")
            return None

    return None


@lru_cache(maxsize=1)
def _load_transformers_stack_local(model_path: str):
    try:
        transformers = importlib.import_module("transformers")
        torch = importlib.import_module("torch")

        AutoTokenizer = getattr(transformers, "AutoTokenizer")
        AutoModelForSequenceClassification = getattr(transformers, "AutoModelForSequenceClassification")

        tokenizer = AutoTokenizer.from_pretrained(model_path)
        model = AutoModelForSequenceClassification.from_pretrained(model_path)
        model.eval()
        logger.info(f"Loaded local transformer classifier from: {model_path}")
        return tokenizer, model, torch
    except Exception as error:  # pylint: disable=broad-except
        logger.warning(f"Failed to load local transformer classifier from {model_path}: {error}")
        return None


@lru_cache(maxsize=1)
def _load_transformers_stack():
    model_name = os.getenv("CONTRACT_REVIEW_MODEL_NAME", "nlpaueb/legal-bert-base-uncased")
    model_path = os.getenv("CONTRACT_REVIEW_MODEL_PATH", "").strip() or model_name

    try:
        transformers = importlib.import_module("transformers")
        torch = importlib.import_module("torch")

        AutoTokenizer = getattr(transformers, "AutoTokenizer")
        AutoModelForSequenceClassification = getattr(transformers, "AutoModelForSequenceClassification")

        tokenizer = AutoTokenizer.from_pretrained(model_path)
        model = AutoModelForSequenceClassification.from_pretrained(model_path)
        model.eval()
        logger.info(f"Loaded optional ML classifier from: {model_path}")
        return tokenizer, model, torch
    except Exception as error:  # pylint: disable=broad-except
        logger.info(f"Optional ML classifier unavailable, using heuristic mode: {error}")
        return None


def _load_ml_stack_trained():
    model_type, model_path = _detect_trained_model_path()
    if not model_type or not model_path:
        # Fallback to the default huggingface transformer model if no local path is set
        stack = _load_transformers_stack()
        if stack is not None:
            return stack
        return None

    if model_type == "sklearn":
        return _load_sklearn_stack()
    if model_type == "transformers":
        return _load_transformers_stack_local(model_path)
    return None


def classify_clause_optional(clause_text: str) -> Dict:
    sklearn_stack = _load_sklearn_stack()
    if sklearn_stack is not None:
        pipeline, _metadata = sklearn_stack

        try:
            predictions = pipeline.predict([clause_text])
            confidences = None
            if hasattr(pipeline, "predict_proba"):
                confidences = pipeline.predict_proba([clause_text])
            confidence = float(confidences.max()) if confidences is not None else 0.5
            return {
                "risk_level": str(predictions[0]).lower(),
                "confidence": round(confidence, 4),
                "source": "ml",
            }
        except Exception as error:  # pylint: disable=broad-except
            logger.warning(f"Sklearn classification failed, using heuristic fallback: {error}")

    stack = _load_transformers_stack()
    if stack is None:
        return _heuristic_classifier(clause_text)


    def classify_clause_ml_only(clause_text: str) -> Optional[Dict]:
        stack = _load_ml_stack_trained()
        if stack is None:
            return None

        if isinstance(stack, tuple) and len(stack) == 2:
            pipeline, _metadata = stack
            try:
                predictions = pipeline.predict([clause_text])
                confidences = None
                if hasattr(pipeline, "predict_proba"):
                    confidences = pipeline.predict_proba([clause_text])
                confidence = float(confidences.max()) if confidences is not None else 0.5
                return {
                    "risk_level": str(predictions[0]).lower(),
                    "confidence": round(confidence, 4),
                    "source": "ml",
                }
            except Exception as error:  # pylint: disable=broad-except
                logger.warning(f"Sklearn ML-only classification failed: {error}")
                return None

        if isinstance(stack, tuple) and len(stack) == 3:
            tokenizer, model, torch = stack
            try:
                inputs = tokenizer(clause_text, return_tensors="pt", truncation=True, max_length=256)
                with torch.no_grad():
                    outputs = model(**inputs)
                    logits = outputs.logits
                    probs = torch.softmax(logits, dim=1)
                pred_idx = int(torch.argmax(probs, dim=1).item())
                confidence = float(torch.max(probs, dim=1).values.item())
                risk_level = _map_prediction_to_risk(model, pred_idx)
                return {
                    "risk_level": risk_level,
                    "confidence": round(confidence, 4),
                    "source": "ml",
                }
            except Exception as error:  # pylint: disable=broad-except
                logger.warning(f"Transformer ML-only classification failed: {error}")
                return None

        return None

    tokenizer, model, torch = stack

    try:
        inputs = tokenizer(clause_text, return_tensors="pt", truncation=True, max_length=256)
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=1)

        pred_idx = int(torch.argmax(probs, dim=1).item())
        confidence = float(torch.max(probs, dim=1).values.item())

        risk_level = _map_prediction_to_risk(model, pred_idx)
        return {
            "risk_level": risk_level,
            "confidence": round(confidence, 4),
            "source": "ml",
        }
    except Exception as error:  # pylint: disable=broad-except
        logger.warning(f"ML classification failed, using heuristic: {error}")
        return _heuristic_classifier(clause_text)


def classify_clauses_optional(clauses: List[str]) -> List[Dict]:
    if not clauses:
        return []

    sklearn_stack = _load_sklearn_stack()
    if sklearn_stack is not None:
        pipeline, _metadata = sklearn_stack

        try:
            predictions = pipeline.predict(clauses)
            confidences = None
            if hasattr(pipeline, "predict_proba"):
                confidences = pipeline.predict_proba(clauses)

            results: List[Dict] = []
            for index, prediction in enumerate(predictions):
                confidence = 0.5
                if confidences is not None:
                    confidence = float(max(confidences[index]))
                results.append(
                    {
                        "risk_level": str(prediction).lower(),
                        "confidence": round(confidence, 4),
                        "source": "ml",
                    }
                )
            return results
        except Exception as error:  # pylint: disable=broad-except
            logger.warning(f"Batched sklearn classification failed, using heuristic fallback: {error}")

    stack = _load_transformers_stack()
    if stack is None:
        return [_heuristic_classifier(clause) for clause in clauses]

    tokenizer, model, torch = stack
    batch_size = int(os.getenv("CONTRACT_REVIEW_ML_BATCH_SIZE", "16"))
    results: List[Dict] = []

    try:
        for start_idx in range(0, len(clauses), batch_size):
            batch = clauses[start_idx:start_idx + batch_size]
            inputs = tokenizer(batch, return_tensors="pt", truncation=True, max_length=256, padding=True)

            with torch.no_grad():
                outputs = model(**inputs)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=1)

            pred_indices = torch.argmax(probs, dim=1).tolist()
            confidences = torch.max(probs, dim=1).values.tolist()

            for pred_idx, confidence in zip(pred_indices, confidences):
                results.append(
                    {
                        "risk_level": _map_prediction_to_risk(model, int(pred_idx)),
                        "confidence": round(float(confidence), 4),
                        "source": "ml",
                    }
                )

        return results
    except Exception as error:  # pylint: disable=broad-except
        logger.warning(f"Batched ML classification failed, using heuristic fallback: {error}")
        return [_heuristic_classifier(clause) for clause in clauses]


def classify_clauses_ml_only(clauses: List[str]) -> Optional[List[Dict]]:
    if not clauses:
        return []

    stack = _load_ml_stack_trained()
    if stack is None:
        return None

    if isinstance(stack, tuple) and len(stack) == 2:
        pipeline, _metadata = stack
        try:
            predictions = pipeline.predict(clauses)
            confidences = None
            if hasattr(pipeline, "predict_proba"):
                confidences = pipeline.predict_proba(clauses)
            results: List[Dict] = []
            for index, prediction in enumerate(predictions):
                confidence = 0.5
                if confidences is not None:
                    confidence = float(max(confidences[index]))
                results.append(
                    {
                        "risk_level": str(prediction).lower(),
                        "confidence": round(confidence, 4),
                        "source": "ml",
                    }
                )
            return results
        except Exception as error:  # pylint: disable=broad-except
            logger.warning(f"Batched sklearn ML-only classification failed: {error}")
            return None

    if isinstance(stack, tuple) and len(stack) == 3:
        tokenizer, model, torch = stack
        batch_size = int(os.getenv("CONTRACT_REVIEW_ML_BATCH_SIZE", "16"))
        results: List[Dict] = []

        try:
            for start_idx in range(0, len(clauses), batch_size):
                batch = clauses[start_idx:start_idx + batch_size]
                inputs = tokenizer(batch, return_tensors="pt", truncation=True, max_length=256, padding=True)

                with torch.no_grad():
                    outputs = model(**inputs)
                    logits = outputs.logits
                    probs = torch.softmax(logits, dim=1)

                pred_indices = torch.argmax(probs, dim=1).tolist()
                confidences = torch.max(probs, dim=1).values.tolist()

                for pred_idx, confidence in zip(pred_indices, confidences):
                    results.append(
                        {
                            "risk_level": _map_prediction_to_risk(model, int(pred_idx)),
                            "confidence": round(float(confidence), 4),
                            "source": "ml",
                        }
                    )

            return results
        except Exception as error:  # pylint: disable=broad-except
            logger.warning(f"Batched transformer ML-only classification failed: {error}")
            return None

    return None
