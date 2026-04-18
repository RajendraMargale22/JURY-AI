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

type SortOption = 'verified' | 'experience' | 'feeLow' | 'feeHigh' | 'name';

interface ConsultationRequest {
  id: string;
  lawyerId: string;
  lawyerName: string;
  mode: string;
  preferredDate: string;
  note: string;
  status: 'pending';
  createdAt: string;
}

const getSafeMailtoHref = (email: string): string | undefined => {
  const value = (email || '').trim();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return isValidEmail ? `mailto:${encodeURIComponent(value)}` : undefined;
};

const getSafeTelHref = (phone: string): string | undefined => {
  const value = (phone || '').trim();
  const normalized = value.replace(/[^\d+\-()\s]/g, '');
  const hasDigits = /\d{6,}/.test(normalized);
  return hasDigits ? `tel:${normalized}` : undefined;
};

const LawyerNetworkPage: React.FC = () => {
  const { isAuthenticated, user, updateUser } = useAuth();

  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [featuredLawyers, setFeaturedLawyers] = useState<Lawyer[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('verified');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationForm, setConsultationForm] = useState({
    mode: 'video',
    preferredDate: '',
    note: ''
  });
  const [myRequests, setMyRequests] = useState<ConsultationRequest[]>([]);

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

  useEffect(() => {
    const loadFeaturedLawyers = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/lawyers/featured?limit=4`);
        if (!response.ok) return;
        const data = await response.json();
        const list = (data?.data?.lawyers || data?.lawyers || []) as Lawyer[];
        setFeaturedLawyers(list);
      } catch (error) {
        console.error('Could not load featured lawyers', error);
      }
    };

    const savedFavorites = localStorage.getItem('lawyerNetworkFavorites');
    const savedRequests = localStorage.getItem('lawyerConsultRequests');

    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      } catch {
        // ignore invalid storage
      }
    }

    if (savedRequests) {
      try {
        const parsed = JSON.parse(savedRequests);
        if (Array.isArray(parsed)) {
          setMyRequests(parsed);
        }
      } catch {
        // ignore invalid storage
      }
    }

    loadFeaturedLawyers();
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadLawyers();
  };

  const canApplyAsLawyer = useMemo(() => isAuthenticated && user?.role === 'user', [isAuthenticated, user]);

  const uniqueCities = useMemo(
    () => Array.from(new Set(lawyers.map((l) => l.city).filter(Boolean))).sort(),
    [lawyers]
  );

  const uniqueLanguages = useMemo(
    () => Array.from(new Set(lawyers.flatMap((l) => l.languages || []).filter(Boolean))).sort(),
    [lawyers]
  );

  const filteredLawyers = useMemo(() => {
    let list = [...lawyers];

    if (cityFilter) {
      list = list.filter((lawyer) => lawyer.city === cityFilter);
    }

    if (languageFilter) {
      list = list.filter((lawyer) => (lawyer.languages || []).includes(languageFilter));
    }

    switch (sortBy) {
      case 'experience':
        list.sort((a, b) => (b.experience || 0) - (a.experience || 0));
        break;
      case 'feeLow':
        list.sort((a, b) => (a.consultationFee || 0) - (b.consultationFee || 0));
        break;
      case 'feeHigh':
        list.sort((a, b) => (b.consultationFee || 0) - (a.consultationFee || 0));
        break;
      case 'name':
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'verified':
      default:
        list.sort((a, b) => Number(b.verified) - Number(a.verified));
    }

    return list;
  }, [lawyers, cityFilter, languageFilter, sortBy]);

  const toggleFavorite = (lawyerId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(lawyerId)
        ? prev.filter((id) => id !== lawyerId)
        : [...prev, lawyerId];
      localStorage.setItem('lawyerNetworkFavorites', JSON.stringify(next));
      return next;
    });
  };

  const requestConsultationFor = (lawyer: Lawyer) => {
    if (!isAuthenticated) {
      toast.info('Please login to request consultation');
      return;
    }

    if (!lawyer.verified) {
      toast.info('This lawyer profile is not verified yet');
      return;
    }

    setSelectedLawyer(lawyer);
    setConsultationForm({ mode: 'video', preferredDate: '', note: '' });
    setShowConsultationModal(true);
  };

  const submitConsultationRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLawyer) return;

    const request: ConsultationRequest = {
      id: `${Date.now()}`,
      lawyerId: selectedLawyer.id,
      lawyerName: selectedLawyer.name,
      mode: consultationForm.mode,
      preferredDate: consultationForm.preferredDate,
      note: consultationForm.note.trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const next = [request, ...myRequests].slice(0, 20);
    setMyRequests(next);
    localStorage.setItem('lawyerConsultRequests', JSON.stringify(next));
    setShowConsultationModal(false);
    toast.success(`Consultation request sent to ${selectedLawyer.name}`);
  };

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

      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/lawyers/apply`, {
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
            <Link to="/" className="btn btn-outline-light home-nav-btn btn-sm">Back to Home</Link>
            {canApplyAsLawyer && (
              <button className="btn btn-info btn-sm" onClick={() => setShowApply(true)}>
                Add me as Lawyer
              </button>
            )}
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="card-body">
                <div className="small text-uppercase" style={{ color: 'rgba(255,255,255,0.55)' }}>Total Lawyers</div>
                <h4 className="mb-0">{lawyers.length}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="card-body">
                <div className="small text-uppercase" style={{ color: 'rgba(255,255,255,0.55)' }}>Verified</div>
                <h4 className="mb-0">{lawyers.filter((l) => l.verified).length}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="card-body">
                <div className="small text-uppercase" style={{ color: 'rgba(255,255,255,0.55)' }}>Specializations</div>
                <h4 className="mb-0">{specializations.length}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="card-body">
                <div className="small text-uppercase" style={{ color: 'rgba(255,255,255,0.55)' }}>My Requests</div>
                <h4 className="mb-0">{myRequests.length}</h4>
              </div>
            </div>
          </div>
        </div>

        {featuredLawyers.length > 0 && (
          <div className="card mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Featured Lawyers</h5>
                <small style={{ color: 'rgba(255,255,255,0.55)' }}>Top verified profiles</small>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                {featuredLawyers.map((lawyer) => (
                  <button
                    key={lawyer.id}
                    className="btn btn-sm btn-outline-info"
                    type="button"
                    onClick={() => setSelectedLawyer(lawyer)}
                  >
                    {lawyer.name} • {lawyer.experience}y
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="card mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="card-body">
            <form className="row g-3" onSubmit={onSearch}>
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Search by name, city, specialization"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="col-md-3">
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
              <div className="col-md-2">
                <select className="form-select" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                  <option value="">All cities</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
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
              <div className="col-md-3">
                <select className="form-select" value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}>
                  <option value="">All languages</option>
                  {uniqueLanguages.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
                  <option value="verified">Sort: Verified first</option>
                  <option value="experience">Sort: Experience</option>
                  <option value="feeLow">Sort: Fee low to high</option>
                  <option value="feeHigh">Sort: Fee high to low</option>
                  <option value="name">Sort: Name A-Z</option>
                </select>
              </div>
            </form>
          </div>
        </div>

        {!!myRequests.length && (
          <div className="card mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="card-body">
              <h6 className="mb-3">My Consultation Requests</h6>
              <div className="d-flex flex-column gap-2">
                {myRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="d-flex justify-content-between align-items-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div>
                      <div className="fw-semibold">{request.lawyerName}</div>
                      <small style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {request.mode} • {new Date(request.preferredDate).toLocaleString()}
                      </small>
                    </div>
                    <span className="badge bg-warning text-dark">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-info" /></div>
        ) : (
          <div className="row g-3">
            {filteredLawyers.map((lawyer) => (
              <div className="col-md-6 col-lg-4" key={lawyer.id}>
                <div className="card h-100" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="mb-0">{lawyer.name}</h5>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm p-0 border-0 bg-transparent"
                          title={favorites.includes(lawyer.id) ? 'Remove favorite' : 'Add favorite'}
                          onClick={() => toggleFavorite(lawyer.id)}
                        >
                          <i className={`${favorites.includes(lawyer.id) ? 'fas' : 'far'} fa-heart`} style={{ color: favorites.includes(lawyer.id) ? '#ff6b81' : 'rgba(255,255,255,0.6)' }} />
                        </button>
                        <span className={`badge ${statusBadge(lawyer)}`}>{lawyer.verificationStatus}</span>
                      </div>
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
                    <div className="mt-auto d-flex gap-2 flex-wrap">
                      <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setSelectedLawyer(lawyer)}>
                        Profile
                      </button>
                      {getSafeMailtoHref(lawyer.email) ? (
                        <a className="btn btn-outline-info btn-sm" href={getSafeMailtoHref(lawyer.email)}>Email</a>
                      ) : (
                        <button className="btn btn-outline-info btn-sm" disabled>Email</button>
                      )}
                      {getSafeTelHref(lawyer.phone) ? (
                        <a className="btn btn-outline-light btn-sm" href={getSafeTelHref(lawyer.phone)}>Call</a>
                      ) : (
                        <button className="btn btn-outline-light btn-sm" disabled>Call</button>
                      )}
                      <button className="btn btn-primary btn-sm" type="button" disabled={!lawyer.verified} onClick={() => requestConsultationFor(lawyer)}>
                        Request Consultation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {!filteredLawyers.length && (
              <div className="col-12 text-center py-5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                No lawyers found for current filters.
              </div>
            )}
          </div>
        )}
      </div>

      {selectedLawyer && !showConsultationModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedLawyer.name} • Lawyer Profile</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedLawyer(null)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6"><strong>City:</strong> {selectedLawyer.city || 'N/A'}</div>
                  <div className="col-md-6"><strong>Experience:</strong> {selectedLawyer.experience} years</div>
                  <div className="col-md-6"><strong>Consultation Fee:</strong> ₹{selectedLawyer.consultationFee || 0}</div>
                  <div className="col-md-6"><strong>Status:</strong> {selectedLawyer.verificationStatus}</div>
                  <div className="col-12"><strong>Specializations:</strong> {(selectedLawyer.specialization || []).join(', ') || 'N/A'}</div>
                  <div className="col-12"><strong>Languages:</strong> {(selectedLawyer.languages || []).join(', ') || 'N/A'}</div>
                  <div className="col-12"><strong>Bio:</strong> {selectedLawyer.bio || 'No bio provided yet.'}</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedLawyer(null)}>Close</button>
                <button type="button" className="btn btn-primary" disabled={!selectedLawyer.verified} onClick={() => requestConsultationFor(selectedLawyer)}>
                  Request Consultation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConsultationModal && selectedLawyer && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Request Consultation • {selectedLawyer.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowConsultationModal(false)} />
              </div>
              <form onSubmit={submitConsultationRequest}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Mode</label>
                    <select
                      className="form-select"
                      value={consultationForm.mode}
                      onChange={(e) => setConsultationForm((prev) => ({ ...prev, mode: e.target.value }))}
                    >
                      <option value="video">Video Call</option>
                      <option value="phone">Phone Call</option>
                      <option value="in-person">In-person</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Preferred Date & Time</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={consultationForm.preferredDate}
                      onChange={(e) => setConsultationForm((prev) => ({ ...prev, preferredDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Case Note (optional)</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Briefly describe what legal help you need"
                      value={consultationForm.note}
                      onChange={(e) => setConsultationForm((prev) => ({ ...prev, note: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowConsultationModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Send Request</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {(selectedLawyer || showConsultationModal) && (
        <div
          className="modal-backdrop show"
          onClick={() => {
            if (showConsultationModal) {
              setShowConsultationModal(false);
            } else {
              setSelectedLawyer(null);
            }
          }}
        />
      )}

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
