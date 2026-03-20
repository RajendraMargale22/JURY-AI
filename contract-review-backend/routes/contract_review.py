from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import JSONResponse
from models.schemas import AnalyzeContractResponse
from services.document_parser import save_upload_file, extract_contract_text
from services.review_engine import analyze_contract_native
from services.clause_extraction import split_into_clauses
from services.indian_rules_enhanced import (
    apply_indian_rules,
    compute_final_risk_score as compute_final_risk_score_enhanced,
)
from services.ml_classifier import classify_clause_optional, classify_clauses_optional
from middlewares.security import enforce_rate_limit
from services import runtime_state
from logger import logger
from typing import Optional

router = APIRouter(prefix="/contract-review", tags=["contract-review"])


def _normalize_legacy_payload(payload: dict) -> AnalyzeContractResponse:
    clause_results = payload.get("clause_results", [])
    high_count = sum(1 for row in clause_results if row.get("final_risk_level") == "high")
    medium_count = sum(1 for row in clause_results if row.get("final_risk_level") == "medium")
    low_count = max(0, len(clause_results) - high_count - medium_count)

    return AnalyzeContractResponse(
        success=True,
        summary=payload.get("summary", "Legacy analysis completed"),
        document_type=payload.get("document_type", "contract"),
        risk_level=payload.get("risk_level", "medium"),
        risk_score=int(payload.get("risk_score", 50)),
        key_clauses_found=payload.get("key_clauses_found", []),
        missing_clauses=payload.get("missing_clauses", []),
        suggestions=payload.get("suggestions", ["Review output with a legal expert."]),
        clauses_analyzed=int(payload.get("clauses_analyzed", 0)),
        risky_clauses=int(payload.get("risky_clauses", 0)),
        high_risk_clauses=int(payload.get("high_risk_clauses", high_count)),
        medium_risk_clauses=int(payload.get("medium_risk_clauses", medium_count)),
        low_risk_clauses=int(payload.get("low_risk_clauses", low_count)),
        clause_results=clause_results,
        source="legacy",
    )


def _merge_risk_levels(ml_level: str, indian_risks: list[str], ml_source: str) -> str:
    if any("high risk" in note.lower() for note in indian_risks):
        return "high"
    if any("medium risk" in note.lower() for note in indian_risks):
        return "medium" if ml_level == "low" else ml_level
    if ml_level == "medium":
        return "low"
    return ml_level


def _build_summary(clauses_analyzed: int, risky_clauses: int, clause_results: list[dict], base_summary: str) -> str:
    if clauses_analyzed == 0:
        return base_summary

    high = sum(1 for row in clause_results if row.get("final_risk_level") == "high")
    medium = sum(1 for row in clause_results if row.get("final_risk_level") == "medium")

    notes: list[str] = []
    for row in clause_results:
        for note in row.get("indian_risks", []):
            note_lower = note.lower()
            if "high risk" in note_lower or "medium risk" in note_lower:
                notes.append(note)
    if not notes:
        for row in clause_results:
            for note in row.get("indian_risks", []):
                notes.append(note)
    unique_notes = list(dict.fromkeys(notes))[:4]

    finding_text = "; ".join(unique_notes) if unique_notes else "No major clause-level legal red flags detected"
    return (
        f"Analyzed {clauses_analyzed} clauses: {high} high-risk and {medium} medium-risk clauses. "
        f"Risky clauses identified: {risky_clauses}. Top findings: {finding_text}."
    )


def compute_final_risk_score(clauses: list[dict]) -> dict:
    # Compatibility wrapper for existing imports/tests.
    return compute_final_risk_score_enhanced(clauses)


@router.post("/analyze", response_model=AnalyzeContractResponse)
async def analyze_contract(
    contract_text: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
    _rate_limit_guard: None = Depends(enforce_rate_limit),
):
    if not contract_text and not file:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Provide either `contract_text` or `file`"
            }
        )

    extracted_text = contract_text or ""

    if file is not None:
        try:
            file_path = save_upload_file(file)
        except ValueError as error:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": str(error),
                },
            )
        file_text = extract_contract_text(file_path)
        extracted_text = f"{extracted_text}\n{file_text}".strip()

    if not extracted_text.strip():
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Could not extract readable contract text"
            }
        )

    if runtime_state.legacy_analyzer is not None:
        try:
            legacy_result = runtime_state.legacy_analyzer(extracted_text)
            return _normalize_legacy_payload(legacy_result)
        except Exception as error:  # pylint: disable=broad-except
            logger.warning(f"Legacy analyzer failed, falling back to native engine: {error}")

    native_result = analyze_contract_native(extracted_text)
    clauses = split_into_clauses(extracted_text)
    clause_results = []
    risky_clauses = 0

    ml_results = classify_clauses_optional(clauses) if clauses else []

    for idx, clause in enumerate(clauses):
        ml_result = ml_results[idx] if idx < len(ml_results) else classify_clause_optional(clause)
        indian_risks = apply_indian_rules(clause, extracted_text)
        final_risk = _merge_risk_levels(ml_result["risk_level"], indian_risks, ml_result["source"])

        has_material_indian = any(
            ("high risk" in note.lower()) or ("medium risk" in note.lower())
            for note in indian_risks
        )
        has_material_ml = (ml_result["risk_level"] == "high") or (
            ml_result["source"] != "heuristic" and ml_result["risk_level"] == "medium"
        )

        if final_risk in {"high", "medium"} and (has_material_indian or has_material_ml):
            risky_clauses += 1

        clause_results.append(
            {
                "clause_text": clause[:1000],
                "ml_risk_level": ml_result["risk_level"],
                "ml_confidence": ml_result["confidence"],
                "ml_source": ml_result["source"],
                "indian_risks": indian_risks,
                "final_risk_level": final_risk,
            }
        )

    if clauses:
        final_agg = compute_final_risk_score(clause_results)
        native_result["risk_score"] = final_agg["score"]
        native_result["risk_level"] = final_agg["verdict"]
        native_result["high_risk_clauses"] = final_agg["high"]
        native_result["medium_risk_clauses"] = final_agg["medium"]
        native_result["low_risk_clauses"] = final_agg["low"]
    else:
        native_result["high_risk_clauses"] = 0
        native_result["medium_risk_clauses"] = 0
        native_result["low_risk_clauses"] = 0

    extra_suggestions = []
    for row in clause_results:
        extra_suggestions.extend(row["indian_risks"])
    native_result["suggestions"] = list(dict.fromkeys(native_result["suggestions"] + extra_suggestions))[:20]

    summary_text = _build_summary(
        clauses_analyzed=len(clauses),
        risky_clauses=risky_clauses,
        clause_results=clause_results,
        base_summary=native_result["summary"],
    )

    return AnalyzeContractResponse(
        success=True,
        summary=summary_text,
        document_type=native_result["document_type"],
        risk_level=native_result["risk_level"],
        risk_score=native_result["risk_score"],
        key_clauses_found=native_result["key_clauses_found"],
        missing_clauses=native_result["missing_clauses"],
        suggestions=native_result["suggestions"],
        clauses_analyzed=len(clauses),
        risky_clauses=risky_clauses,
        high_risk_clauses=int(native_result.get("high_risk_clauses", 0)),
        medium_risk_clauses=int(native_result.get("medium_risk_clauses", 0)),
        low_risk_clauses=int(native_result.get("low_risk_clauses", 0)),
        clause_results=clause_results,
        source="native",
    )
