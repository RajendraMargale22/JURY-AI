import React, { useState, useEffect } from 'react';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  maxFileUploadSize: number;
  allowedFileTypes: string[];
  chatRateLimit: number;
  autoVerifyLawyers: boolean;
  moderationEnabled: boolean;
  analyticsEnabled: boolean;
  backupFrequency: string;
  logLevel: string;
  sessionTimeout: number;
  passwordMinLength: number;
  twoFactorEnabled: boolean;
  socialLoginEnabled: boolean;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'Jury AI',
    siteDescription: 'Legal Assistant Platform',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    maxFileUploadSize: 10,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'txt'],
    chatRateLimit: 10,
    autoVerifyLawyers: false,
    moderationEnabled: true,
    analyticsEnabled: true,
    backupFrequency: 'daily',
    logLevel: 'info',
    sessionTimeout: 24,
    passwordMinLength: 8,
    twoFactorEnabled: false,
    socialLoginEnabled: false
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
        // Ensure allowedFileTypes is an array
        if (data.allowedFileTypes && Array.isArray(data.allowedFileTypes)) {
          setSettings(data);
        } else {
          setSettings({
            ...data,
            allowedFileTypes: data.allowedFileTypes || ['pdf', 'doc', 'docx', 'txt']
          });
        }
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
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleArrayChange = (key: keyof SystemSettings, value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setSettings(prev => ({
      ...prev,
      [key]: array
    }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>System Settings</h2>
        <button
          className="btn btn-success"
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-save me-2"></i>
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <i className="fas fa-cog me-2"></i>
            General
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <i className="fas fa-shield-alt me-2"></i>
            Security
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => setActiveTab('features')}
          >
            <i className="fas fa-puzzle-piece me-2"></i>
            Features
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <i className="fas fa-server me-2"></i>
            System
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">General Settings</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="siteName" className="form-label">Site Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="siteName"
                      value={settings.siteName}
                      onChange={(e) => handleInputChange('siteName', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="siteDescription" className="form-label">Site Description</label>
                    <input
                      type="text"
                      className="form-control"
                      id="siteDescription"
                      value={settings.siteDescription}
                      onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="maintenanceMode">
                      Maintenance Mode
                    </label>
                    <div className="form-text">
                      When enabled, only admins can access the site
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="registrationEnabled"
                      checked={settings.registrationEnabled}
                      onChange={(e) => handleInputChange('registrationEnabled', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="registrationEnabled">
                      User Registration
                    </label>
                    <div className="form-text">
                      Allow new users to register
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="maxFileUploadSize" className="form-label">
                      Max File Upload Size (MB)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="maxFileUploadSize"
                      value={settings.maxFileUploadSize}
                      onChange={(e) => handleInputChange('maxFileUploadSize', parseInt(e.target.value))}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="allowedFileTypes" className="form-label">
                      Allowed File Types
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="allowedFileTypes"
                      value={settings.allowedFileTypes?.join(', ') || ''}
                      onChange={(e) => handleArrayChange('allowedFileTypes', e.target.value)}
                      placeholder="pdf, doc, docx, txt"
                    />
                    <div className="form-text">
                      Comma-separated list of file extensions
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Security Settings</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="emailVerificationRequired"
                      checked={settings.emailVerificationRequired}
                      onChange={(e) => handleInputChange('emailVerificationRequired', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="emailVerificationRequired">
                      Email Verification Required
                    </label>
                    <div className="form-text">
                      Require email verification for new accounts
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="twoFactorEnabled"
                      checked={settings.twoFactorEnabled}
                      onChange={(e) => handleInputChange('twoFactorEnabled', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="twoFactorEnabled">
                      Two-Factor Authentication
                    </label>
                    <div className="form-text">
                      Enable 2FA for enhanced security
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="passwordMinLength" className="form-label">
                      Minimum Password Length
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="passwordMinLength"
                      value={settings.passwordMinLength}
                      onChange={(e) => handleInputChange('passwordMinLength', parseInt(e.target.value))}
                      min="6"
                      max="32"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="sessionTimeout" className="form-label">
                      Session Timeout (hours)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="sessionTimeout"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                      min="1"
                      max="168"
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="chatRateLimit" className="form-label">
                      Chat Rate Limit (per minute)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="chatRateLimit"
                      value={settings.chatRateLimit}
                      onChange={(e) => handleInputChange('chatRateLimit', parseInt(e.target.value))}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3 mt-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="socialLoginEnabled"
                      checked={settings.socialLoginEnabled}
                      onChange={(e) => handleInputChange('socialLoginEnabled', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="socialLoginEnabled">
                      Social Login Enabled
                    </label>
                    <div className="form-text">
                      Allow login with Google, Facebook, etc.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Settings */}
        {activeTab === 'features' && (
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Feature Settings</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="autoVerifyLawyers"
                      checked={settings.autoVerifyLawyers}
                      onChange={(e) => handleInputChange('autoVerifyLawyers', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="autoVerifyLawyers">
                      Auto-verify Lawyers
                    </label>
                    <div className="form-text">
                      Automatically verify lawyer registrations
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="moderationEnabled"
                      checked={settings.moderationEnabled}
                      onChange={(e) => handleInputChange('moderationEnabled', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="moderationEnabled">
                      Content Moderation
                    </label>
                    <div className="form-text">
                      Enable automatic content moderation
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="analyticsEnabled"
                      checked={settings.analyticsEnabled}
                      onChange={(e) => handleInputChange('analyticsEnabled', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="analyticsEnabled">
                      Analytics Tracking
                    </label>
                    <div className="form-text">
                      Enable user analytics and tracking
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Settings */}
        {activeTab === 'system' && (
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">System Settings</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="backupFrequency" className="form-label">
                      Backup Frequency
                    </label>
                    <select
                      className="form-select"
                      id="backupFrequency"
                      value={settings.backupFrequency}
                      onChange={(e) => handleInputChange('backupFrequency', e.target.value)}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="logLevel" className="form-label">
                      Log Level
                    </label>
                    <select
                      className="form-select"
                      id="logLevel"
                      value={settings.logLevel}
                      onChange={(e) => handleInputChange('logLevel', e.target.value)}
                    >
                      <option value="debug">Debug</option>
                      <option value="info">Info</option>
                      <option value="warn">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* System Actions */}
              <div className="mt-4 pt-4 border-top">
                <h6 className="mb-3">System Actions</h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="card border-warning">
                      <div className="card-body">
                        <h6 className="card-title text-warning">
                          <i className="fas fa-database me-2"></i>
                          Database Backup
                        </h6>
                        <p className="card-text small">
                          Create a manual backup of the database
                        </p>
                        <button className="btn btn-warning btn-sm">
                          Create Backup
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border-info">
                      <div className="card-body">
                        <h6 className="card-title text-info">
                          <i className="fas fa-sync-alt me-2"></i>
                          Clear Cache
                        </h6>
                        <p className="card-text small">
                          Clear all cached data and temporary files
                        </p>
                        <button className="btn btn-info btn-sm">
                          Clear Cache
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-6">
                    <div className="card border-success">
                      <div className="card-body">
                        <h6 className="card-title text-success">
                          <i className="fas fa-file-export me-2"></i>
                          Export Data
                        </h6>
                        <p className="card-text small">
                          Export all system data for backup or migration
                        </p>
                        <button className="btn btn-success btn-sm">
                          Export Data
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border-danger">
                      <div className="card-body">
                        <h6 className="card-title text-danger">
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          System Reset
                        </h6>
                        <p className="card-text small">
                          Reset system to default settings (DANGER!)
                        </p>
                        <button className="btn btn-outline-danger btn-sm">
                          Reset System
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
