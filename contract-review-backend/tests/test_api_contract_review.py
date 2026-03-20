from io import BytesIO

from fastapi.testclient import TestClient

import main
import middlewares.security as security_middleware
from routes.contract_review import compute_final_risk_score
from services import runtime_state


client = TestClient(main.app)
AUTH_HEADERS = {"X-API-Key": "dev-local-key"}


def post_analyze(*, data=None, files=None):
    return client.post(
        "/contract-review/analyze",
        data=data,
        files=files,
        headers=AUTH_HEADERS,
    )


def test_analyze_rejects_empty_request():
    runtime_state.legacy_analyzer = None
    response = post_analyze(files={})

    assert response.status_code == 400
    payload = response.json()
    assert payload["success"] is False


def test_analyze_requires_api_key():
    runtime_state.legacy_analyzer = None
    response = client.post("/contract-review/analyze", data={"contract_text": "test"})
    assert response.status_code == 401


def test_analyze_rate_limit_enforced():
    runtime_state.legacy_analyzer = None
    original_max = security_middleware._RATE_LIMIT_MAX_REQUESTS
    original_window = security_middleware._RATE_LIMIT_WINDOW_SEC
    try:
        security_middleware._RATE_LIMIT_MAX_REQUESTS = 1
        security_middleware._RATE_LIMIT_WINDOW_SEC = 60
        with security_middleware._RATE_LOCK:
            security_middleware._RATE_BUCKETS.clear()

        first = post_analyze(data={"contract_text": "1. Basic clause."})
        second = post_analyze(data={"contract_text": "1. Basic clause."})

        assert first.status_code == 200
        assert second.status_code == 429
    finally:
        security_middleware._RATE_LIMIT_MAX_REQUESTS = original_max
        security_middleware._RATE_LIMIT_WINDOW_SEC = original_window
        with security_middleware._RATE_LOCK:
            security_middleware._RATE_BUCKETS.clear()


def test_analyze_with_text_returns_clause_level_details_and_merged_risk():
    runtime_state.legacy_analyzer = None
    contract_text = (
        "1. Parties: this agreement is between Alpha and Beta.\n"
        "2. Payment due in USD.\n"
        "3. Arbitration in London with exclusive New York jurisdiction.\n"
        "4. Termination notice period is 3 days and liability has no cap.\n"
    )

    response = post_analyze(data={"contract_text": contract_text})

    assert response.status_code == 200
    payload = response.json()

    assert payload["success"] is True
    assert payload["source"] == "native"
    assert payload["clauses_analyzed"] >= 3
    assert payload["risky_clauses"] >= 1
    assert len(payload["clause_results"]) >= 1
    assert payload["risk_level"] in {"low", "medium", "high"}
    assert "high_risk_clauses" in payload
    assert "medium_risk_clauses" in payload
    assert "low_risk_clauses" in payload
    assert any(
        len(clause.get("indian_risks", [])) > 0
        for clause in payload["clause_results"]
    )


def test_analyze_with_txt_file_upload_is_processed():
    runtime_state.legacy_analyzer = None

    file_content = (
        "1. This agreement has confidentiality clause.\n"
        "2. Governing law shall be English law.\n"
        "3. Payment terms in USD.\n"
    ).encode("utf-8")

    response = post_analyze(files={"file": ("sample.txt", BytesIO(file_content), "text/plain")})

    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "native"
    assert payload["clauses_analyzed"] >= 1


