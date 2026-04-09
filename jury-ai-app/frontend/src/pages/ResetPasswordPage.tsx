import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './AuthPage.css';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }

    if (!password || !confirmPassword) {
      toast.error('Please fill both password fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/auth/reset-password', { token, password });
      const data = response.data as any;
      toast.success(data?.message || 'Password reset successful');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to reset password';
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
            <h1>Reset Password</h1>
            <p>Set a new password for your account</p>
          </div>

          {!token ? (
            <div className="auth-form">
              <p style={{ color: '#ef4444', marginBottom: 16 }}>Reset token is missing or invalid.</p>
              <Link to="/forgot-password" className="btn btn-primary btn-block">
                Request New Reset Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="password">
                  <i className="fas fa-lock"></i> New Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  <i className="fas fa-shield-alt"></i> Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Resetting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-key"></i> Reset Password
                  </>
                )}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <p>
              Back to <Link to="/login">Sign in</Link>
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

export default ResetPasswordPage;
