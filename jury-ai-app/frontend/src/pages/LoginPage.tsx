import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser, isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Get the page user was trying to access
  const from = (location.state as any)?.from?.pathname || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, from]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post('/auth/login', formData);
      const data = response.data as any;
      
      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        
        // Update auth context
        updateUser(data.user);
        
        toast.success('Login successful!');
        
        // Small delay to ensure auth context is updated before navigation
        setTimeout(() => {
          // Redirect based on role or to intended page
          if (data.user.role === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate(from, { replace: true });
          }
        }, 100);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in to your Jury AI account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
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
              <label htmlFor="password">
                <i className="fas fa-lock"></i> Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-password">
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Signing in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i> Sign In
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <div className="social-login">
            <button className="btn btn-social btn-google">
              <i className="fab fa-google"></i> Continue with Google
            </button>
            <button className="btn btn-social btn-facebook">
              <i className="fab fa-facebook-f"></i> Continue with Facebook
            </button>
          </div>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register">Sign up</Link>
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

export default LoginPage;
