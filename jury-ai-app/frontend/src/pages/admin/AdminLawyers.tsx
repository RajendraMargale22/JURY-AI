import React, { useState, useEffect } from 'react';

interface Lawyer {
  _id: string;
  username: string;
  email: string;
  isVerified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  specializations: string[];
  experience: number;
  licenseNumber?: string;
  barAssociation?: string;
  documents: {
    name: string;
    url: string;
    uploadedAt: string;
  }[];
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

const AdminLawyers: React.FC = () => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchLawyers();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchLawyers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        status: statusFilter
      });

      const response = await fetch(`/api/admin/lawyers?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLawyers(data.lawyers || []);
        setTotalPages(data.totalPages || 1);
      } else {
        setLawyers([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      setLawyers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = async (lawyerId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const response = await fetch(`/api/admin/lawyers/${lawyerId}/verify`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, reason }),
      });

      if (response.ok) {
        fetchLawyers(); // Refresh the list
        setShowModal(false);
        setSelectedLawyer(null);
      }
    } catch (error) {
      console.error('Error updating lawyer verification:', error);
    }
  };

  const openLawyerDetails = (lawyer: Lawyer) => {
    setSelectedLawyer(lawyer);
    setShowModal(true);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success';
      case 'pending': return 'bg-warning text-dark';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(93, 208, 255, 0.15), rgba(93, 208, 255, 0.05))',
            border: '1px solid rgba(93, 208, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="card-body text-center">
              <i className="fas fa-gavel fa-2x mb-2" style={{color: '#5dd0ff'}}></i>
              <h3 style={{color: '#5dd0ff', marginBottom: '0.25rem'}}>{(lawyers || []).length}</h3>
              <p className="mb-0" style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem'}}>Total Lawyers</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05))',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="card-body text-center">
              <i className="fas fa-clock fa-2x mb-2" style={{color: '#fbbf24'}}></i>
              <h3 style={{color: '#fbbf24', marginBottom: '0.25rem'}}>{(lawyers || []).filter(l => l.verificationStatus === 'pending').length}</h3>
              <p className="mb-0" style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem'}}>Pending</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="card-body text-center">
              <i className="fas fa-check-circle fa-2x mb-2" style={{color: '#22c55e'}}></i>
              <h3 style={{color: '#22c55e', marginBottom: '0.25rem'}}>{(lawyers || []).filter(l => l.verificationStatus === 'approved').length}</h3>
              <p className="mb-0" style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem'}}>Approved</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="card-body text-center">
              <i className="fas fa-times-circle fa-2x mb-2" style={{color: '#ef4444'}}></i>
              <h3 style={{color: '#ef4444', marginBottom: '0.25rem'}}>{(lawyers || []).filter(l => l.verificationStatus === 'rejected').length}</h3>
              <p className="mb-0" style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem'}}>Rejected</p>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <button 
          className="btn" 
          onClick={fetchLawyers}
          style={{
            background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)',
            border: 'none',
            color: 'white',
            padding: '0.75rem 1.5rem',
            fontWeight: 600
          }}
        >
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4" style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="search" className="form-label">Search Lawyers</label>
                <input
                  type="text"
                  className="form-control"
                  id="search"
                  placeholder="Search by name, email, or license number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="statusFilter" className="form-label">Filter by Status</label>
                <select
                  className="form-select"
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lawyers Table */}
      <div className="card" style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="card-body">
          {(lawyers || []).length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Lawyer</th>
                      <th>License</th>
                      <th>Experience</th>
                      <th>Specializations</th>
                      <th>Status</th>
                      <th>Applied</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(lawyers || []).map((lawyer) => (
                      <tr key={lawyer._id}>
                        <td>
                          <div>
                            <strong>{lawyer.username}</strong>
                            <br />
                            <small className="text-muted">{lawyer.email}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <small className="text-muted">License #</small>
                            <br />
                            <strong>{lawyer.licenseNumber || 'N/A'}</strong>
                            <br />
                            <small className="text-muted">{lawyer.barAssociation || 'N/A'}</small>
                          </div>
                        </td>
                        <td>{lawyer.experience} years</td>
                        <td>
                          {(lawyer.specializations || []).length > 0 ? (
                            <div>
                              {(lawyer.specializations || []).slice(0, 2).map((spec, index) => (
                                <span key={index} className="badge bg-light text-dark me-1 mb-1">
                                  {spec}
                                </span>
                              ))}
                              {(lawyer.specializations || []).length > 2 && (
                                <span className="badge bg-secondary">
                                  +{(lawyer.specializations || []).length - 2} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">None specified</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(lawyer.verificationStatus || 'pending')}`}>
                            {lawyer.verificationStatus ? (lawyer.verificationStatus.charAt(0).toUpperCase() + lawyer.verificationStatus.slice(1)) : 'Pending'}
                          </span>
                        </td>
                        <td>{new Date(lawyer.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => openLawyerDetails(lawyer)}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            {(lawyer.verificationStatus === 'pending' || !lawyer.verificationStatus) && (
                              <>
                                <button
                                  className="btn btn-outline-success"
                                  onClick={() => handleVerificationAction(lawyer._id, 'approve')}
                                  title="Approve"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleVerificationAction(lawyer._id, 'reject')}
                                  title="Reject"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Lawyers pagination">
                  <ul className="pagination justify-content-center mt-4">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-balance-scale fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No lawyers found</h5>
              <p className="text-muted">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Lawyer Details Modal */}
      {showModal && selectedLawyer && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Lawyer Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Personal Information</h6>
                    <p><strong>Name:</strong> {selectedLawyer.username}</p>
                    <p><strong>Email:</strong> {selectedLawyer.email}</p>
                    <p><strong>Experience:</strong> {selectedLawyer.experience} years</p>
                    <p><strong>License Number:</strong> {selectedLawyer.licenseNumber || 'N/A'}</p>
                    <p><strong>Bar Association:</strong> {selectedLawyer.barAssociation || 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Verification Status</h6>
                    <p>
                      <span className={`badge ${getStatusBadgeClass(selectedLawyer.verificationStatus || 'pending')}`}>
                        {selectedLawyer.verificationStatus ? (selectedLawyer.verificationStatus.charAt(0).toUpperCase() + selectedLawyer.verificationStatus.slice(1)) : 'Pending'}
                      </span>
                    </p>
                    <p><strong>Applied:</strong> {new Date(selectedLawyer.createdAt).toLocaleDateString()}</p>
                    {selectedLawyer.verifiedAt && (
                      <p><strong>Verified:</strong> {new Date(selectedLawyer.verifiedAt).toLocaleDateString()}</p>
                    )}
                    {selectedLawyer.verifiedBy && (
                      <p><strong>Verified By:</strong> {selectedLawyer.verifiedBy}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h6>Specializations</h6>
                  {(selectedLawyer.specializations || []).length > 0 ? (
                    <div>
                      {(selectedLawyer.specializations || []).map((spec, index) => (
                        <span key={index} className="badge bg-primary me-2 mb-2">
                          {spec}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No specializations specified</p>
                  )}
                </div>

                <div className="mt-4">
                  <h6>Documents</h6>
                  {(selectedLawyer.documents || []).length > 0 ? (
                    <div className="list-group">
                      {(selectedLawyer.documents || []).map((doc, index) => (
                        <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{doc.name}</strong>
                            <br />
                            <small className="text-muted">
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                            </small>
                          </div>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                            <i className="fas fa-download me-1"></i>
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No documents uploaded</p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                {(selectedLawyer.verificationStatus === 'pending' || !selectedLawyer.verificationStatus) && (
                  <>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => handleVerificationAction(selectedLawyer._id, 'approve')}
                    >
                      <i className="fas fa-check me-2"></i>
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleVerificationAction(selectedLawyer._id, 'reject')}
                    >
                      <i className="fas fa-times me-2"></i>
                      Reject
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLawyers;
