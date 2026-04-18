import React, { useState, useEffect } from 'react';

interface Template {
  _id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  fields: {
    name: string;
    type: 'text' | 'textarea' | 'date' | 'number' | 'select';
    label: string;
    required: boolean;
    options?: string[];
  }[];
  isActive: boolean;
  createdBy:
    | {
        _id?: string;
        username?: string;
        name?: string;
      }
    | string;
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

const AdminTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    content: '',
    fields: []
  });

  const categories = [
    'Contracts',
    'Legal Letters',
    'Court Documents',
    'Business Forms',
    'Real Estate',
    'Employment',
    'Family Law',
    'Corporate',
    'Other'
  ];

  useEffect(() => {
    fetchTemplates();
  }, []); // Remove unused filters from dependencies

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`/api/admin/templates`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns templates array directly
        setTemplates(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (templateId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchTemplates(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating template status:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/admin/templates/${templateId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          fetchTemplates(); // Refresh the list
          setShowModal(false);
          setSelectedTemplate(null);
        }
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/admin/templates`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchTemplates(); // Refresh the list
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          category: '',
          content: '',
          fields: []
        });
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const openTemplateDetails = (template: Template) => {
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getCreatorName = (createdBy: Template['createdBy']) => {
    if (!createdBy) return 'System';
    if (typeof createdBy === 'string') return 'System';
    return createdBy.username || createdBy.name || 'System';
  };

  // Client-side filtering
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchTerm === '' || 
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && template.isActive) ||
      (statusFilter === 'inactive' && !template.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
              <i className="fas fa-file-alt fa-2x mb-2" style={{color: '#5dd0ff'}}></i>
              <h3 style={{color: '#5dd0ff', marginBottom: '0.25rem'}}>{templates.length}</h3>
              <p className="mb-0" style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem'}}>Total Templates</p>
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
              <i className="fas fa-check fa-2x mb-2" style={{color: '#22c55e'}}></i>
              <h3 style={{color: '#22c55e', marginBottom: '0.25rem'}}>{templates.filter(t => t.isActive).length}</h3>
              <p className="mb-0" style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem'}}>Active</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(124, 93, 255, 0.15), rgba(124, 93, 255, 0.05))',
            border: '1px solid rgba(124, 93, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="card-body text-center">
              <i className="fas fa-download fa-2x mb-2" style={{color: '#7c5dff'}}></i>
              <h3 style={{color: '#7c5dff', marginBottom: '0.25rem'}}>{templates.reduce((sum, t) => sum + t.downloads, 0)}</h3>
              <p className="mb-0" style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem'}}>Total Downloads</p>
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
              <i className="fas fa-folder fa-2x mb-2" style={{color: '#fbbf24'}}></i>
              <h3 style={{color: '#fbbf24', marginBottom: '0.25rem'}}>{new Set(templates.map(t => t.category)).size}</h3>
              <p className="mb-0" style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem'}}>Categories</p>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          className="btn"
          onClick={() => setShowCreateModal(true)}
          style={{
            background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)',
            border: 'none',
            color: 'white',
            padding: '0.75rem 1.5rem',
            fontWeight: 600
          }}
        >
          <i className="fas fa-plus me-2"></i>
          Create Template
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
            <div className="col-md-4">
              <div className="mb-3">
                <label htmlFor="search" className="form-label">Search Templates</label>
                <input
                  type="text"
                  className="form-control"
                  id="search"
                  placeholder="Search by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label htmlFor="categoryFilter" className="form-label">Filter by Category</label>
                <select
                  className="form-select"
                  id="categoryFilter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label htmlFor="statusFilter" className="form-label">Filter by Status</label>
                <select
                  className="form-select"
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Table */}
      <div className="card" style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="card-body">
          {filteredTemplates.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Template</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Downloads</th>
                      <th>Created By</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTemplates.map((template) => (
                      <tr key={template._id}>
                        <td style={{ maxWidth: '300px' }}>
                          <div>
                            <strong>{truncateText(template.title, 50)}</strong>
                            <br />
                            <small className="text-muted">
                              {truncateText(template.description, 80)}
                            </small>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark">
                            {template.category}
                          </span>
                        </td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={template.isActive}
                              onChange={() => handleStatusToggle(template._id, template.isActive)}
                            />
                            <label className="form-check-label">
                              {template.isActive ? 'Active' : 'Inactive'}
                            </label>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {template.downloads}
                          </span>
                        </td>
                        <td>{getCreatorName(template.createdBy)}</td>
                        <td>{new Date(template.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => openTemplateDetails(template)}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              title="Edit Template"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteTemplate(template._id)}
                              title="Delete Template"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Templates pagination">
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
              <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No templates found</h5>
              <p className="text-muted">Try adjusting your search criteria or create a new template</p>
            </div>
          )}
        </div>
      </div>

      {/* Template Details Modal */}
      {showModal && selectedTemplate && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Template Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <h6>Title</h6>
                  <p>{selectedTemplate!.title}</p>
                </div>

                <div className="mb-3">
                  <h6>Description</h6>
                  <p>{selectedTemplate!.description}</p>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <h6>Category</h6>
                    <p>{selectedTemplate!.category}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Status</h6>
                    <span className={`badge ${selectedTemplate!.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {selectedTemplate!.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <h6>Downloads</h6>
                    <p>{selectedTemplate!.downloads}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Created By</h6>
                    <p>{getCreatorName(selectedTemplate!.createdBy)}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <h6>Template Content</h6>
                  <div className="bg-light p-3 rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
                      {selectedTemplate!.content}
                    </pre>
                  </div>
                </div>

                {selectedTemplate!.fields.length > 0 && (
                  <div className="mb-3">
                    <h6>Template Fields ({selectedTemplate!.fields.length})</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Field Name</th>
                            <th>Label</th>
                            <th>Type</th>
                            <th>Required</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTemplate!.fields.map((field, index) => (
                            <tr key={index}>
                              <td><code>{field.name}</code></td>
                              <td>{field.label}</td>
                              <td>
                                <span className="badge bg-secondary">
                                  {field.type}
                                </span>
                              </td>
                              <td>
                                {field.required ? (
                                  <i className="fas fa-check text-success"></i>
                                ) : (
                                  <i className="fas fa-times text-muted"></i>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="row">
                  <div className="col-md-6">
                    <h6>Created</h6>
                    <p>{new Date(selectedTemplate!.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Last Updated</h6>
                    <p>{new Date(selectedTemplate!.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-primary me-auto"
                >
                  <i className="fas fa-edit me-2"></i>
                  Edit Template
                </button>
                <button
                  type="button"
                  className={`btn ${selectedTemplate!.isActive ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => handleStatusToggle(selectedTemplate!._id, selectedTemplate!.isActive)}
                >
                  <i className={`fas ${selectedTemplate!.isActive ? 'fa-pause' : 'fa-play'} me-2`}></i>
                  {selectedTemplate!.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDeleteTemplate(selectedTemplate!._id)}
                >
                  <i className="fas fa-trash me-2"></i>
                  Delete
                </button>
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

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Template</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description *</label>
                    <textarea
                      className="form-control"
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="category" className="form-label">Category *</label>
                    <select
                      className="form-select"
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">Template Content *</label>
                    <textarea
                      className="form-control"
                      id="content"
                      rows={10}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Enter the template content with placeholders like {{fieldName}}"
                      required
                    />
                    <div className="form-text">
                      Use double curly braces for field placeholders, e.g., {'{{clientName}}, {{date}}'}
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateTemplate}
                  disabled={!formData.title || !formData.description || !formData.category || !formData.content}
                >
                  <i className="fas fa-save me-2"></i>
                  Create Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminTemplates;