def test_legacy_analyzer_path_is_used_when_available():
    def fake_legacy(_text: str):
        return {
            "summary": "legacy ok",
            "document_type": "contract",
            "risk_level": "medium",
            "risk_score": 55,
            "key_clauses_found": ["Parties"],
            "missing_clauses": ["Liability"],
            "suggestions": ["Add liability cap"],
            "clauses_analyzed": 1,
            "risky_clauses": 1,
            "clause_results": [
                {
                    "clause_text": "legacy clause",
                    "ml_risk_level": "medium",
                    "ml_confidence": 0.9,
                    "ml_source": "heuristic",
                    "indian_risks": ["Medium Risk: test"],
                    "final_risk_level": "medium",
                }
            ],
        }

    runtime_state.legacy_analyzer = fake_legacy

    response = post_analyze(data={"contract_text": "Any contract text"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "legacy"
    assert payload["summary"] == "legacy ok"
    assert payload["clauses_analyzed"] == 1

    runtime_state.legacy_analyzer = None


def test_regression_safe_vs_risky_contract_risk_bands():
    runtime_state.legacy_analyzer = None

    safe_contract = (
        "1. Either party may terminate by giving 30 days written notice.\n"
        "2. Client shall pay fees within 15 days; delayed amounts bear interest at 12% per annum.\n"
        "3. Each party shall keep Confidential Information confidential for this agreement.\n"
        "4. Each party's aggregate liability is capped at total fees paid in the preceding 12 months.\n"
        "5. Each party indemnifies the other for third-party claims arising from negligence or willful misconduct.\n"
        "6. Arbitration seated in New Delhi under the Arbitration and Conciliation Act, 1996.\n"
    )

    risky_contract = (
        "1. The Company may terminate immediately at sole discretion without notice.\n"
        "2. The Consultant may terminate only after 180 days and must pay a termination fee.\n"
        "3. Invoices are payable in USD only. Delays attract 36% annual interest.\n"
        "4. Consultant shall be liable for all indirect, consequential and punitive damages without any cap.\n"
        "5. Consultant provides unconditional and irrevocable indemnity for any and all losses regardless of fault.\n"
        "6. Arbitration seated in Singapore under foreign law.\n"
    )

    safe_response = post_analyze(data={"contract_text": safe_contract})
    risky_response = post_analyze(data={"contract_text": risky_contract})

    assert safe_response.status_code == 200
    assert risky_response.status_code == 200

    safe_payload = safe_response.json()
    risky_payload = risky_response.json()

    assert safe_payload["risk_level"] == "low"
    assert risky_payload["risk_level"] == "high"
    assert safe_payload["risk_score"] < risky_payload["risk_score"]


def test_employment_one_sided_clauses_not_low_risk():
    runtime_state.legacy_analyzer = None

    employment_text = (
        "The Company reserves the right to change duties at its sole discretion without prior notice.\n"
        "For a period of one year following cessation of employment, Employee shall not join any direct competitor.\n"
        "All IP created whether or not during working hours shall be sole and exclusive property of the Company.\n"
        "Unresolved disputes shall be referred to arbitration and the arbitrator shall be appointed solely by the Company.\n"
        "The Employee may be required to work beyond standard hours and on public holidays without any additional overtime compensation.\n"
    )

    response = post_analyze(data={"contract_text": employment_text})

    assert response.status_code == 200
    payload = response.json()
    assert payload["risk_level"] in {"medium", "high"}
    assert payload["risky_clauses"] >= 1
    assert any(
        any(("high risk" in note.lower()) or ("medium risk" in note.lower()) for note in clause.get("indian_risks", []))
        for clause in payload["clause_results"]
    )


def test_franchise_goodwill_and_exit_fee_detected_and_score_not_saturated():
    runtime_state.legacy_analyzer = None

    franchise_text = (
        "Franchisee shall pay an early termination fee of INR 500000 if it exits before term. "
        "The fee is non-refundable and applies only to the franchisee.\n"
        "All goodwill generated through operation of the outlet irrevocably assigns to Franchisor "
        "and Franchisee shall have no compensation for goodwill upon termination.\n"
        "Franchisor may terminate immediately without notice for any perceived brand breach.\n"
        "Disputes shall be referred to arbitration by an arbitrator appointed solely by Franchisor.\n"
    )

    response = post_analyze(data={"contract_text": franchise_text})

    assert response.status_code == 200
    payload = response.json()

    all_notes = [
        note.lower()
        for clause in payload["clause_results"]
        for note in clause.get("indian_risks", [])
    ]

    assert any("goodwill assignment" in note for note in all_notes)
    assert any("exit fee" in note for note in all_notes)
    assert payload["risk_score"] <= 96


def test_compute_final_risk_score_matches_expected_bands():
    cases = [
        ("Consultancy Safe", 0, 0, 45, (0, 20), "low"),
        ("Employment Med", 5, 3, 45, (38, 62), "medium"),
        ("Loan High", 9, 4, 51, (68, 82), "high"),
        ("Franchise VHigh", 14, 4, 58, (76, 88), "high"),
    ]

    for _name, high, medium, total, score_band, expected_verdict in cases:
        clauses = (
            [{"final_risk": "high"}] * high
            + [{"final_risk": "medium"}] * medium
            + [{"final_risk": "low"}] * (total - high - medium)
        )
        result = compute_final_risk_score(clauses)
        assert score_band[0] <= result["score"] <= score_band[1]
        assert result["verdict"] == expected_verdict


def test_compute_final_risk_score_clause_override_for_high_count():
    # Ratio-based score is moderate here due to large total, but high clause count should force HIGH verdict.
    clauses = (
        [{"final_risk": "high"}] * 8
        + [{"final_risk": "medium"}] * 1
        + [{"final_risk": "low"}] * 491
    )

    result = compute_final_risk_score(clauses)
    assert result["score"] < 68
    assert result["verdict"] == "high"


def test_spa_ma_specific_risks_are_detected_and_overall_high():
    runtime_state.legacy_analyzer = None

    spa_text = (
        "1. Material Adverse Change means any event as determined solely by the Buyer.\n"
        "2. Milestone Payment and Earnout Payment shall be determined solely by the Buyer and such determination shall be final and binding.\n"
        "3. Buyer shall have the right to set off any indemnification claims against the Purchase Price without any prior notice or consent of the Sellers.\n"
        "4. Buyer makes no representations or warranties whatsoever regarding its ability to fund the Milestone Payment or Earnout Payment.\n"
        "5. Buyer's right to claim indemnification shall not be subject to any de minimis threshold or basket; even a single rupee of Loss shall entitle full indemnification.\n"
        "6. The Buyer may in its sole discretion waive any condition precedent and the Sellers shall have no right to waive any condition precedent.\n"
        "7. If any condition precedent is not satisfied, Buyer may terminate this Agreement without any liability to the Sellers.\n"
        "8. For 4 years the Sellers shall not engage in any competing business anywhere in India.\n"
        "9. Upon termination by Buyer, Buyer shall be entitled to claim a break fee of INR 50,00,000 from the Sellers as liquidated damages.\n"
        "10. Sellers shall have no right to terminate this Agreement for any reason other than mutual consent.\n"
        "11. Any penalty, interest or liability from FEMA non-compliance shall be borne solely by the Sellers.\n"
        "12. Arbitral tribunal shall consist of 3 arbitrators, one appointed by each party and third by the two appointed arbitrators.\n"
        "13. Any amendment shall require written consent of all Parties.\n"
    )

    response = post_analyze(data={"contract_text": spa_text})
    assert response.status_code == 200
    payload = response.json()

    all_notes = [
        note.lower()
        for clause in payload["clause_results"]
        for note in clause.get("indian_risks", [])
    ]

    assert any("subjective mac" in note for note in all_notes)
    assert any("earnout/milestone" in note for note in all_notes)
    assert any("set-off" in note or "setoff" in note for note in all_notes)
    assert any("one-sided warranty structure" in note for note in all_notes)
    assert any("de minimis" in note or "basket" in note for note in all_notes)
    assert any("asymmetric waiver" in note for note in all_notes)
    assert any("terminate without liability" in note for note in all_notes)
    assert any("exit fee" in note or "break fee" in note for note in all_notes)
    assert any("no effective termination right" in note for note in all_notes)
    assert any("fema/regulatory penalties" in note for note in all_notes)

    assert payload["risk_level"] == "high"
    assert 68 <= payload["risk_score"] <= 96


def test_clause_results_count_matches_clauses_analyzed_no_truncation():
    runtime_state.legacy_analyzer = None
    # Ensure API does not truncate clause_results and create summary/stats mismatches.
    long_text = "\n".join(
        [f"{i}. Standard operational clause with no major risk indicators." for i in range(1, 62)]
    )

    response = post_analyze(data={"contract_text": long_text})
    assert response.status_code == 200
    payload = response.json()

    assert payload["clauses_analyzed"] == 61
    assert len(payload["clause_results"]) == payload["clauses_analyzed"]

    high = sum(1 for c in payload["clause_results"] if c["final_risk_level"] == "high")
    medium = sum(1 for c in payload["clause_results"] if c["final_risk_level"] == "medium")
    low = sum(1 for c in payload["clause_results"] if c["final_risk_level"] == "low")

    assert payload["high_risk_clauses"] == high
    assert payload["medium_risk_clauses"] == medium
    assert payload["low_risk_clauses"] == low
    assert f"{high} high-risk and {medium} medium-risk clauses" in payload["summary"]


def test_partnership_asymmetry_rules_detect_key_high_risks():
    runtime_state.legacy_analyzer = None

    partnership_text = (
        "1. Partner 1 shall be entitled to dissolve the partnership at any time without notice and without assigning any reason.\n"
        "2. Additional capital may be introduced by any Partner with the written consent of Partner 1 alone and consent of Partners 2 and 3 shall not be required.\n"
        "3. Partner 1 may withdraw capital without consent of other partners.\n"
        "4. Profit sharing ratio may be revised at any time by Partner 1; Partners 2 and 3 shall have no right to object.\n"
        "5. Accounts shall be prepared by an accountant appointed by Partner 1, whose determination shall be final and binding on all Partners.\n"
        "6. Partners 2 and 3 shall not be entitled to inspect the books of accounts without prior written consent of Partner 1.\n"
        "7. Partner 1 may borrow money on behalf of the Firm without limit and without consent of other Partners.\n"
        "8. Partner may be expelled for any act which in Partner 1's sole opinion is detrimental; notice period shall be 7 days.\n"
        "9. Partners 2 and 3 shall have no right to expel Partner 1.\n"
        "10. Partner 1 shall not be liable for losses even if caused directly by Partner 1's decisions.\n"
        "11. Any dispute shall be referred to a sole arbitrator appointed solely by Partner 1 from its panel; costs of arbitration shall be borne entirely by Partners 2 and 3 regardless of the outcome.\n"
        "12. Partner 1 may retain any portion of distributable profits as working capital reserve at its sole discretion without any obligation to distribute.\n"
    )

    response = post_analyze(data={"contract_text": partnership_text})
    assert response.status_code == 200
    payload = response.json()

    all_notes = [
        note.lower()
        for clause in payload["clause_results"]
        for note in clause.get("indian_risks", [])
    ]

    assert any("asymmetric dissolution" in note for note in all_notes)
    assert any("unilateral capital control" in note for note in all_notes)
    assert any("no independent check" in note for note in all_notes)
    assert any("inspect" in note and "partnership act" in note for note in all_notes)
    assert any("unlimited borrowing" in note for note in all_notes)
    assert any("subjective expulsion" in note for note in all_notes)
    assert any("no effective termination right" in note for note in all_notes)
    assert any("one-sided liability exclusion" in note for note in all_notes)
    assert any("arbitrator appointed unilaterally" in note for note in all_notes)
    assert any("arbitration costs entirely" in note for note in all_notes)
    assert any("profit retention" in note for note in all_notes)

    assert payload["risk_level"] == "high"
    assert payload["risky_clauses"] >= 8
    assert 84 <= payload["risk_score"] <= 92
