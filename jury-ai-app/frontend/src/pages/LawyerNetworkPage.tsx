import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

interface Lawyer {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  specialization: string[];
  experience: number;
  city: string;
  consultationFee: number;
  languages: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'suspended';
  verified: boolean;
}

interface LawyerResponse {
  lawyers: Lawyer[];
  filters?: {
    specializations?: string[];
  };
  pagination?: {
    totalPages: number;
  };
}

const LawyerNetworkPage: React.FC = () => {
  const { isAuthenticated, user, updateUser } = useAuth();

  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [loading, setLoading] = useState(false);

  const [showApply, setShowApply] = useState(false);
  const [applying, setApplying] = useState(false);
  const [formData, setFormData] = useState({
    specialization: '',
    barNumber: '',
    experience: '',
    city: '',
    consultationFee: '',
    languages: '',
    phone: '',
    bio: ''
  });

  const loadLawyers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '18',
        search,
        specialization,
        verifiedOnly: verifiedOnly ? 'true' : 'false'
      });

      const response = await fetch(`/api/lawyers/public?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load lawyers');
      }

      const data: LawyerResponse = await response.json();
      setLawyers(data.lawyers || []);
      setSpecializations(data.filters?.specializations || []);
    } catch (error) {
      console.error(error);
      toast.error('Could not load lawyer network');
      setLawyers([]);
    } finally {
      setLoading(false);
    }
  }, [search, specialization, verifiedOnly]);

  useEffect(() => {
    loadLawyers();
  }, [loadLawyers]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadLawyers();
  };

  const canApplyAsLawyer = useMemo(() => isAuthenticated && user?.role === 'user', [isAuthenticated, user]);

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info('Please login first');
      return;
    }

    setApplying(true);
    try {
      const payload = {
        ...formData,
        specialization: formData.specialization
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        languages: formData.languages
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        experience: Number(formData.experience || '0'),
        consultationFee: Number(formData.consultationFee || '0')
      };

      const response = await fetch('/api/lawyers/apply', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Application failed');
      }

      toast.success('Application submitted for verification');
      updateUser({ role: 'lawyer' });
      setShowApply(false);
      loadLawyers();
    } catch (error: any) {
      toast.error(error.message || 'Could not submit application');
    } finally {
      setApplying(false);
    }
  };

  const statusBadge = (lawyer: Lawyer) => {
    if (lawyer.verificationStatus === 'verified') return 'bg-success';
    if (lawyer.verificationStatus === 'pending') return 'bg-warning text-dark';
    if (lawyer.verificationStatus === 'rejected') return 'bg-danger';
    return 'bg-secondary';
  };

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #0b1220 0%, #0f172a 100%)', color: '#fff' }}>
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Lawyer Network</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Find and contact legal professionals.</p>
          </div>
          <div className="d-flex gap-2">
            <Link to="/" className="btn btn-outline-light btn-sm">Back to Home</Link>
            {canApplyAsLawyer && (
              <button className="btn btn-info btn-sm" onClick={() => setShowApply(true)}>
                Add me as Lawyer
              </button>
            )}
          </div>
        </div>

        <div className="card mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="card-body">
            <form className="row g-3" onSubmit={onSearch}>
              <div className="col-md-5">
                <input
                  className="form-control"
                  placeholder="Search by name, city, specialization"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                >
                  <option value="">All specializations</option>
                  {specializations.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-center justify-content-between">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    id="verifiedOnly"
                  />
                  <label className="form-check-label" htmlFor="verifiedOnly">Verified only</label>
                </div>
                <button className="btn btn-primary btn-sm" type="submit">Search</button>
              </div>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-info" /></div>
        ) : (
          <div className="row g-3">
            {lawyers.map((lawyer) => (
              <div className="col-md-6 col-lg-4" key={lawyer.id}>
                <div className="card h-100" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="mb-0">{lawyer.name}</h5>
                      <span className={`badge ${statusBadge(lawyer)}`}>{lawyer.verificationStatus}</span>
                    </div>
                    <p className="mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <i className="fas fa-briefcase me-2" /> {lawyer.experience} years
                    </p>
                    <p className="mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <i className="fas fa-location-dot me-2" /> {lawyer.city || 'City not listed'}
                    </p>
                    <p className="mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <i className="fas fa-indian-rupee-sign me-2" /> ₹{lawyer.consultationFee || 0} / consult
                    </p>
                    <div className="mb-2">
                      {(lawyer.specialization || []).slice(0, 3).map((sp) => (
                        <span key={sp} className="badge bg-secondary me-1 mb-1">{sp}</span>
                      ))}
                    </div>
                    <p className="small" style={{ color: 'rgba(255,255,255,0.65)' }}>{lawyer.bio || 'No bio added yet.'}</p>
                    <div className="mt-auto d-flex gap-2">
                      <a className="btn btn-outline-info btn-sm" href={`mailto:${lawyer.email}`}>Email</a>
                      {lawyer.phone ? (
                        <a className="btn btn-outline-light btn-sm" href={`tel:${lawyer.phone}`}>Call</a>
                      ) : (
                        <button className="btn btn-outline-light btn-sm" disabled>Call</button>
                      )}
                      <button className="btn btn-primary btn-sm" disabled={!lawyer.verified}>
                        Request Consultation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {!lawyers.length && (
              <div className="col-12 text-center py-5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                No lawyers found for current filters.
              </div>
            )}
          </div>
        )}
      </div>

      {showApply && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Apply as Lawyer</h5>
                <button type="button" className="btn-close" onClick={() => setShowApply(false)} />
              </div>
              <form onSubmit={submitApplication}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Specialization(s)</label>
                      <input className="form-control" placeholder="Criminal Law, Civil Law" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Bar Number</label>
                      <input className="form-control" value={formData.barNumber} onChange={(e) => setFormData({ ...formData, barNumber: e.target.value })} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Experience (years)</label>
                      <input className="form-control" type="number" min={0} value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">City</label>
                      <input className="form-control" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Consultation Fee</label>
                      <input className="form-control" type="number" min={0} value={formData.consultationFee} onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Languages</label>
                      <input className="form-control" placeholder="English, Hindi" value={formData.languages} onChange={(e) => setFormData({ ...formData, languages: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone</label>
                      <input className="form-control" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Short Bio</label>
                      <textarea className="form-control" rows={3} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowApply(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={applying}>
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LawyerNetworkPage;
