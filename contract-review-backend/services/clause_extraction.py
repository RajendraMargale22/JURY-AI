import re
from typing import List


def split_into_clauses(text: str) -> List[str]:
    """
    Split contract text into approximate clauses.

    Handles numbered items, sub-numbered items, bullet points, and fallback paragraph splits.
    """
    if not text:
        return []

    normalized = text.replace("\r\n", "\n").replace("\r", "\n")

    clause_candidates = re.split(
        r"(?m)^\s*(?:\d+(?:\.\d+)?\.?|[a-zA-Z]\)|[-•])\s+",
        normalized,
    )

    clauses = [c.strip() for c in clause_candidates if len(c.strip()) > 20]

    # Fallback for documents without common numbering patterns
    if len(clauses) < 3:
        paragraph_candidates = [p.strip() for p in normalized.split("\n\n")]
        clauses = [p for p in paragraph_candidates if len(p) > 40]

    return clauses
