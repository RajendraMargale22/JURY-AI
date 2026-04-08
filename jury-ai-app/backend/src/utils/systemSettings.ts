import SystemSettings from '../models/SystemSettings';

export type SettingsMap = Record<string, string | number | boolean | string[]>;

export const defaultSystemSettings: SettingsMap = {
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
  lockoutDuration: 15,
};

const settingsKeys = Object.keys(defaultSystemSettings);

export const normalizeSettingsPayload = (payload: Record<string, unknown>): SettingsMap => {
  const normalized: SettingsMap = {};

  for (const key of settingsKeys) {
    if (!(key in payload)) {
      continue;
    }

    const defaultValue = defaultSystemSettings[key];
    const candidate = payload[key];

    if (typeof defaultValue === 'boolean') {
      if (typeof candidate === 'boolean') {
        normalized[key] = candidate;
      }
      continue;
    }

    if (typeof defaultValue === 'number') {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        normalized[key] = candidate;
      }
      continue;
    }

    if (typeof defaultValue === 'string') {
      if (typeof candidate === 'string') {
        normalized[key] = candidate.trim();
      }
      continue;
    }

    if (Array.isArray(defaultValue)) {
      if (Array.isArray(candidate)) {
        normalized[key] = candidate.filter((item): item is string => typeof item === 'string');
      }
    }
  }

  return normalized;
};

export const getMergedSystemSettings = async (): Promise<SettingsMap> => {
  const settingsDoc = await SystemSettings.findOne({ key: 'global' }).lean();
  const savedSettings = (settingsDoc?.settings || {}) as Record<string, unknown>;

  return {
    ...defaultSystemSettings,
    ...normalizeSettingsPayload(savedSettings),
  };
};
