import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface SystemSettings {
  // General Settings
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  supportEmail: string;
  contactEmail: string;
  
  // System Settings  
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  maxFileUploadSize: number;
  allowedFileTypes: string[];
  sessionTimeout: number;
  logLevel: string;
  backupFrequency: string;
  
  // Feature Settings
  chatEnabled: boolean;
  chatRateLimit: number;
  templatesEnabled: boolean;
  documentAnalysisEnabled: boolean;
  lawyerVerificationEnabled: boolean;
  autoVerifyLawyers: boolean;
  analyticsEnabled: boolean;
  
  // Security Settings
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  twoFactorEnabled: boolean;
  socialLoginEnabled: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    // General
    siteName: 'Jury AI',
    siteDescription: 'AI-Powered Legal Assistant Platform',
    siteUrl: 'http://localhost:3000',
    supportEmail: 'support@juryai.com',
    contactEmail: 'contact@juryai.com',
    
    // System
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    maxFileUploadSize: 10,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'txt'],
    sessionTimeout: 24,
    logLevel: 'info',
    backupFrequency: 'daily',
    
    // Features
    chatEnabled: true,
    chatRateLimit: 10,
    templatesEnabled: true,
    documentAnalysisEnabled: true,
    lawyerVerificationEnabled: true,
    autoVerifyLawyers: false,
    analyticsEnabled: true,
    
    // Security
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
    twoFactorEnabled: false,
    socialLoginEnabled: false,
    maxLoginAttempts: 5,
    lockoutDuration: 15
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const settingsPayload = (data?.data || data) as Partial<SystemSettings>;
        setSettings(prev => ({ ...prev, ...settingsPayload }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedSettings = (data?.data || data?.settings || data) as Partial<SystemSettings>;
        setSettings(prev => ({ ...prev, ...updatedSettings }));
        toast.success('Settings saved successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData?.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => {
      if (typeof value === 'number' && Number.isNaN(value)) {
        return prev;
      }
      return { ...prev, [field]: value };
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border" style={{ color: '#5dd0ff' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const inputStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '8px'
  };

  const labelStyle = {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: 500
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-4">
        <ul className="nav nav-tabs" style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
          {[
            { id: 'general', icon: 'fa-globe', label: 'General' },
            { id: 'system', icon: 'fa-server', label: 'System' },
            { id: 'features', icon: 'fa-puzzle-piece', label: 'Features' },
            { id: 'security', icon: 'fa-shield-alt', label: 'Security' }
          ].map(tab => (
            <li className="nav-item" key={tab.id}>
              <button
                className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id 
                    ? 'linear-gradient(135deg, rgba(93, 208, 255, 0.2), rgba(124, 93, 255, 0.2))' 
                    : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid #5dd0ff' : '3px solid transparent',
                  color: activeTab === tab.id ? '#5dd0ff' : 'rgba(255, 255, 255, 0.6)',
                  padding: '1rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  transition: 'all 0.3s ease'
                }}
              >
                <i className={`fas ${tab.icon} me-2`}></i>
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tab Content */}
      <div className="card" style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px'
      }}>
        <div className="card-body p-4">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div>
              <h5 style={{ color: 'rgba(255, 255, 255, 0.95)', marginBottom: '2rem' }}>
                <i className="fas fa-globe me-2" style={{ color: '#5dd0ff' }}></i>
                General Settings
              </h5>
              
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label" style={labelStyle}>Site Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.siteName}
                    onChange={(e) => handleChange('siteName', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={labelStyle}>Site URL</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.siteUrl}
                    onChange={(e) => handleChange('siteUrl', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label" style={labelStyle}>Site Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={settings.siteDescription}
                    onChange={(e) => handleChange('siteDescription', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={labelStyle}>Support Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={settings.supportEmail}
                    onChange={(e) => handleChange('supportEmail', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={labelStyle}>Contact Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={settings.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <div>
              <h5 style={{ color: 'rgba(255, 255, 255, 0.95)', marginBottom: '2rem' }}>
                <i className="fas fa-server me-2" style={{ color: '#5dd0ff' }}></i>
                System Configuration
              </h5>
              
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                    />
                    <label className="form-check-label ms-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      <strong>Maintenance Mode</strong>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
                        Enable to show maintenance page to users
                      </p>
                    </label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.registrationEnabled}
                      onChange={(e) => handleChange('registrationEnabled', e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                    />
                    <label className="form-check-label ms-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      <strong>User Registration</strong>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
                        Allow new users to register
                      </p>
                    </label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.emailVerificationRequired}
                      onChange={(e) => handleChange('emailVerificationRequired', e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                    />
                    <label className="form-check-label ms-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      <strong>Email Verification Required</strong>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
                        Users must verify their email
                      </p>
                    </label>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={labelStyle}>Max File Upload Size (MB)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.maxFileUploadSize}
                    onChange={(e) => handleChange('maxFileUploadSize', parseInt(e.target.value))}
                    style={inputStyle}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={labelStyle}>Session Timeout (hours)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                    style={inputStyle}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={labelStyle}>Log Level</label>
                  <select
                    className="form-select"
                    value={settings.logLevel}
                    onChange={(e) => handleChange('logLevel', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={labelStyle}>Backup Frequency</label>
                  <select
                    className="form-select"
                    value={settings.backupFrequency}
                    onChange={(e) => handleChange('backupFrequency', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Features Settings */}
          {activeTab === 'features' && (
            <div>
              <h5 style={{ color: 'rgba(255, 255, 255, 0.95)', marginBottom: '2rem' }}>
                <i className="fas fa-puzzle-piece me-2" style={{ color: '#5dd0ff' }}></i>
                Feature Management
              </h5>
              
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.chatEnabled}
                      onChange={(e) => handleChange('chatEnabled', e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                    />
                    <label className="form-check-label ms-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      <strong>AI Chat Feature</strong>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
                        Enable AI-powered legal chat
                      </p>
                    </label>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={labelStyle}>Chat Rate Limit (per minute)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.chatRateLimit}
                    onChange={(e) => handleChange('chatRateLimit', parseInt(e.target.value))}
                    disabled={!settings.chatEnabled}
                    style={inputStyle}
                  />
                </div>

                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.templatesEnabled}
                      onChange={(e) => handleChange('templatesEnabled', e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                    />
                    <label className="form-check-label ms-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      <strong>Legal Templates</strong>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
                        Enable template library access
                      </p>
                    </label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.documentAnalysisEnabled}
                      onChange={(e) => handleChange('documentAnalysisEnabled', e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                    />
                    <label className="form-check-label ms-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      <strong>Document Analysis</strong>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
                        Allow users to upload and analyze documents
                      </p>
                    </label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.lawyerVerificationEnabled}
                      onChange={(e) => handleChange('lawyerVerificationEnabled', e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                    />
                    <label className="form-check-label ms-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      <strong>Lawyer Verification System</strong>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
                        Enable lawyer verification process
                      </p>
                    </label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.autoVerifyLawyers}
                      onChange={(e) => handleChange('autoVerifyLawyers', e.target.checked)}
                      disabled={!settings.lawyerVerificationEnabled}
                      style={{ width: '3rem', height: '1.5rem' }}
                    />
                    <label className="form-check-label ms-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      <strong>Auto-Verify Lawyers</strong>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
                        Automatically approve lawyer registrations
                      </p>
                    </label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.analyticsEnabled}
                      onChange={(e) => handleChange('analyticsEnabled', e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                    />
                    <label className="form-check-label ms-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      <strong>Analytics & Tracking</strong>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
                        Enable usage analytics and tracking
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div>
              <h5 style={{ color: 'rgba(255, 255, 255, 0.95)', marginBottom: '2rem' }}>
                <i className="fas fa-shield-alt me-2" style={{ color: '#5dd0ff' }}></i>
                Security Configuration
              </h5>
              
              <div className="row g-4">
                <div className="col-12">
                  <h6 style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                    Password Requirements
                  </h6>
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={labelStyle}>Minimum Password Length</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.passwordMinLength}
                    onChange={(e) => handleChange('passwordMinLength', parseInt(e.target.value))}
                    min="6"
                    max="20"
                    style={inputStyle}
                  />
                </div>

                <div className="col-md-6">
                  <div className="form-check form-switch mt-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.passwordRequireUppercase}
                      onChange={(e) => handleChange('passwordRequireUppercase', e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                    />
                    <label className="form-check-label ms-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Require Uppercase Letters
                    </label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.passwordRequireNumbers}
                      onChange={(e) => handleChange('passwordRequireNumbers', e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                    />
                    <label className="form-check-label ms-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Require Numbers
                    </label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.passwordRequireSpecialChars}
                      onChange={(e) => handleChange('passwordRequireSpecialChars', e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                    />
                    <label className="form-check-label ms-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Require Special Characters
                    </label>
                  </div>
                </div>

                <div className="col-12 mt-4">
                  <h6 style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                    Authentication
                  </h6>
                </div>

                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.twoFactorEnabled}
                      onChange={(e) => handleChange('twoFactorEnabled', e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                    />
                    <label className="form-check-label ms-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      <strong>Two-Factor Authentication</strong>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
                        Enable 2FA for enhanced security
                      </p>
                    </label>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.socialLoginEnabled}
                      onChange={(e) => handleChange('socialLoginEnabled', e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                    />
                    <label className="form-check-label ms-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      <strong>Social Login</strong>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
                        Allow Google, Facebook login
                      </p>
                    </label>
                  </div>
                </div>

                <div className="col-12 mt-4">
                  <h6 style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                    Account Protection
                  </h6>
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={labelStyle}>Max Login Attempts</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value))}
                    min="3"
                    max="10"
                    style={inputStyle}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={labelStyle}>Account Lockout Duration (minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.lockoutDuration}
                    onChange={(e) => handleChange('lockoutDuration', parseInt(e.target.value))}
                    min="5"
                    max="60"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              className="btn btn-lg"
              onClick={handleSaveSettings}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, rgba(93, 208, 255, 0.3), rgba(124, 93, 255, 0.3))',
                border: '1px solid rgba(93, 208, 255, 0.5)',
                color: '#5dd0ff',
                padding: '0.75rem 2rem',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Saving Settings...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  Save All Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
