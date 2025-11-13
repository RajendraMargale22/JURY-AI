import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LegalNews from '../components/LegalNews';
import LegalFacts from '../components/LegalFacts';
import { toast } from 'react-toastify';

const HomePage: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
      setShowDropdown(false);
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-vh-100">
      {/* Header */}
      <header className="bg-dark text-white py-3">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <i className="fas fa-balance-scale me-3 fs-2"></i>
                <div>
                  <h1 className="mb-0 h3">Jury AI</h1>
                  <p className="mb-0 text-muted">Legal Assistant</p>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-end">
              {isAuthenticated && user ? (
                <div className="d-flex align-items-center justify-content-end gap-2">
                  {user.role === 'admin' && (
                    <Link to="/admin" className="btn btn-outline-light btn-sm">
                      <i className="fas fa-cog"></i> Admin
                    </Link>
                  )}
                  {/* <Link to="/chat" className="btn btn-primary btn-sm">
                    <i className="fas fa-comments"></i> Chat
                  </Link> */}
                  <div className="dropdown" style={{ position: 'relative' }} ref={dropdownRef}>
                    <button 
                      className="btn btn-outline-light btn-sm dropdown-toggle"
                      onClick={() => setShowDropdown(!showDropdown)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <i className="fas fa-user-circle"></i>
                      <span>{user.name}</span>
                    </button>
                    {showDropdown && (
                      <div 
                        className="dropdown-menu show" 
                        style={{ 
                          position: 'absolute', 
                          right: 0, 
                          top: '100%', 
                          marginTop: '5px',
                          minWidth: '200px',
                          zIndex: 1000
                        }}
                      >
                        <div className="dropdown-item-text">
                          <div><strong>{user.name}</strong></div>
                          <small className="text-muted">{user.email}</small>
                          <div className="mt-1">
                            <span className="badge bg-primary">{user.role}</span>
                          </div>
                        </div>
                        <div className="dropdown-divider"></div>
                        <Link 
                          to="/chat" 
                          className="dropdown-item"
                          onClick={() => setShowDropdown(false)}
                        >
                          <i className="fas fa-comments me-2"></i>
                          My Chats
                        </Link>
                        <Link 
                          to="/templates" 
                          className="dropdown-item"
                          onClick={() => setShowDropdown(false)}
                        >
                          <i className="fas fa-file-alt me-2"></i>
                          Templates
                        </Link>
                        <div className="dropdown-divider"></div>
                        <button 
                          className="dropdown-item text-danger"
                          onClick={handleLogout}
                        >
                          <i className="fas fa-sign-out-alt me-2"></i>
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="d-flex gap-2">
                  <Link to="/login" className="btn btn-outline-light">
                    <i className="fas fa-sign-in-alt me-1"></i>
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary">
                    <i className="fas fa-user-plus me-1"></i>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="text-white"
        style={{
          backgroundImage: 'url(/hero_page_bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll',
          minHeight: '880px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1
          }}
        ></div>
        
        <div className="container py-5" style={{ position: 'relative', zIndex: 2 }}>
          <div className="row align-items-center" style={{ minHeight: '400px' }}>
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                Your AI-Powered Legal Assistant
              </h1>
              <p className="lead mb-4" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                Get instant legal advice, analyze documents, and connect with verified lawyers. 
                Jury AI makes legal help accessible to everyone.
              </p>
              <div className="d-flex gap-3">
                {!isAuthenticated ? (
                  <>
                    <Link to="/register" className="btn btn-light btn-lg">
                      <i className="fas fa-user-plus me-2"></i>
                      Get Started
                    </Link>
                    <Link to="/login" className="btn btn-outline-light btn-lg">
                      <i className="fas fa-sign-in-alt me-2"></i>
                      Login to Chat
                    </Link>
                  </>
                ) : (
                  <Link to="/chat" className="btn btn-light btn-lg">
                    <i className="fas fa-comments me-2"></i>
                    Start Chatting
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-12">
              <h2 className="display-5 fw-bold">Our Services</h2>
              <p className="lead text-muted">Comprehensive legal assistance at your fingertips</p>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '80px', height: '80px' }}>
                    <i className="fas fa-robot fs-2"></i>
                  </div>
                  <h5>AI Legal Chat</h5>
                  <p className="text-muted">Get instant answers to your legal questions with our advanced AI assistant.</p>
                  {isAuthenticated ? (
                    <Link to="/chat" className="btn btn-outline-primary">Try Now</Link>
                  ) : (
                    <Link to="/register" className="btn btn-outline-primary">Login to Use</Link>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '80px', height: '80px' }}>
                    <i className="fas fa-file-alt fs-2"></i>
                  </div>
                  <h5>Document Analysis</h5>
                  <p className="text-muted">Upload and analyze legal documents for risks, suggestions, and insights.</p>
                  {isAuthenticated ? (
                    <Link to="/chat" className="btn btn-outline-success">Analyze</Link>
                  ) : (
                    <Link to="/register" className="btn btn-outline-success">Login to Use</Link>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '80px', height: '80px' }}>
                    <i className="fas fa-users fs-2"></i>
                  </div>
                  <h5>Lawyer Network</h5>
                  <p className="text-muted">Connect with verified lawyers for professional consultation and representation.</p>
                  {isAuthenticated ? (
                    <Link to="/chat" className="btn btn-outline-warning">Connect</Link>
                  ) : (
                    <Link to="/register" className="btn btn-outline-warning">Login to Use</Link>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '80px', height: '80px' }}>
                    <i className="fas fa-clipboard-list fs-2"></i>
                  </div>
                  <h5>Legal Templates</h5>
                  <p className="text-muted">Access a library of legal document templates for various needs.</p>
                  {isAuthenticated ? (
                    <Link to="/templates" className="btn btn-outline-info">Browse</Link>
                  ) : (
                    <Link to="/register" className="btn btn-outline-info">Login to Use</Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LegalFacts />
      <LegalNews />

    </div>
  );
};

export default HomePage;
