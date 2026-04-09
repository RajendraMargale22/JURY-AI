import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './AuthPage.css';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      setDevResetUrl('');
      const response = await axios.post('/auth/forgot-password', { email });
      const data = response.data as any;
      toast.success(data?.message || 'Reset link sent if email exists');

      if (data?.resetUrl) {
        setDevResetUrl(String(data.resetUrl));
        toast.info('Dev mode: reset link is available below for testing.');
        return;
      }

      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to request password reset';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDevUrl = async () => {
    if (!devResetUrl) return;
    try {
      await navigator.clipboard.writeText(devResetUrl);
      toast.success('Reset link copied to clipboard');
    } catch {
      toast.error('Unable to copy link. Please copy it manually.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Forgot Password</h1>
            <p>Enter your email to receive a password reset link</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i> Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your account email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Sending reset link...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Send Reset Link
                </>
              )}
            </button>

            {devResetUrl && (
              <div className="dev-reset-box" role="status" aria-live="polite">
                <p className="dev-reset-title">
                  <i className="fas fa-flask"></i> Development reset link
                </p>
                <a href={devResetUrl} className="dev-reset-link" target="_self" rel="noreferrer">
                  {devResetUrl}
                </a>
                <div className="dev-reset-actions">
                  <button type="button" className="dev-reset-btn" onClick={handleCopyDevUrl}>
                    <i className="fas fa-copy"></i> Copy Link
                  </button>
                  <a href={devResetUrl} className="dev-reset-btn dev-reset-btn-primary" target="_self" rel="noreferrer">
                    <i className="fas fa-external-link-alt"></i> Open Reset Page
                  </a>
                </div>
              </div>
            )}
          </form>

          <div className="auth-footer">
            <p>
              Remember your password? <Link to="/login">Sign in</Link>
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

export default ForgotPasswordPage;
