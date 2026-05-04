from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict, Any


class ClauseResult(BaseModel):
    clause_text: str
    ml_risk_level: Literal["low", "medium", "high"]
    ml_confidence: float = Field(ge=0, le=1)
    ml_source: Literal["ml", "heuristic"]
    indian_risks: List[str]
    final_risk_level: Literal["low", "medium", "high"]


class AnalyzeContractResponse(BaseModel):
    success: bool = True
    message: str = "Contract analysis completed"
    requestId: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    summary: str
    document_type: str
    risk_level: Literal["low", "medium", "high"]
    risk_score: int = Field(ge=0, le=100)
    key_clauses_found: List[str]
    missing_clauses: List[str]
    suggestions: List[str]
    clauses_analyzed: int = 0
    risky_clauses: int = 0
    high_risk_clauses: int = 0
    medium_risk_clauses: int = 0
    low_risk_clauses: int = 0
    clause_results: List[ClauseResult] = []
    source: Literal["legacy", "native", "ml"]


class HealthResponse(BaseModel):
    success: bool = True
    message: str = "Health check successful"
    requestId: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    status: str
    service: str
    legacy_loaded: bool
    version: str
