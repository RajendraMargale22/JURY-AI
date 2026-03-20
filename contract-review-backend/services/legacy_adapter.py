import importlib.util
from pathlib import Path
from typing import Callable, Dict, Optional, Any, cast
from logger import logger


LegacyAnalyzer = Callable[[str], Dict[str, Any]]


def load_legacy_analyzer(
    legacy_file_path: str = "./legacy/copy_of_contract_review.py",
) -> Optional[LegacyAnalyzer]:
    """
    Loads legacy contract review analyzer from a single file.

    Expected function in legacy file:
        def analyze_contract(text: str) -> dict
    """
    legacy_path = Path(legacy_file_path)

    if not legacy_path.exists():
        logger.info(f"Legacy analyzer not found at {legacy_path}")
        return None

    spec = importlib.util.spec_from_file_location("legacy_contract_review", str(legacy_path))
    if spec is None or spec.loader is None:
        logger.warning("Failed to load spec for legacy contract review analyzer")
        return None

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    analyzer = getattr(module, "analyze_contract", None)
    if analyzer is None or not callable(analyzer):
        logger.warning("Legacy file loaded but `analyze_contract(text)` was not found")
        return None

    logger.info("Legacy contract review analyzer loaded successfully")
    return cast(LegacyAnalyzer, analyzer)
