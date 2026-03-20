const CONTRACT_REVIEW_API_URL =
  process.env.REACT_APP_CONTRACT_REVIEW_API_URL || 'http://localhost:8001';
const CONTRACT_REVIEW_API_KEY =
  process.env.REACT_APP_CONTRACT_REVIEW_API_KEY || 'dev-local-key';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface ClauseResult {
  clause_text: string;
  ml_risk_level: RiskLevel;
  ml_confidence: number;
  ml_source: 'ml' | 'heuristic';
  indian_risks: string[];
  final_risk_level: RiskLevel;
}

export interface ContractAnalyzeResponse {
  success: boolean;
  summary: string;
  document_type: string;
  risk_level: RiskLevel;
  risk_score: number;
  key_clauses_found: string[];
  missing_clauses: string[];
  suggestions: string[];
  clauses_analyzed: number;
  risky_clauses: number;
  high_risk_clauses: number;
  medium_risk_clauses: number;
  low_risk_clauses: number;
  clause_results: ClauseResult[];
  source: 'legacy' | 'native';
}

export const contractReviewService = {
  async analyzeContract(contractText?: string, file?: File): Promise<ContractAnalyzeResponse> {
    const formData = new FormData();

    if (contractText && contractText.trim()) {
      formData.append('contract_text', contractText.trim());
    }
    if (file) {
      formData.append('file', file);
    }

    const response = await fetch(`${CONTRACT_REVIEW_API_URL}/contract-review/analyze`, {
      method: 'POST',
      headers: {
        'X-API-Key': CONTRACT_REVIEW_API_KEY,
      },
      body: formData,
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.message || 'Contract analysis failed');
    }

    return payload as ContractAnalyzeResponse;
  },
};
