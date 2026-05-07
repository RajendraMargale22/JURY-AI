import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { contractReviewService, ContractAnalyzeResponse, RiskLevel } from '../services/contractReviewService';

type TabKey = 'summary' | 'risks' | 'groups' | 'clauses';

type FlatRisk = {
  message: string;
  risk: RiskLevel;
  clauseIndex: number;
  clauseText: string;
};

type RiskGroup = {
  icon: string;
  label: string;
  color: string;
  items: string[];
};

const badgeStyle = (risk: RiskLevel): React.CSSProperties => {
  if (risk === 'high') {
    return { background: 'rgba(248,113,113,0.18)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' };
  }
  if (risk === 'medium') {
    return { background: 'rgba(251,191,36,0.18)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' };
  }
  return { background: 'rgba(52,211,153,0.18)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' };
};

const getRiskFromNote = (note: string): RiskLevel | null => {
  const lower = note.toLowerCase();
  if (lower.includes('high risk')) return 'high';
  if (lower.includes('medium risk')) return 'medium';
  if (lower.includes('low risk')) return 'low';
  return null;
};

const RiskBadge: React.FC<{ risk: RiskLevel }> = ({ risk }) => {
  const s = badgeStyle(risk);
  return (
    <span
      style={{
        ...s,
        borderRadius: 6,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
        fontFamily: 'monospace',
      }}
    >
      {risk.toUpperCase()}
    </span>
  );
};

const ScoreArc: React.FC<{ score: number }> = ({ score }) => {
  const r = 54;
  const cx = 70;
  const cy = 70;
  const circumference = Math.PI * r;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f97316' : '#22c55e';

  return (
    <svg width={140} height={90} viewBox="0 0 140 90">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontSize={28} fontWeight={800} fontFamily="monospace">
        {score}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={11} fontFamily="monospace">
        /100
      </text>
    </svg>
  );
};

const categorizeRisk = (message: string): string => {
  const lower = message.toLowerCase();
  if (lower.includes('interest') || lower.includes('payment') || lower.includes('penal') || lower.includes('loan')) {
    return 'money';
  }
  if (lower.includes('assignment') || lower.includes('amend') || lower.includes('deemed acceptance') || lower.includes('sole discretion amendment')) {
    return 'control';
  }
  if (lower.includes('guarantee') || lower.includes('liability') || lower.includes('indemnity')) {
    return 'liability';
  }
  if (lower.includes('sarfaesi') || lower.includes('default') || lower.includes('notice') || lower.includes('waiver')) {
    return 'rights';
  }
  if (lower.includes('data') || lower.includes('privacy') || lower.includes('consent') || lower.includes('credit bureau')) {
    return 'privacy';
  }
  return 'other';
};

