import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { signInWithPopup } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { firebaseAuth, firebaseEnabled, googleProvider } from '../config/firebase';
import './AuthPage.css';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser, isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    agreeToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (!formData.agreeToTerms) {
      toast.error('Please agree to the Terms and Conditions');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      const data = response.data as any;

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        
        // Update auth context
        updateUser(data.user);
        
        toast.success('Registration successful! Welcome to Jury AI!');
        
        // Small delay to ensure auth context is updated before navigation
        setTimeout(() => {
          // Redirect based on role
          if (data.user.role === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 100);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getGoogleErrorMessage = (error: any): string => {
    const code = error?.code || '';

    if (code.includes('auth/popup-closed-by-user')) return 'Google sign-in was cancelled.';
    if (code.includes('auth/popup-blocked')) return 'Popup was blocked. Please allow popups and try again.';
    if (code.includes('auth/unauthorized-domain')) {
      return 'This domain is not authorized in Firebase. Add localhost to Firebase authorized domains.';
    }
    if (code.includes('auth/network-request-failed')) {
      return 'Network issue during Google sign-in. Please check your connection.';
    }

    return error?.response?.data?.message || error?.message || 'Google authentication failed';
  };

  const handleGoogleAuth = async () => {
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the Terms and Conditions');
      return;
    }

    if (!firebaseEnabled || !firebaseAuth) {
      toast.error('Google auth is not configured yet. Add Firebase env variables.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await axios.post('/auth/google', {
        idToken,
        role: formData.role,
      });
      const data = response.data as any;

      if (data.success) {
        localStorage.setItem('token', data.token);
        updateUser(data.user);
        toast.success('Google authentication successful');

        setTimeout(() => {
          if (data.user.role === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 100);
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast.error(getGoogleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Join Jury AI and get legal assistance</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">
                <i className="fas fa-user"></i> Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i> Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">
                <i className="fas fa-user-tag"></i> Account Type
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                disabled={isLoading}
              >
                <option value="user">User - Get Legal Help</option>
                <option value="lawyer">Lawyer - Provide Legal Services</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <i className="fas fa-lock"></i> Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password (min. 6 characters)"
                autoComplete="new-password"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <i className="fas fa-lock"></i> Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>

            <div className="form-group-checkbox">
              <label>
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" target="_blank">Terms and Conditions</Link>
                  {' '}and{' '}
                  <Link to="/privacy" target="_blank">Privacy Policy</Link>
                </span>
              </label>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Creating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i> Create Account
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <div className="social-login">
            <button className="btn btn-social btn-google" onClick={handleGoogleAuth} disabled={isLoading} type="button">
              <i className="fab fa-google"></i> Sign up with Google
            </button>
            <button className="btn btn-social btn-facebook">
              <i className="fab fa-facebook-f"></i> Sign up with Facebook
            </button>
          </div>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </p>
          </div>

          <div className="auth-back">
            <Link to="/">
              <i className="fas fa-arrow-left"></i> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
