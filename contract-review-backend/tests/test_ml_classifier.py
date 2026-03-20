import importlib

from services.ml_classifier import classify_clause_optional


def test_ml_classifier_falls_back_to_heuristic_when_transformers_missing(monkeypatch):
    def fake_import(name: str):
        if name in {"transformers", "torch"}:
            raise ModuleNotFoundError(name)
        return importlib.import_module(name)

    monkeypatch.setattr("services.ml_classifier.importlib.import_module", fake_import)
    # Clear cached loader state
    from services.ml_classifier import _load_transformers_stack

    _load_transformers_stack.cache_clear()

    result = classify_clause_optional("Termination by sole discretion without notice is allowed.")

    assert result["source"] == "heuristic"
    assert result["risk_level"] in {"medium", "high"}
    assert 0 <= result["confidence"] <= 1