const ContractReviewPage: React.FC = () => {
  const [contractText, setContractText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContractAnalyzeResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [showAllClauses, setShowAllClauses] = useState(false);
  const [documentAnalysisEnabled, setDocumentAnalysisEnabled] = useState(true);

  useEffect(() => {
    const fetchFeatureSettings = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/auth/settings`);
        if (!response.ok) return;
        const data = await response.json();
        const payload = data?.data || data;
        setDocumentAnalysisEnabled(payload?.documentAnalysisEnabled !== false);
      } catch (error) {
        console.error('Failed to fetch feature settings for contract review:', error);
      }
    };

    fetchFeatureSettings();
  }, []);

  const canAnalyze = useMemo(() => Boolean((contractText && contractText.trim()) || file), [contractText, file]);

  const flatRisks = useMemo<FlatRisk[]>(() => {
    if (!result) return [];

    const risks: FlatRisk[] = [];
    result.clause_results.forEach((row, index) => {
      row.indian_risks.forEach((note) => {
        const risk = getRiskFromNote(note);
        if (!risk) return;
        if (risk === 'low') return;
        risks.push({
          message: note,
          risk,
          clauseIndex: index + 1,
          clauseText: row.clause_text,
        });
      });
    });

    return risks;
  }, [result]);

  const uniqueTopRisks = useMemo(() => {
    const seen = new Set<string>();
    const ordered = [...flatRisks].sort((a, b) => {
      const weight = (r: RiskLevel) => (r === 'high' ? 2 : r === 'medium' ? 1 : 0);
      return weight(b.risk) - weight(a.risk);
    });
    return ordered.filter((r) => {
      if (seen.has(r.message)) return false;
      seen.add(r.message);
      return true;
    }).slice(0, 5);
  }, [flatRisks]);

  const groupedRisks = useMemo<RiskGroup[]>(() => {
    const map: Record<string, RiskGroup> = {
      money: { icon: '💰', label: 'Money & Interest', color: '#ef4444', items: [] },
      rights: { icon: '⚖️', label: 'Legal Rights & Enforcement', color: '#ef4444', items: [] },
      liability: { icon: '🔒', label: 'Guarantee & Liability', color: '#ef4444', items: [] },
      control: { icon: '📋', label: 'Contract Control', color: '#f97316', items: [] },
      privacy: { icon: '🛡️', label: 'Data & Consent', color: '#f97316', items: [] },
      other: { icon: '📌', label: 'Other Risks', color: '#f97316', items: [] },
    };

    const dedupe = new Set<string>();
    flatRisks.forEach((r) => {
      if (dedupe.has(r.message)) return;
      dedupe.add(r.message);
      map[categorizeRisk(r.message)].items.push(r.message);
    });

    return Object.values(map).filter((g) => g.items.length > 0);
  }, [flatRisks]);

  const recommendedActions = useMemo(() => {
    const actions: string[] = [];
    const has = (token: string) => flatRisks.some((r) => r.message.toLowerCase().includes(token));

    if (has('interest') || has('penal')) actions.push('Negotiate interest/penalty terms and cap penal rates.');
    if (has('without notice') || has('waiver')) actions.push('Require fair notice periods before enforcement actions.');
    if (has('sole discretion') || has('deemed acceptance') || has('unilateral')) actions.push('Remove unilateral amendment/discretion clauses or add mutual consent.');
    if (has('guarantee') || has('liability')) actions.push('Limit personal guarantee/liability scope and add clear caps.');
    if (has('data') || has('consent')) actions.push('Add explicit consent and purpose limits for data sharing.');
    actions.push('Consult a qualified lawyer before signing.');

    return Array.from(new Set(actions)).slice(0, 6);
  }, [flatRisks]);

  const filteredClauseResults = useMemo(() => {
    if (!result) {
      return [] as ContractAnalyzeResponse['clause_results'];
    }
    if (showAllClauses) {
      return result.clause_results;
    }
    return result.clause_results.filter(
      (row) => row.final_risk_level !== 'low' || row.indian_risks.some((n) => {
        const risk = getRiskFromNote(n);
        return risk === 'high' || risk === 'medium';
      }),
    );
  }, [result, showAllClauses]);

  const riskCounts = useMemo(() => {
    if (!result) {
      return { high: 0, medium: 0, low: 0 };
    }

    const high = typeof result.high_risk_clauses === 'number'
      ? result.high_risk_clauses
      : result.clause_results.filter((r) => r.final_risk_level === 'high').length;
    const medium = typeof result.medium_risk_clauses === 'number'
      ? result.medium_risk_clauses
      : result.clause_results.filter((r) => r.final_risk_level === 'medium').length;
    const low = typeof result.low_risk_clauses === 'number'
      ? result.low_risk_clauses
      : result.clause_results.filter((r) => r.final_risk_level === 'low').length;

    return { high, medium, low };
  }, [result]);

  const onAnalyze = async () => {
    if (!documentAnalysisEnabled || !canAnalyze || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await contractReviewService.analyzeContract(contractText, file || undefined);
      setResult(response);
      setActiveTab('summary');
      setShowAllClauses(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze contract');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 1200 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0" style={{ color: '#e2e8f0' }}>Contract Review</h2>
        <div className="d-flex gap-2">
          <Link to="/" className="btn btn-outline-light home-nav-btn btn-sm">Home</Link>
          <Link to="/chat" className="btn btn-outline-info btn-sm">AI Chat</Link>
        </div>
      </div>

      <div className="card border-0 mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="card-body">
          {!documentAnalysisEnabled && (
            <div className="alert alert-warning">
              Contract review is currently disabled by admin settings.
            </div>
          )}
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label text-light">Paste contract text (optional)</label>
              <textarea
                className="form-control"
                rows={8}
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                placeholder="Paste your agreement/contract text here..."
                disabled={!documentAnalysisEnabled}
              />
            </div>
            <div className="col-md-8">
              <label className="form-label text-light">Upload file (optional: PDF/DOCX/TXT)</label>
              <input
                type="file"
                className="form-control"
                accept=".pdf,.docx,.txt,.md"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={!documentAnalysisEnabled}
              />
              {file && <small className="text-info">Selected: {file.name}</small>}
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button className="btn btn-primary w-100" onClick={onAnalyze} disabled={!documentAnalysisEnabled || !canAnalyze || loading}>
                {loading ? 'Analyzing...' : 'Analyze Contract'}
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
        </div>
      </div>

      {result && (
        <>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 100%)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              padding: '20px 24px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '0 0 auto' }}>
              <ScoreArc score={result.risk_score} />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <RiskBadge risk={result.risk_level} />
                <span className="text-secondary small text-uppercase">Source: {result.source}</span>
              </div>
              <p className="mb-0 text-light" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>
                {result.risk_score >= 70
                  ? 'This agreement is materially one-sided. Strongly review before signing.'
                  : result.risk_score >= 40
                    ? 'This agreement has important risks. Negotiate key clauses before signing.'
                    : 'This agreement appears relatively balanced, with some clauses to review.'}
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                <div>
                  <span className="text-light fw-bold" style={{ fontFamily: 'monospace', fontSize: 20 }}>{result.clauses_analyzed}</span>
                  <span className="text-secondary small ms-1">Clauses</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <span className="fw-bold" style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: 20 }}>
                    {riskCounts.high}
                  </span>
                  <span className="text-secondary small ms-1">High</span>
                </div>
                <div>
                  <span className="fw-bold" style={{ color: '#f97316', fontFamily: 'monospace', fontSize: 20 }}>
                    {riskCounts.medium}
                  </span>
                  <span className="text-secondary small ms-1">Medium</span>
                </div>
                <div>
                  <span className="fw-bold" style={{ color: '#22c55e', fontFamily: 'monospace', fontSize: 20 }}>
                    {riskCounts.low}
                  </span>
                  <span className="text-secondary small ms-1">Low</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 4 }}>
            {[
              { id: 'summary', label: '📋 Summary' },
              { id: 'risks', label: '🔴 Key Risks' },
              { id: 'groups', label: '📂 By Category' },
              { id: 'clauses', label: '📄 Clauses' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabKey)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: activeTab === tab.id ? '#e6edf3' : 'rgba(255,255,255,0.4)',
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'summary' && (
            <>
              <div className="card border-0 mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="card-body">
                  <h5 className="text-light">Summary</h5>
                  <p className="text-light mb-0">{result.summary}</p>
                </div>
              </div>

              <div className="card border-0" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="card-body">
                  <h5 className="mb-3" style={{ color: '#ef4444' }}>Recommended Actions</h5>
                  <ul className="mb-0 text-light">
                    {recommendedActions.map((a, i) => (
                      <li key={`${a}-${i}`}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {activeTab === 'risks' && (
            <div className="d-flex flex-column gap-2 mb-3">
              {uniqueTopRisks.length === 0 ? (
                <div className="text-secondary">No major high/medium risk findings.</div>
              ) : (
                uniqueTopRisks.map((r, i) => (
                  <div key={`${r.message}-${i}`} className="card border-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div className="text-light fw-semibold">{r.message}</div>
                        <RiskBadge risk={r.risk} />
                      </div>
                      <div className="text-secondary small">
                        Clause #{r.clauseIndex}: {r.clauseText.slice(0, 180)}{r.clauseText.length > 180 ? '...' : ''}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="d-flex flex-column gap-2 mb-3">
              {groupedRisks.map((g) => (
                <div key={g.label} className="card border-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span style={{ fontSize: 18 }}>{g.icon}</span>
                      <span className="text-light fw-semibold">{g.label}</span>
                      <span className="ms-auto" style={{ color: g.color, fontFamily: 'monospace' }}>{g.items.length} issues</span>
                    </div>
                    <ul className="mb-0 text-light">
                      {g.items.slice(0, 4).map((item, i) => (
                        <li key={`${item}-${i}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'clauses' && (
            <div className="card border-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="text-light mb-0">Clause-Level Analysis</h5>
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={() => setShowAllClauses((prev) => !prev)}
                  >
                    {showAllClauses ? 'Show risky only' : `Show all (${result.clause_results.length})`}
                  </button>
                </div>
                {!showAllClauses && (
                  <div className="text-secondary small mb-2">
                    Showing risky/material clauses only ({filteredClauseResults.length}).
                  </div>
                )}
                <div className="table-responsive">
                  <table className="table table-dark table-striped align-middle">
                    <thead>
                      <tr>
                        <th>Clause</th>
                        <th>ML Risk</th>
                        <th>ML Source</th>
                        <th>Confidence</th>
                        <th>Indian Risks</th>
                        <th>Final Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClauseResults.map((row, idx) => (
                        <tr key={`${idx}-${row.clause_text.slice(0, 24)}`}>
                          <td style={{ minWidth: 280 }}>{row.clause_text}</td>
                          <td>
                            <span className="badge" style={badgeStyle(row.ml_risk_level)}>{row.ml_risk_level}</span>
                          </td>
                          <td><span className="text-uppercase">{row.ml_source}</span></td>
                          <td>{Math.round(row.ml_confidence * 100)}%</td>
                          <td>
                            {row.indian_risks.length === 0 ? (
                              <span className="text-secondary">None</span>
                            ) : (
                              <ul className="mb-0">
                                {row.indian_risks.map((risk, i) => <li key={`${risk}-${i}`}>{risk}</li>)}
                              </ul>
                            )}
                          </td>
                          <td>
                            <span className="badge" style={badgeStyle(row.final_risk_level)}>{row.final_risk_level}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContractReviewPage;
