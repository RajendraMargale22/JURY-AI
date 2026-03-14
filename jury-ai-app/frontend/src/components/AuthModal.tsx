import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const navigate = useNavigate();
  const { updateUser, isAuthenticated, user } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    agreeToTerms: false,
  });

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsClosing(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      handleClose();
    }
  }, [isAuthenticated, user]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      // Reset forms
      setLoginData({ email: '', password: '' });
      setRegisterData({ name: '', email: '', password: '', confirmPassword: '', role: 'user', agreeToTerms: false });
    }, 300);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post('/auth/login', loginData);
      const data = response.data as any;
      if (data.success) {
        console.log('Login response:', data);
        console.log('User role:', data.user.role);
        
        localStorage.setItem('token', data.token);
        updateUser(data.user);
        
        // Show different message for admin
        if (data.user.role === 'admin') {
          toast.success('Welcome back, Admin! Redirecting to dashboard...');
          handleClose();
          // Redirect admin users immediately
          setTimeout(() => {
            console.log('Navigating to admin dashboard...');
            navigate('/admin', { replace: true });
          }, 400);
        } else {
          toast.success('Login successful! Welcome back.');
          handleClose();
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        toast.error('Server is not reachable. Please make sure the backend is running on port 5000.');
      } else {
        const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (registerData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!registerData.agreeToTerms) {
      toast.error('Please agree to the Terms and Conditions');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/auth/register', {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        role: registerData.role,
      });
      const data = response.data as any;
      if (data.success) {
        localStorage.setItem('token', data.token);
        updateUser(data.user);
        
        // Show different message for admin
        if (data.user.role === 'admin') {
          toast.success('Admin account created! Welcome to Jury AI.');
        } else {
          toast.success('Account created! Welcome to Jury AI.');
        }
        
        handleClose();
        
        // Redirect admin users to admin dashboard
        if (data.user.role === 'admin') {
          setTimeout(() => navigate('/admin', { replace: true }), 300);
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        toast.error('Server is not reachable. Please make sure the backend is running on port 5000.');
      } else {
        const message = error.response?.data?.message || 'Registration failed. Please try again.';
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className={`auth-modal-overlay ${isClosing ? 'closing' : 'opening'}`} onClick={handleClose}>
      <div className={`auth-modal-container ${isClosing ? 'closing' : 'opening'}`} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="auth-modal-close" onClick={handleClose} aria-label="Close">
          <i className="fas fa-times"></i>
        </button>

        {/* Left decorative panel */}
        <div className="auth-modal-brand">
          <div className="auth-brand-content">
            <div className="auth-brand-icon">
              <i className="fas fa-balance-scale"></i>
            </div>
            <h2>Jury AI</h2>
            <p>Your AI-Powered Legal Assistant</p>
            <div className="auth-brand-features">
              <div className="auth-brand-feature">
                <i className="fas fa-check-circle"></i>
                <span>Instant Legal Guidance</span>
              </div>
              <div className="auth-brand-feature">
                <i className="fas fa-check-circle"></i>
                <span>Document Analysis</span>
              </div>
              <div className="auth-brand-feature">
                <i className="fas fa-check-circle"></i>
                <span>24/7 AI Assistance</span>
              </div>
              <div className="auth-brand-feature">
                <i className="fas fa-check-circle"></i>
                <span>Secure & Private</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-modal-form-panel">
          {/* Tab switcher */}
          <div className="auth-tab-switcher">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
              disabled={isLoading}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
              disabled={isLoading}
            >
              Sign Up
            </button>
            <div className={`auth-tab-indicator ${mode === 'register' ? 'right' : 'left'}`} />
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="auth-modal-form fade-in">
              <h3>Welcome Back</h3>
              <p className="auth-subtitle">Sign in to continue to Jury AI</p>

              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <i className="fas fa-envelope"></i>
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <i className="fas fa-lock"></i>
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  minLength={6}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              <div className="auth-form-extras">
                <label className="auth-checkbox">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <button type="button" className="auth-link-btn">Forgot password?</button>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In <i className="fas fa-arrow-right ms-2"></i>
                  </>
                )}
              </button>

              <div className="auth-or-divider">
                <span>or continue with</span>
              </div>

              <div className="auth-social-row">
                <button type="button" className="auth-social-btn">
                  <i className="fab fa-google"></i>
                </button>
                <button type="button" className="auth-social-btn">
                  <i className="fab fa-facebook-f"></i>
                </button>
                <button type="button" className="auth-social-btn">
                  <i className="fab fa-github"></i>
                </button>
              </div>

              <p className="auth-switch-text">
                Don't have an account?{' '}
                <button type="button" className="auth-link-btn" onClick={() => setMode('register')}>
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="auth-modal-form fade-in">
              <h3>Create Account</h3>
              <p className="auth-subtitle">Join Jury AI for smart legal assistance</p>

              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <i className="fas fa-user"></i>
                </div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>

              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <i className="fas fa-envelope"></i>
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <i className="fas fa-user-tag"></i>
                </div>
                <select
                  value={registerData.role}
                  onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                  required
                  disabled={isLoading}
                >
                  <option value="user">User – Get Legal Help</option>
                  <option value="lawyer">Lawyer – Provide Legal Services</option>
                </select>
              </div>

              <div className="auth-input-row">
                <div className="auth-input-group">
                  <div className="auth-input-icon">
                    <i className="fas fa-lock"></i>
                  </div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    minLength={6}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
                <div className="auth-input-group">
                  <div className="auth-input-icon">
                    <i className="fas fa-shield-alt"></i>
                  </div>
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  checked={registerData.agreeToTerms}
                  onChange={(e) => setRegisterData({ ...registerData, agreeToTerms: e.target.checked })}
                  disabled={isLoading}
                />
                <span className="checkmark"></span>
                I agree to the <button type="button" className="auth-link-btn">Terms</button> & <button type="button" className="auth-link-btn">Privacy Policy</button>
              </label>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account <i className="fas fa-arrow-right ms-2"></i>
                  </>
                )}
              </button>

              <p className="auth-switch-text">
                Already have an account?{' '}
                <button type="button" className="auth-link-btn" onClick={() => setMode('login')}>
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
