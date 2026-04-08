from fastapi import APIRouter, Depends, File, Form, UploadFile, Request
from fastapi.responses import JSONResponse
from models.schemas import AnalyzeContractResponse
from pydantic import ValidationError
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
from typing import Optional, Any

router = APIRouter(prefix="/contract-review", tags=["contract-review"])


def _to_risk_label(value: Any, *, fallback: str = "low") -> str:
    text = str(value or "").strip().lower()
    if text in {"low", "medium", "high"}:
        return text
    return fallback


def _coerce_clause_results(rows: Any) -> list[dict]:
    if not isinstance(rows, list):
        return []

    normalized: list[dict] = []
    for row in rows:
        if not isinstance(row, dict):
            continue

        ml_conf = row.get("ml_confidence", 0.5)
        try:
            ml_conf = float(ml_conf)
        except (TypeError, ValueError):
            ml_conf = 0.5
        ml_conf = min(1.0, max(0.0, ml_conf))

        indian_risks = row.get("indian_risks", [])
        if not isinstance(indian_risks, list):
            indian_risks = []

        normalized.append(
            {
                "clause_text": str(row.get("clause_text") or "")[:1000],
                "ml_risk_level": _to_risk_label(row.get("ml_risk_level"), fallback="low"),
                "ml_confidence": ml_conf,
                "ml_source": "ml" if str(row.get("ml_source") or "").lower() == "ml" else "heuristic",
                "indian_risks": [str(note) for note in indian_risks][:12],
                "final_risk_level": _to_risk_label(
                    row.get("final_risk_level", row.get("final_risk")), fallback="low"
                ),
            }
        )

    return normalized


def _detect_output_contradictions(payload: dict) -> list[str]:
    issues: list[str] = []

    key_clauses = {str(item).strip().lower() for item in payload.get("key_clauses_found", []) if str(item).strip()}
    missing_clauses = {str(item).strip().lower() for item in payload.get("missing_clauses", []) if str(item).strip()}
    overlap = sorted(key_clauses.intersection(missing_clauses))
    if overlap:
        issues.append(
            "Consistency check: clauses marked both present and missing were auto-reconciled "
            f"({', '.join(overlap[:3])})."
        )

    summary_text = str(payload.get("summary") or "").lower()
    high_count = int(payload.get("high_risk_clauses") or 0)
    risky_count = int(payload.get("risky_clauses") or 0)
    risk_level = _to_risk_label(payload.get("risk_level"), fallback="medium")

    if high_count > 0 and any(token in summary_text for token in ["no major", "no significant", "no material"]):
        issues.append("Consistency check: summary language may understate identified high-risk clauses.")

    if risky_count == 0 and risk_level in {"medium", "high"}:
        issues.append("Consistency check: overall risk is elevated but no risky clauses were counted.")

    if risk_level == "high" and high_count == 0:
        issues.append("Consistency check: overall high risk with zero high-risk clauses detected.")

    return issues


def _validate_response_payload(payload: dict, request_id: Optional[str]) -> AnalyzeContractResponse:
    adjusted = dict(payload)
    adjusted["requestId"] = request_id

    adjusted["clause_results"] = _coerce_clause_results(adjusted.get("clause_results", []))
    adjusted["clauses_analyzed"] = int(adjusted.get("clauses_analyzed", len(adjusted["clause_results"])))

    high = sum(1 for row in adjusted["clause_results"] if row.get("final_risk_level") == "high")
    medium = sum(1 for row in adjusted["clause_results"] if row.get("final_risk_level") == "medium")
    low = max(0, len(adjusted["clause_results"]) - high - medium)

    adjusted["high_risk_clauses"] = int(adjusted.get("high_risk_clauses", high))
    adjusted["medium_risk_clauses"] = int(adjusted.get("medium_risk_clauses", medium))
    adjusted["low_risk_clauses"] = int(adjusted.get("low_risk_clauses", low))
    adjusted["risky_clauses"] = int(adjusted.get("risky_clauses", high + medium))
    adjusted["risk_score"] = min(100, max(0, int(adjusted.get("risk_score", 50))))
    adjusted["risk_level"] = _to_risk_label(adjusted.get("risk_level"), fallback="medium")

    contradictions = _detect_output_contradictions(adjusted)
    if contradictions:
        suggestions = adjusted.get("suggestions", [])
        if not isinstance(suggestions, list):
            suggestions = []
        adjusted["suggestions"] = list(dict.fromkeys([*suggestions, *contradictions]))[:25]

    key_items = [str(item) for item in adjusted.get("key_clauses_found", [])]
    missing_items = [str(item) for item in adjusted.get("missing_clauses", [])]
    missing_set = {item.strip().lower() for item in missing_items if item.strip()}
    adjusted["key_clauses_found"] = [item for item in key_items if item.strip().lower() not in missing_set]

    try:
        return AnalyzeContractResponse(**adjusted)
    except ValidationError as error:
        logger.error(f"AnalyzeContractResponse validation failed: {error}")
        adjusted["source"] = "native" if adjusted.get("source") not in {"legacy", "native"} else adjusted.get("source")
        adjusted["document_type"] = str(adjusted.get("document_type") or "contract")
        adjusted["summary"] = str(adjusted.get("summary") or "Contract analysis completed with validation fallback.")
        adjusted["key_clauses_found"] = adjusted.get("key_clauses_found") or []
        adjusted["missing_clauses"] = adjusted.get("missing_clauses") or []
        adjusted["suggestions"] = adjusted.get("suggestions") or ["Review output with a legal expert."]
        return AnalyzeContractResponse(**adjusted)


