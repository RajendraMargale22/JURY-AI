import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { signInWithPopup } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { firebaseAuth, firebaseEnabled, googleProvider } from '../config/firebase';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

interface AuthPolicySettings {
  registrationEnabled: boolean;
  socialLoginEnabled: boolean;
  twoFactorEnabled: boolean;
  chatEnabled?: boolean;
  templatesEnabled?: boolean;
  documentAnalysisEnabled?: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const navigate = useNavigate();
  const { updateUser, isAuthenticated, user } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [authSettings, setAuthSettings] = useState<AuthPolicySettings>({
    registrationEnabled: true,
    socialLoginEnabled: true,
    twoFactorEnabled: false,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
  });
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingTwoFactor, setPendingTwoFactor] = useState(false);

  // Ref to prevent the auto-close useEffect from racing with completeAuthentication
  const isAuthenticatingRef = useRef(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    agreeToTerms: false,
  });

  const getGoogleErrorMessage = (error: any): string => {
    const code = error?.code || '';

    if (code.includes('auth/popup-closed-by-user')) {
      return 'Google sign-in was cancelled.';
    }
    if (code.includes('auth/popup-blocked')) {
      return 'Popup was blocked by the browser. Please allow popups and try again.';
    }
    if (code.includes('auth/unauthorized-domain')) {
      return 'This domain is not authorized in Firebase. Add localhost in Firebase Authentication > Settings > Authorized domains.';
    }
    if (code.includes('auth/network-request-failed')) {
      return 'Network issue during Google sign-in. Please check your connection and try again.';
    }

    return error?.response?.data?.message || error?.message || 'Google authentication failed';
  };

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsClosing(false);
      fetchAuthSettings();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const fetchAuthSettings = async () => {
    try {
      setSettingsLoading(true);
      const response = await axios.get('/auth/settings');
      const payload = (response.data?.data || response.data) as Partial<AuthPolicySettings>;
      setAuthSettings((prev) => ({ ...prev, ...payload }));
    } catch (error) {
      console.error('Failed to fetch auth settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const completeAuthentication = (data: any, successMessage: string) => {
    localStorage.setItem('token', data.token);
    updateUser(data.user);

    if (data.user.role === 'admin') {
      toast.success('Welcome back, Admin! Redirecting to dashboard...');
      // Navigate synchronously BEFORE closing modal to avoid race condition
      // where the auto-close useEffect unmounts the component before navigate fires
      navigate('/admin', { replace: true });
      handleClose();
      isAuthenticatingRef.current = false;
      return;
    }

    toast.success(successMessage);
    handleClose();
    isAuthenticatingRef.current = false;
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < authSettings.passwordMinLength) {
      return `Password must be at least ${authSettings.passwordMinLength} characters`;
    }
    if (authSettings.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      return 'Password must include at least one uppercase letter';
    }
    if (authSettings.passwordRequireNumbers && !/\d/.test(password)) {
      return 'Password must include at least one number';
    }
    if (authSettings.passwordRequireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
      return 'Password must include at least one special character';
    }
    return null;
  };

  // Close if user becomes authenticated (e.g., from session restore or another tab)
  // Guard with isAuthenticatingRef to prevent racing with completeAuthentication
  useEffect(() => {
    if (isAuthenticated && user && !isAuthenticatingRef.current) {
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
      setPendingTwoFactor(false);
      setTwoFactorToken('');
      setTwoFactorCode('');
    }, 300);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    isAuthenticatingRef.current = true;
    try {
      const response = await axios.post('/auth/login', loginData);
      const data = response.data as any;
      if (data.success) {
        if (data.requiresTwoFactor && data.twoFactorToken) {
          setMode('login');
          setPendingTwoFactor(true);
          setTwoFactorToken(data.twoFactorToken);
          if (data.twoFactorCode) {
            toast.info(`2FA code (dev): ${data.twoFactorCode}`);
          } else {
            toast.info('Enter your 2FA code to continue');
          }
          return;
        }

        completeAuthentication(data, 'Login successful! Welcome back.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      isAuthenticatingRef.current = false;
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
      toast.error(`Password must be at least ${authSettings.passwordMinLength} characters`);
      return;
    }

    const passwordError = validatePassword(registerData.password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (!authSettings.registrationEnabled) {
      toast.error('Registration is currently disabled by admin settings');
      return;
    }
    if (!registerData.agreeToTerms) {
      toast.error('Please agree to the Terms and Conditions');
      return;
    }

    setIsLoading(true);
    isAuthenticatingRef.current = true;
    try {
      const response = await axios.post('/auth/register', {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        role: registerData.role,
      });
      const data = response.data as any;
      if (data.success) {
        completeAuthentication(data, 'Account created! Welcome to Jury AI.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      isAuthenticatingRef.current = false;
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

  const handleGoogleAuth = async () => {
    if (!authSettings.socialLoginEnabled) {
      toast.error('Social login is disabled by admin settings');
      return;
    }

    if (!firebaseEnabled || !firebaseAuth) {
      toast.error('Google auth is not configured yet. Add Firebase env variables.');
      return;
    }

    setIsLoading(true);
    isAuthenticatingRef.current = true;
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await axios.post('/auth/google', {
        idToken,
        role: mode === 'register' ? registerData.role : undefined
      });

      const data = response.data as any;
      if (data.success) {
        if (data.requiresTwoFactor && data.twoFactorToken) {
          setMode('login');
          setPendingTwoFactor(true);
          setTwoFactorToken(data.twoFactorToken);
          if (data.twoFactorCode) {
            toast.info(`2FA code (dev): ${data.twoFactorCode}`);
          } else {
            toast.info('Enter your 2FA code to continue');
          }
          return;
        }

        completeAuthentication(data, 'Google authentication successful');
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      isAuthenticatingRef.current = false;
      const message = getGoogleErrorMessage(error);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleButtonClick = async () => {
    console.info('[AuthModal] Google button clicked', {
      settingsLoading,
      socialLoginEnabled: authSettings.socialLoginEnabled,
      firebaseEnabled,
    });

    if (settingsLoading) {
      toast.info('Loading authentication settings. Please try again in a moment.');
      return;
    }

    if (!authSettings.socialLoginEnabled) {
      toast.error('Social login is currently disabled by admin settings');
      return;
    }

    await handleGoogleAuth();
  };

  if (!isOpen && !isClosing) return null;

  const verifyTwoFactorCode = async () => {
    if (!twoFactorToken || !twoFactorCode) {
      toast.error('Please enter the 2FA code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/auth/verify-2fa', {
        twoFactorToken,
        code: twoFactorCode,
      });
      const data = response.data as any;

      if (data.success) {
        setPendingTwoFactor(false);
        setTwoFactorCode('');
        setTwoFactorToken('');
        completeAuthentication(data, 'Two-factor verification successful');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Two-factor verification failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

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
              disabled={isLoading || pendingTwoFactor}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
              disabled={isLoading || pendingTwoFactor || !authSettings.registrationEnabled}
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

              {pendingTwoFactor ? (
                <>
                  <div className="auth-input-group">
                    <div className="auth-input-icon">
                      <i className="fas fa-shield-alt"></i>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter 2FA code"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      maxLength={6}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <button type="button" className="auth-submit-btn" disabled={isLoading} onClick={verifyTwoFactorCode}>
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify 2FA <i className="fas fa-check ms-2"></i>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
              <div className="auth-form-extras">
                <label className="auth-checkbox">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => {
                    handleClose();
                    setTimeout(() => navigate('/forgot-password'), 220);
                  }}
                >
                  Forgot password?
                </button>
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
                <button type="button" className="auth-social-btn" onClick={handleGoogleButtonClick} disabled={isLoading} title="Continue with Google">
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
                </>
              )}
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

              <button type="submit" className="auth-submit-btn" disabled={isLoading || !authSettings.registrationEnabled}>
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

              <div className="auth-or-divider">
                <span>or continue with</span>
              </div>

              <div className="auth-social-row">
                <button type="button" className="auth-social-btn" onClick={handleGoogleButtonClick} disabled={isLoading} title="Continue with Google">
                  <i className="fab fa-google"></i>
                </button>
              </div>

              {!authSettings.socialLoginEnabled && (
                <p className="auth-switch-text" style={{ color: '#f87171' }}>
                  Social login is disabled by admin settings.
                </p>
              )}

              {!authSettings.registrationEnabled && (
                <p className="auth-switch-text" style={{ color: '#f87171' }}>
                  Registration is currently disabled by admin settings.
                </p>
              )}

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
