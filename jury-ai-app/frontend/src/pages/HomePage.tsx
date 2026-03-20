import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LegalNews from '../components/LegalNews';
import LegalFacts from '../components/LegalFacts';
import { toast } from 'react-toastify';

interface HomePageProps {
  openAuthModal: (mode: 'login' | 'register') => void;
  autoOpenAuth?: 'login' | 'register';
}

const HomePage: React.FC<HomePageProps> = ({ openAuthModal, autoOpenAuth }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-open auth modal if routed from /login or /register
  useEffect(() => {
    if (autoOpenAuth && !isAuthenticated) {
      openAuthModal(autoOpenAuth);
    }
  }, [autoOpenAuth, isAuthenticated, openAuthModal]);

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
      {/* ───── Header ───── */}
      <header
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
        className="py-3"
      >
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <Link to="/" className="text-decoration-none">
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                      boxShadow: '0 6px 20px rgba(93,208,255,0.25)',
                    }}
                  >
                    <i className="fas fa-balance-scale text-white" style={{ fontSize: 20 }}></i>
                  </div>
                  <div>
                    <h1 className="mb-0 h4 text-white fw-bold">Jury AI</h1>
                    <p className="mb-0" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                      Legal Assistant
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-6 text-end">
              {isAuthenticated && user ? (
                <div className="d-flex align-items-center justify-content-end gap-2">
                  {user.role === 'admin' && (
                    <Link to="/admin" className="btn btn-sm" style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0' }}>
                      <i className="fas fa-cog me-1"></i> Admin
                    </Link>
                  )}
                  <div className="dropdown" style={{ position: 'relative' }} ref={dropdownRef}>
                    <button
                      className="btn btn-sm d-flex align-items-center gap-2"
                      onClick={() => setShowDropdown(!showDropdown)}
                      style={{
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#e2e8f0',
                        borderRadius: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          color: '#fff',
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="d-none d-md-inline">{user.name}</span>
                      <i className="fas fa-chevron-down" style={{ fontSize: 10 }}></i>
                    </button>
                    {showDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 8px)',
                          minWidth: 240,
                          background: '#1a1f36',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 12,
                          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                          zIndex: 1000,
                          animation: 'dropdownFadeIn 0.2s ease-out',
                        }}
                      >
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <strong style={{ color: '#fff', fontSize: 14 }}>{user.name}</strong>
                          <small style={{ display: 'block', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                            {user.email}
                          </small>
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: 6,
                              padding: '2px 10px',
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 600,
                              background: 'rgba(93,208,255,0.15)',
                              color: '#5dd0ff',
                            }}
                          >
                            {user.role}
                          </span>
                        </div>
                        <div style={{ padding: '6px 0' }}>
                          <Link
                            to="/chat"
                            className="d-block px-3 py-2"
                            onClick={() => setShowDropdown(false)}
                            style={{ color: '#e2e8f0', fontSize: 14, transition: 'background 0.15s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <i className="fas fa-comments me-2" style={{ color: '#5dd0ff' }}></i>
                            My Chats
                          </Link>
                          <Link
                            to="/templates"
                            className="d-block px-3 py-2"
                            onClick={() => setShowDropdown(false)}
                            style={{ color: '#e2e8f0', fontSize: 14, transition: 'background 0.15s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <i className="fas fa-file-alt me-2" style={{ color: '#7c5dff' }}></i>
                            Templates
                          </Link>
                          <Link
                            to="/contract-review"
                            className="d-block px-3 py-2"
                            onClick={() => setShowDropdown(false)}
                            style={{ color: '#e2e8f0', fontSize: 14, transition: 'background 0.15s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <i className="fas fa-file-signature me-2" style={{ color: '#fbbf24' }}></i>
                            Contract Review
                          </Link>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '6px 0' }}>
                          <button
                            className="d-block w-100 text-start px-3 py-2 border-0"
                            onClick={handleLogout}
                            style={{ color: '#f87171', fontSize: 14, background: 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <i className="fas fa-sign-out-alt me-2"></i>
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="d-flex gap-2 justify-content-end">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="btn btn-sm"
                    style={{
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#e2e8f0',
                      borderRadius: 10,
                      padding: '8px 18px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <i className="fas fa-sign-in-alt me-1"></i> Login
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="btn btn-sm"
                    style={{
                      background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '8px 18px',
                      fontWeight: 600,
                      boxShadow: '0 6px 20px rgba(93,208,255,0.25)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <i className="fas fa-user-plus me-1"></i> Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ───── Hero Section ───── */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(160deg, #0a0f1e 0%, #0f172a 40%, #0d1b3e 100%)',
        }}
      >
        {/* Animated glow orbs */}
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(93,208,255,0.12), transparent 60%)',
            top: '-10%',
            right: '-5%',
            filter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,93,255,0.15), transparent 60%)',
            bottom: '-10%',
            left: '-5%',
            filter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        />

        <div className="container py-5" style={{ position: 'relative', zIndex: 2 }}>
          <div className="row align-items-center">
            <div className="col-lg-7">
              {/* Pill badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 16px',
                  borderRadius: 999,
                  border: '1px solid rgba(93,208,255,0.25)',
                  background: 'rgba(93,208,255,0.08)',
                  marginBottom: 24,
                  fontSize: 13,
                  color: '#5dd0ff',
                  fontWeight: 600,
                }}
              >
                <i className="fas fa-sparkles"></i>
                AI-Powered Legal Platform
              </div>

              <h1
                className="fw-bold mb-4"
                style={{
                  fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
                  lineHeight: 1.1,
                  color: '#fff',
                  letterSpacing: '-0.5px',
                }}
              >
                Your Intelligent{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Legal Assistant
                </span>
              </h1>
              <p
                className="mb-4"
                style={{
                  fontSize: 18,
                  lineHeight: 1.7,
                  color: 'rgba(255,255,255,0.6)',
                  maxWidth: 540,
                }}
              >
                Get instant legal guidance, analyze documents, and access expert knowledge. 
                Jury AI makes legal help accessible, affordable, and available 24/7.
              </p>

              {/* Stats */}
              <div className="d-flex flex-wrap gap-3 mb-4">
                {[
                  { label: 'Legal Queries', value: '10K+', icon: 'fas fa-comments' },
                  { label: 'Accuracy Rate', value: '95%', icon: 'fas fa-check-double' },
                  { label: 'Response Time', value: '<2s', icon: 'fas fa-bolt' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 16px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <i className={stat.icon} style={{ color: '#5dd0ff', fontSize: 14 }}></i>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 16, lineHeight: 1 }}>{stat.value}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="d-flex flex-wrap gap-3">
                {!isAuthenticated ? (
                  <>
                    <button
                      onClick={() => openAuthModal('register')}
                      className="btn btn-lg px-4"
                      style={{
                        background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 14,
                        fontWeight: 700,
                        fontSize: 16,
                        boxShadow: '0 10px 30px rgba(93,208,255,0.3)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <i className="fas fa-rocket me-2"></i>
                      Get Started Free
                    </button>
                    <button
                      onClick={() => openAuthModal('login')}
                      className="btn btn-lg px-4"
                      style={{
                        border: '1.5px solid rgba(255,255,255,0.2)',
                        color: '#e2e8f0',
                        borderRadius: 14,
                        fontWeight: 600,
                        fontSize: 16,
                        background: 'rgba(255,255,255,0.04)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <i className="fas fa-sign-in-alt me-2"></i>
                      Login to Chat
                    </button>
                  </>
                ) : (
                  <Link
                    to="/chat"
                    className="btn btn-lg px-4"
                    style={{
                      background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 14,
                      fontWeight: 700,
                      fontSize: 16,
                      boxShadow: '0 10px 30px rgba(93,208,255,0.3)',
                    }}
                  >
                    <i className="fas fa-comments me-2"></i>
                    Start Chatting
                  </Link>
                )}
              </div>
            </div>

            {/* Right side decorative card */}
            <div className="col-lg-5 d-none d-lg-block">
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  padding: 32,
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
                }}
              >
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <i className="fas fa-robot text-white"></i>
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Jury AI Chat</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Online • Ready to help</div>
                  </div>
                </div>

                {/* Mock chat bubbles */}
                <div
                  style={{
                    background: 'rgba(93,208,255,0.1)',
                    border: '1px solid rgba(93,208,255,0.2)',
                    borderRadius: '16px 16px 4px 16px',
                    padding: '12px 16px',
                    marginBottom: 12,
                    color: '#e2e8f0',
                    fontSize: 14,
                    maxWidth: '85%',
                    marginLeft: 'auto',
                  }}
                >
                  What are my rights as a tenant?
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px 16px 16px 4px',
                    padding: '12px 16px',
                    marginBottom: 12,
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 14,
                    maxWidth: '85%',
                  }}
                >
                  Under the Rent Control Act, you have several key protections including fair rent, right against eviction...
                </div>
                <div
                  style={{
                    background: 'rgba(124,93,255,0.1)',
                    border: '1px solid rgba(124,93,255,0.2)',
                    borderRadius: 12,
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: 14,
                  }}
                >
                  <i className="fas fa-pen" style={{ fontSize: 12 }}></i>
                  Ask a legal question...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Features Section ───── */}
      <section style={{ padding: '80px 0', background: '#0b1220' }}>
        <div className="container">
          <div className="text-center mb-5">
            <div
              style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: 20,
                background: 'rgba(93,208,255,0.1)',
                border: '1px solid rgba(93,208,255,0.2)',
                color: '#5dd0ff',
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 16,
              }}
            >
              Our Services
            </div>
            <h2 className="fw-bold mb-3" style={{ color: '#fff', fontSize: '2.2rem' }}>
              Comprehensive Legal Assistance
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 540, margin: '0 auto', fontSize: 16 }}>
              Everything you need for legal guidance — all in one platform.
            </p>
          </div>
          <div className="row g-4">
            {[
              {
                icon: 'fas fa-robot',
                title: 'AI Legal Chat',
                desc: 'Get instant answers to your legal questions with our advanced AI assistant.',
                gradient: 'linear-gradient(135deg, rgba(93,208,255,0.15), rgba(93,208,255,0.05))',
                borderColor: 'rgba(93,208,255,0.2)',
                iconColor: '#5dd0ff',
                link: isAuthenticated ? '/chat' : null,
                btnLabel: isAuthenticated ? 'Try Now' : 'Login to Use',
                disabled: false,
                onClick: !isAuthenticated ? () => openAuthModal('login') : undefined,
              },
              {
                icon: 'fas fa-file-alt',
                title: 'Document Analysis',
                desc: 'Upload and analyze legal documents for risks, suggestions, and insights.',
                gradient: 'linear-gradient(135deg, rgba(124,93,255,0.15), rgba(124,93,255,0.05))',
                borderColor: 'rgba(124,93,255,0.2)',
                iconColor: '#7c5dff',
                link: isAuthenticated ? '/contract-review' : null,
                btnLabel: isAuthenticated ? 'Analyze Now' : 'Login to Use',
                disabled: false,
                onClick: !isAuthenticated ? () => openAuthModal('login') : undefined,
              },
              {
                icon: 'fas fa-users',
                title: 'Lawyer Network',
                desc: 'Connect with verified lawyers for professional consultation and representation.',
                gradient: 'linear-gradient(135deg, rgba(255,159,124,0.15), rgba(255,159,124,0.05))',
                borderColor: 'rgba(255,159,124,0.2)',
                iconColor: '#ff9f7c',
                link: '/lawyers',
                btnLabel: 'Explore',
                disabled: false,
              },
              {
                icon: 'fas fa-clipboard-list',
                title: 'Legal Templates',
                desc: 'Access a library of legal document templates for various needs.',
                gradient: 'linear-gradient(135deg, rgba(45,212,191,0.15), rgba(45,212,191,0.05))',
                borderColor: 'rgba(45,212,191,0.2)',
                iconColor: '#2dd4bf',
                link: isAuthenticated ? '/templates' : null,
                btnLabel: isAuthenticated ? 'Browse' : 'Login to Use',
                disabled: false,
                onClick: !isAuthenticated ? () => openAuthModal('login') : undefined,
              },
            ].map((feature) => (
              <div className="col-md-6 col-lg-3" key={feature.title}>
                <div
                  style={{
                    background: feature.gradient,
                    border: `1px solid ${feature.borderColor}`,
                    borderRadius: 16,
                    padding: 28,
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'default',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  className="feature-card-hover"
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 20,
                      fontSize: 22,
                      color: feature.iconColor,
                    }}
                  >
                    <i className={feature.icon}></i>
                  </div>
                  <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: 8, fontSize: 17 }}>{feature.title}</h5>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, flex: 1 }}>
                    {feature.desc}
                  </p>
                  {feature.disabled ? (
                    <button
                      className="btn btn-sm mt-2"
                      disabled
                      style={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.3)',
                        borderRadius: 10,
                        padding: '6px 16px',
                        fontSize: 13,
                      }}
                    >
                      {feature.btnLabel}
                    </button>
                  ) : feature.link ? (
                    <Link
                      to={feature.link}
                      className="btn btn-sm mt-2"
                      style={{
                        border: `1px solid ${feature.borderColor}`,
                        color: feature.iconColor,
                        borderRadius: 10,
                        padding: '6px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        transition: 'all 0.2s',
                      }}
                    >
                      {feature.btnLabel}
                    </Link>
                  ) : (
                    <button
                      onClick={feature.onClick}
                      className="btn btn-sm mt-2"
                      style={{
                        border: `1px solid ${feature.borderColor}`,
                        color: feature.iconColor,
                        borderRadius: 10,
                        padding: '6px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        background: 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {feature.btnLabel}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LegalFacts />
      <LegalNews />
    </div>
  );
};

export default HomePage;