def _normalize_legacy_payload(payload: dict, request_id: Optional[str]) -> AnalyzeContractResponse:
    clause_results = payload.get("clause_results", [])
    high_count = sum(1 for row in clause_results if row.get("final_risk_level") == "high")
    medium_count = sum(1 for row in clause_results if row.get("final_risk_level") == "medium")
    low_count = max(0, len(clause_results) - high_count - medium_count)

    return _validate_response_payload(
        {
            "success": True,
            "message": "Contract analysis completed",
            "data": {"source": "legacy"},
            "summary": payload.get("summary", "Legacy analysis completed"),
            "document_type": payload.get("document_type", "contract"),
            "risk_level": payload.get("risk_level", "medium"),
            "risk_score": int(payload.get("risk_score", 50)),
            "key_clauses_found": payload.get("key_clauses_found", []),
            "missing_clauses": payload.get("missing_clauses", []),
            "suggestions": payload.get("suggestions", ["Review output with a legal expert."]),
            "clauses_analyzed": int(payload.get("clauses_analyzed", 0)),
            "risky_clauses": int(payload.get("risky_clauses", 0)),
            "high_risk_clauses": int(payload.get("high_risk_clauses", high_count)),
            "medium_risk_clauses": int(payload.get("medium_risk_clauses", medium_count)),
            "low_risk_clauses": int(payload.get("low_risk_clauses", low_count)),
            "clause_results": clause_results,
            "source": "legacy",
        },
        request_id,
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
    request: Request,
    contract_text: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
    _rate_limit_guard: None = Depends(enforce_rate_limit),
):
    request_id = getattr(request.state, "request_id", None)
    if not contract_text and not file:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Provide either `contract_text` or `file`",
                "data": None,
                "requestId": request_id,
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
                    "data": None,
                    "requestId": request_id,
                },
            )
        file_text = extract_contract_text(file_path)
        extracted_text = f"{extracted_text}\n{file_text}".strip()

    if not extracted_text.strip():
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Could not extract readable contract text",
                "data": None,
                "requestId": request_id,
            }
        )

    if runtime_state.legacy_analyzer is not None:
        try:
            legacy_result = runtime_state.legacy_analyzer(extracted_text)
            return _normalize_legacy_payload(legacy_result, request_id)
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

    return _validate_response_payload(
        {
            "success": True,
            "message": "Contract analysis completed",
            "data": {"source": "native"},
            "summary": summary_text,
            "document_type": native_result["document_type"],
            "risk_level": native_result["risk_level"],
            "risk_score": native_result["risk_score"],
            "key_clauses_found": native_result["key_clauses_found"],
            "missing_clauses": native_result["missing_clauses"],
            "suggestions": native_result["suggestions"],
            "clauses_analyzed": len(clauses),
            "risky_clauses": risky_clauses,
            "high_risk_clauses": int(native_result.get("high_risk_clauses", 0)),
            "medium_risk_clauses": int(native_result.get("medium_risk_clauses", 0)),
            "low_risk_clauses": int(native_result.get("low_risk_clauses", 0)),
            "clause_results": clause_results,
            "source": "native",
        },
        request_id,
    )
