import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { templateService, Template as ApiTemplate } from '../services/templateService';
import { toast } from 'react-toastify';
import TemplateCard from '../components/TemplateCard';
import './TemplatesPage.css';

interface Template {
  id: string;
  _id?: string;
  name: string;
  title?: string;
  description: string;
  category: string;
  downloads: number;
  lastUpdated?: Date;
  updatedAt?: string;
  preview: string;
  fileName?: string;
  fileSize?: number;
}

const DEFAULT_TEMPLATE_CATEGORIES: string[] = [
  'all',
  'Sales Documents and Forms',
  'Policy and Compliance Documents',
  'Letters and Notices Templates',
  'Web & Technology Agreements',
  'Proposal Templates',
  'Financial Agreements',
  'Family Law',
  'Employment Legal Templates',
  'Real Estate',
  'B2B Legal Documents',
  'Business Document',
  'Last Will and Testament',
  'Bill of Sale',
  'Power of Attorney (POA)',
  'Eviction Notice',
  'NDA (Non-Disclosure Agreements)',
  'Lease Agreement'
];

const TemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'Sales Documents and Forms',
    file: null as File | null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templatesEnabled, setTemplatesEnabled] = useState(true);
  const [categories, setCategories] = useState<string[]>(DEFAULT_TEMPLATE_CATEGORIES);

  useEffect(() => {
    fetchFeatureSettings();
  }, []);

  // Fetch templates from API
  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, [selectedCategory, searchTerm, templatesEnabled]);

  const fetchFeatureSettings = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/auth/settings`);
      if (!response.ok) return;
      const data = await response.json();
      const payload = data?.data || data;
      setTemplatesEnabled(payload?.templatesEnabled !== false);
    } catch (error) {
      console.error('Error fetching feature settings:', error);
    }
  };

  const fetchTemplates = async () => {
    if (!templatesEnabled) {
      setTemplates([]);
      setIsLoadingTemplates(false);
      return;
    }

    setIsLoadingTemplates(true);
    try {
      const data = await templateService.getTemplates(
        1,
        100,
        selectedCategory,
        searchTerm
      );
      
      // Map API templates to local template format
      const mappedTemplates: Template[] = data.templates.map((t: ApiTemplate) => ({
        id: t._id,
        _id: t._id,
        name: t.title,
        title: t.title,
        description: t.description,
        category: t.category,
        downloads: t.downloads,
        lastUpdated: new Date(t.updatedAt),
        updatedAt: t.updatedAt,
        preview: t.content ? t.content.substring(0, 200) + '...' : '',
        fileName: t.fileName,
        fileSize: t.fileSize
      }));
      
      setTemplates(mappedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const fetchCategories = async () => {
    if (!templatesEnabled) return;

    try {
      const apiCategories = await templateService.getCategories();
      const apiCategoryList = Array.isArray(apiCategories)
        ? apiCategories.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];

      const merged = Array.from(
        new Set([
          ...DEFAULT_TEMPLATE_CATEGORIES,
          ...apiCategoryList,
        ])
      );

      setCategories(merged);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(DEFAULT_TEMPLATE_CATEGORIES);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templatesEnabled) {
      toast.error('Template feature is currently disabled by admin settings');
      return;
    }
    
    if (!uploadForm.title || !uploadForm.description || !uploadForm.file) {
      toast.error('Please fill in all fields and select a file');
      return;
    }

    if (uploadForm.file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to upload templates');
        setIsUploading(false);
        return;
      }

      console.log('Uploading template with token:', token ? 'Token exists' : 'No token');
      console.log('User role:', user?.role);

      await templateService.uploadTemplate(
        uploadForm.title,
        uploadForm.description,
        uploadForm.category,
        uploadForm.file,
        token
      );
      
      toast.success('Template uploaded successfully!');
      setShowUploadModal(false);
      setUploadForm({
        title: '',
        description: '',
        category: 'Sales Documents and Forms',
        file: null
      });
      
      // Refresh templates list
      fetchTemplates();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload template. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const canUploadTemplate = user && (user.role === 'admin' || user.role === 'lawyer');

  const downloadTemplate = async (template: Template, format: 'pdf' | 'word') => {
    if (!templatesEnabled) {
      toast.error('Template feature is currently disabled by admin settings');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to download templates');
        return;
      }

      if (!template._id) {
        toast.error('Invalid template ID');
        return;
      }

      // Increment download count first
      try {
        await templateService.downloadTemplate(template._id, token);
      } catch (countError) {
        // Don't block the download if count increment fails
        console.warn('Failed to increment download count:', countError);
      }

      // Get the file
      const blob = await templateService.getTemplateFile(template._id, token);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeFileName = (template.fileName || `${template.name}.${format === 'pdf' ? 'pdf' : 'docx'}`)
        .replace(/[\r\n\\/]/g, '_');
      link.download = safeFileName;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('Template downloaded successfully!');
      
      // Refresh to update download count
      fetchTemplates();
    } catch (error: any) {
      console.error('Download error:', error);
      if (error?.response?.status === 404) {
        toast.error('Template file not found. It may need to be re-uploaded.');
      } else {
        toast.error('Failed to download template');
      }
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = (template.name || template.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="templates-page-container">
      {/* Header */}
      <nav className="navbar navbar-dark templates-top-navbar" style={{ 
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(93, 208, 255, 0.2)'
      }}>
        <div className="container-fluid">
          <Link className="navbar-brand" to="/" style={{ 
            color: '#f8fbff',
            fontWeight: 700,
            textShadow: '0 1px 10px rgba(93, 208, 255, 0.45)'
          }}>
            <i className="fas fa-balance-scale me-2" style={{ color: '#5dd0ff' }}></i>
            Jury AI - Legal Templates
          </Link>
          <div className="d-flex align-items-center">
            <Link to="/" className="btn btn-outline-light home-nav-btn me-2">
              <i className="fas fa-house me-2"></i>
              Home
            </Link>
            {user ? (
              <>
                <span className="text-light me-3">Welcome, <span style={{color: '#5dd0ff'}}>{user.name}</span></span>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-light me-2" style={{
                  borderColor: 'rgba(93, 208, 255, 0.5)',
                  color: '#5dd0ff'
                }}>Login</Link>
                <Link to="/register" className="btn" style={{
                  background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)',
                  color: 'white',
                  border: 'none'
                }}>Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container-fluid py-4">
        {!templatesEnabled && (
          <div className="alert alert-warning" role="alert">
            Template feature is currently disabled by admin settings.
          </div>
        )}
        <div className="row">
          {/* Sidebar */}
          <div className="col-lg-3 mb-4 templates-sidebar">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-search me-2"></i>
                  Search Templates
                </h5>
              </div>
              <div className="card-body">
                <div className="search-input-wrapper">
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="card mt-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-filter me-2"></i>
                  Categories
                </h5>
              </div>
              <div className="card-body p-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`category-btn ${
                      selectedCategory === category ? 'active' : ''
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <i className="fas fa-folder me-2"></i>
                    {category === 'all' ? 'All Categories' : category}
                  </button>
                ))}
              </div>
            </div>

            <div className="card mt-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Template Info
                </h5>
              </div>
              <div className="card-body">
                <p className="small mb-2">
                  <i className="fas fa-shield-alt text-success me-2"></i>
                  All templates are legally reviewed
                </p>
                <p className="small mb-2">
                  <i className="fas fa-edit text-primary me-2"></i>
                  Fully customizable
                </p>
                <p className="small mb-0">
                  <i className="fas fa-download text-info me-2"></i>
                  Multiple formats available
                </p>
              </div>
            </div>

            {/* Upload Template Button - Only for Admin and Lawyers */}
            {canUploadTemplate && (
              <div className="card mt-4 border-primary">
                <div className="card-body text-center">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <i className="fas fa-upload me-2"></i>
                    Upload Template
                  </button>
                  <small className="text-muted d-block mt-2">
                    Share legal templates with the community
                  </small>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="col-lg-9 templates-grid-container">
            <div className="d-flex justify-content-between align-items-center mb-4 templates-page-header">
              <h1 className="templates-page-title">
                <i className="fas fa-file-alt me-2"></i>
                Legal Document Templates
              </h1>
              <span className="templates-count-badge">
                {filteredTemplates.length} templates found
              </span>
            </div>

            {/* Templates Grid */}
            {isLoadingTemplates ? (
              <div className="text-center py-5">
                <div className="spinner-border" style={{color: '#5dd0ff'}} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3" style={{color: 'rgba(255, 255, 255, 0.6)'}}>Loading templates...</p>
              </div>
            ) : (
              <div className="row g-4">
                {filteredTemplates.map((template: Template) => (
                  <div key={template.id} className="col-12 col-sm-6 col-lg-6 col-xl-4">
                    <TemplateCard
                      id={template.id}
                      title={template.name || template.title || 'Untitled Template'}
                      description={template.description}
                      category={template.category}
                      downloads={template.downloads}
                      lastUpdated={template.lastUpdated || template.updatedAt}
                      onGenerateDocument={() => {
                        if (user) {
                          downloadTemplate(template, 'pdf');
                        } else {
                          toast.info('Please login to generate documents');
                        }
                      }}
                      onPreview={() => setSelectedTemplate(template)}
                    />
                  </div>
                ))}
              </div>
            )}

            {!isLoadingTemplates && filteredTemplates.length === 0 && (
              <div className="text-center py-5">
                <i className="fas fa-search text-muted mb-3" style={{ fontSize: '4rem' }}></i>
                <h4 className="text-muted">No templates found</h4>
                <p className="text-muted">
                  Try adjusting your search terms or category filter.
                </p>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-file-alt me-2"></i>
                  {selectedTemplate.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedTemplate(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Category:</strong> {selectedTemplate.category}
                  </div>
                  <div className="col-md-6">
                    <strong>Downloads:</strong> {selectedTemplate.downloads}
                  </div>
                </div>
                
                <div className="mb-3">
                  <strong>Description:</strong>
                  <p className="mt-2">{selectedTemplate.description}</p>
                </div>
                
                <div className="mb-3">
                  <strong>Preview:</strong>
                  <div className="border rounded p-3 mt-2 bg-light">
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                      {selectedTemplate.preview}
                    </pre>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Close
                </button>
                {user ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => downloadTemplate(selectedTemplate, 'pdf')}
                    >
                      <i className="fas fa-file-pdf me-2"></i>
                      Download PDF
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => downloadTemplate(selectedTemplate, 'word')}
                    >
                      <i className="fas fa-file-word me-2"></i>
                      Download Word
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="btn btn-primary">
                    Login to Download
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Template Modal */}
      {showUploadModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleUploadSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-upload me-2"></i>
                    Upload Legal Template
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowUploadModal(false)}
                    disabled={isUploading}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Upload Guidelines:</strong> Please ensure your template is properly formatted, 
                    legally accurate, and suitable for public use. Supported formats: PDF, DOCX, DOC.
                  </div>

                  <div className="mb-3">
                    <label htmlFor="templateTitle" className="form-label">
                      Template Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="templateTitle"
                      placeholder="e.g., Service Agreement Contract"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      required
                      disabled={isUploading}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="templateCategory" className="form-label">
                      Category <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="templateCategory"
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      required
                      disabled={isUploading}
                    >
                      <option value="Sales Documents and Forms">Sales Documents and Forms</option>
                      <option value="Policy and Compliance Documents">Policy and Compliance Documents</option>
                      <option value="Letters and Notices Templates">Letters and Notices Templates</option>
                      <option value="Web & Technology Agreements">Web & Technology Agreements</option>
                      <option value="Proposal Templates">Proposal Templates</option>
                      <option value="Financial Agreements">Financial Agreements</option>
                      <option value="Family Law">Family Law</option>
                      <option value="Employment Legal Templates">Employment Legal Templates</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="B2B Legal Documents">B2B Legal Documents</option>
                      <option value="Business Document">Business Document</option>
                      <option value="Last Will and Testament">Last Will and Testament</option>
                      <option value="Bill of Sale">Bill of Sale</option>
                      <option value="Power of Attorney (POA)">Power of Attorney (POA)</option>
                      <option value="Eviction Notice">Eviction Notice</option>
                      <option value="NDA (Non-Disclosure Agreements)">NDA (Non-Disclosure Agreements)</option>
                      <option value="Lease Agreement">Lease Agreement</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="templateDescription" className="form-label">
                      Description / Summary <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      id="templateDescription"
                      rows={4}
                      placeholder="Provide a brief description of the template, its purpose, and key features..."
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      required
                      disabled={isUploading}
                    />
                    <small className="text-muted">
                      {uploadForm.description.length}/500 characters
                    </small>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="templateFile" className="form-label">
                      Template File <span className="text-danger">*</span>
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      id="templateFile"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setUploadForm({ 
                        ...uploadForm, 
                        file: e.target.files ? e.target.files[0] : null 
                      })}
                      required
                      disabled={isUploading}
                    />
                    <small className="text-muted">
                      Supported formats: PDF, DOC, DOCX (Max size: 10MB)
                    </small>
                    {uploadForm.file && (
                      <div className="mt-2">
                        <div className="alert alert-success mb-0">
                          <i className="fas fa-file me-2"></i>
                          <strong>Selected:</strong> {uploadForm.file.name} 
                          ({(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowUploadModal(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-upload me-2"></i>
                        Upload Template
                      </>
                    )}
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

export default TemplatesPage;
