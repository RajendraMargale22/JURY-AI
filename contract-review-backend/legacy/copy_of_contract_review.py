"""
Legacy contract review placeholder.

Replace this file with your existing single-file implementation.
It must expose: analyze_contract(text: str) -> dict
"""


def analyze_contract(text: str) -> dict:
    # Minimal default implementation so service always runs.
    cleaned = (text or "").strip()
    if not cleaned:
        return {
            "summary": "No content received for contract analysis.",
            "document_type": "contract",
            "risk_level": "high",
            "risk_score": 80,
            "key_clauses_found": [],
            "missing_clauses": ["Parties", "Payment Terms", "Termination"],
            "suggestions": ["Provide full contract text for meaningful analysis."],
        }

    return {
        "summary": "Legacy analyzer executed successfully.",
        "document_type": "contract",
        "risk_level": "medium",
        "risk_score": 45,
        "key_clauses_found": ["Parties"],
        "missing_clauses": ["Liability", "Governing Law"],
        "suggestions": ["Review liability and governing law clauses."],
    }
