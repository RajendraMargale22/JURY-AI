import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Navbar.css';

const Navbar: React.FC = () => {
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
    <header className="navbar-header bg-dark text-white py-3">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6">
            <Link to="/" className="text-decoration-none text-white">
              <div className="d-flex align-items-center">
                <i className="fas fa-balance-scale me-3 fs-2"></i>
                <div>
                  <h1 className="mb-0 h3">Jury AI</h1>
                  <p className="mb-0 text-muted small">Legal Assistant</p>
                </div>
              </div>
            </Link>
          </div>
          <div className="col-md-6">
            {isAuthenticated && user ? (
              <div className="d-flex align-items-center justify-content-end gap-2">
                {user.role === 'admin' && (
                  <Link to="/admin" className="btn btn-outline-light btn-sm">
                    <i className="fas fa-cog"></i> Admin
                  </Link>
                )}
                <Link to="/chat" className="btn btn-primary btn-sm">
                  <i className="fas fa-comments"></i> Chat
                </Link>
                <div className="user-dropdown" ref={dropdownRef}>
                  <button 
                    className="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center gap-2"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <i className="fas fa-user-circle"></i>
                    <span className="d-none d-md-inline">{user.name}</span>
                  </button>
                  {showDropdown && (
                    <div className="user-dropdown-menu">
                      <div className="dropdown-header">
                        <div className="user-info">
                          <strong>{user.name}</strong>
                          <small className="text-muted d-block">{user.email}</small>
                          <span className="badge bg-primary mt-1">{user.role}</span>
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
              <div className="d-flex align-items-center justify-content-end gap-2">
                <Link to="/login" className="btn btn-outline-light">
                  <i className="fas fa-sign-in-alt me-1"></i>
                  <span className="d-none d-sm-inline">Login</span>
                </Link>
                <Link to="/register" className="btn btn-primary">
                  <i className="fas fa-user-plus me-1"></i>
                  <span className="d-none d-sm-inline">Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
