#!/usr/bin/env python3
"""Generate a larger labeled evaluation dataset for contract review.

Output: scripts/eval_dataset.120.json (by default)
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List

REQUIRED = [
    "Parties",
    "Payment Terms",
    "Termination",
    "Confidentiality",
    "Liability",
    "Governing Law",
]

CLAUSE_LIBRARY: Dict[str, List[str]] = {
    "Parties": [
        "This agreement is made between Alpha Technologies Private Limited and Beta Services LLP (each a party and together the parties).",
        "The parties to this contract are Orion Consulting Pvt Ltd and Nimbus Retail Pvt Ltd.",
    ],
    "Payment Terms": [
        "Payment of professional fee shall be made against invoice within 15 days from receipt of invoice.",
        "Consideration and payment obligations are due within 30 days of valid invoice submission.",
    ],
    "Termination": [
        "Either party may terminate this agreement by giving 30 days prior written termination notice.",
        "This contract may be terminated on expiry or earlier with mutual written consent.",
    ],
    "Confidentiality": [
        "Each party shall keep all confidential information strictly confidential and use it only for contract performance.",
        "A non-disclosure obligation applies to all confidential business and technical information.",
    ],
    "Liability": [
        "Each party's liability and damages shall be limited to direct losses up to fees paid in the preceding 12 months.",
        "Indemnity applies only for proven third-party claims arising from negligence or wilful misconduct.",
    ],
    "Governing Law": [
        "This agreement is governed by Indian law and disputes are subject to courts at Bengaluru jurisdiction.",
        "Governing law shall be laws of India and dispute resolution shall be seated in New Delhi.",
    ],
}

NEUTRAL_FILLERS = [
    "The parties shall cooperate in good faith and maintain written records for compliance and audit purposes.",
    "Any amendment must be in writing and signed by authorized representatives of both parties.",
    "Notices under this agreement shall be sent by email and registered post to official addresses.",
    "If any provision is held invalid, remaining provisions shall continue in full force and effect.",
]

HIGH_RISK_ADDONS = [
    "The Company may terminate immediately without notice at its sole discretion for any reason.",
    "Consultant accepts unlimited liability and irrevocable indemnity for all direct, indirect, and consequential damages.",
    "All disputes shall be finally resolved by arbitration seated in London under rules chosen solely by the Company.",
    "For 3 years after termination, consultant shall not work with any competitor across India.",
]


def _compose_case(case_id: str, risk_level: str, missing: List[str], variant: int) -> Dict:
    key_found = [name for name in REQUIRED if name not in missing]

    lines: List[str] = []
    index = 1

    for clause_name in key_found:
        options = CLAUSE_LIBRARY[clause_name]
        lines.append(f"{index}. {options[variant % len(options)]}")
        index += 1

    # Keep enough text to avoid short-text penalty noise in baseline engine.
    for i, filler in enumerate(NEUTRAL_FILLERS):
        lines.append(f"{index + i}. {filler}")
    index += len(NEUTRAL_FILLERS)

    if risk_level == "high":
        for i, addon in enumerate(HIGH_RISK_ADDONS):
            lines.append(f"{index + i}. {addon}")

    contract_text = "\n".join(lines)

    return {
        "id": case_id,
        "contract_text": contract_text,
        "expected": {
            "risk_level": risk_level,
            "missing_clauses": missing,
            "key_clauses_found": key_found,
        },
    }


def build_dataset() -> List[Dict]:
    dataset: List[Dict] = []

    medium_patterns = [
        ["Confidentiality", "Liability", "Governing Law"],
        ["Payment Terms", "Termination", "Governing Law"],
        ["Parties", "Confidentiality", "Liability"],
        ["Termination", "Confidentiality", "Governing Law"],
    ]

    high_patterns = [
        ["Confidentiality", "Governing Law", "Liability", "Termination"],
        ["Payment Terms", "Governing Law", "Liability", "Parties"],
        ["Parties", "Payment Terms", "Confidentiality", "Termination"],
        ["Parties", "Liability", "Termination", "Governing Law"],
    ]

    # 40 low-risk cases: all required clauses present.
    for i in range(1, 41):
        dataset.append(_compose_case(f"low-{i:03d}", "low", [], i))

    # 40 medium-risk cases: exactly 3 required clauses missing.
    for i in range(1, 41):
        dataset.append(_compose_case(f"medium-{i:03d}", "medium", medium_patterns[(i - 1) % len(medium_patterns)], i))

    # 40 high-risk cases: 4 required clauses missing + explicit high-risk language.
    for i in range(1, 41):
        dataset.append(_compose_case(f"high-{i:03d}", "high", high_patterns[(i - 1) % len(high_patterns)], i))

    return dataset


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate 120-case evaluation dataset")
    parser.add_argument(
        "--out",
        default="scripts/eval_dataset.120.json",
        help="Output path for generated dataset",
    )
    args = parser.parse_args()

    data = build_dataset()
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with out_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"Generated {len(data)} cases at {out_path}")


if __name__ == "__main__":
    main()
