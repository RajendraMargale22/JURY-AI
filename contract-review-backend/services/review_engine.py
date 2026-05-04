from typing import Dict, List

REQUIRED_CLAUSES = {
    "Parties": [
        "agreement is made between",
        "parties to this contract",
        "parties to this agreement",
        "between",
    ],
    "Payment Terms": ["payment", "invoice", "consideration"],
    "Termination": ["termination", "terminate", "expiry"],
    "Confidentiality": ["confidential", "non-disclosure", "nda"],
    "Liability": ["liability", "indemnity", "damages"],
    "Governing Law": [
        "governing law",
        "governed by indian law",
        "laws of india",
        "courts at",
        "jurisdiction",
    ],
}

HIGH_RISK_TERMS = [
    "unlimited liability",
    "sole discretion",
    "without notice",
    "perpetual",
    "irrevocable",
    "penalty",
]


def _contains_any(text_lower: str, patterns: List[str]) -> bool:
    return any(pattern in text_lower for pattern in patterns)


def analyze_contract_native(contract_text: str) -> Dict:
    text_lower = contract_text.lower()

    key_clauses_found: List[str] = []
    missing_clauses: List[str] = []

    for clause, keywords in REQUIRED_CLAUSES.items():
        if _contains_any(text_lower, keywords):
            key_clauses_found.append(clause)
        else:
            missing_clauses.append(clause)

    risky_terms = [term for term in HIGH_RISK_TERMS if term in text_lower]

    base_score = len(missing_clauses) * 12 + len(risky_terms) * 8
    text_penalty = 10 if len(contract_text.strip()) < 400 else 0
    risk_score = min(100, base_score + text_penalty)

    if risk_score >= 60:
        risk_level = "high"
    elif risk_score >= 30:
        risk_level = "medium"
    else:
        risk_level = "low"

    suggestions = []
    for clause in missing_clauses:
        suggestions.append(f"Add a clear '{clause}' clause.")

    if risky_terms:
        suggestions.append(
            "Review potentially risky terms: " + ", ".join(risky_terms[:5])
        )

    if not suggestions:
        suggestions.append("No major structural issues found. Do a final legal review before signing.")

    summary = (
        f"Contract reviewed with {len(key_clauses_found)} core clauses present and "
        f"{len(missing_clauses)} potentially missing."
    )

    return {
        "summary": summary,
        "document_type": "contract",
        "risk_level": risk_level,
        "risk_score": risk_score,
        "key_clauses_found": key_clauses_found,
        "missing_clauses": missing_clauses,
        "suggestions": suggestions,
    }
