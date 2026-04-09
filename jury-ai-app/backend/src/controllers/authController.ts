import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import admin from 'firebase-admin';
import User from '../models/User';
import { getMergedSystemSettings } from '../utils/systemSettings';
import { AuthRequest } from '../types/interfaces';
import { sendEmail } from '../utils/emailService';

let firebaseInitialized = false;
const TWO_FACTOR_TTL_MS = 10 * 60 * 1000;
const twoFactorChallenges = new Map<string, {
  userId: string;
  code: string;
  expiresAt: number;
}>();

const parseBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const parseNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const getAuthSettings = async () => {
  const settings = await getMergedSystemSettings();
  return {
    registrationEnabled: parseBoolean(settings.registrationEnabled, true),
    socialLoginEnabled: parseBoolean(settings.socialLoginEnabled, false),
    twoFactorEnabled: parseBoolean(settings.twoFactorEnabled, false),
    chatEnabled: parseBoolean(settings.chatEnabled, true),
    templatesEnabled: parseBoolean(settings.templatesEnabled, true),
    documentAnalysisEnabled: parseBoolean(settings.documentAnalysisEnabled, true),
    passwordMinLength: parseNumber(settings.passwordMinLength, 8),
    passwordRequireUppercase: parseBoolean(settings.passwordRequireUppercase, true),
    passwordRequireNumbers: parseBoolean(settings.passwordRequireNumbers, true),
    passwordRequireSpecialChars: parseBoolean(settings.passwordRequireSpecialChars, false),
  };
};

const validatePasswordWithSettings = (password: string, settings: Awaited<ReturnType<typeof getAuthSettings>>): string | null => {
  if (password.length < settings.passwordMinLength) {
    return `Password must be at least ${settings.passwordMinLength} characters long`;
  }
  if (settings.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (settings.passwordRequireNumbers && !/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (settings.passwordRequireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null;
};

const createTwoFactorChallenge = (userId: string) => {
  const token = crypto.randomBytes(24).toString('hex');
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const expiresAt = Date.now() + TWO_FACTOR_TTL_MS;
  twoFactorChallenges.set(token, { userId, code, expiresAt });
  return { token, code, expiresAt };
};

const buildAuthenticatedPayload = (user: any, token: string) => ({
  success: true,
  message: 'Authentication successful',
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    avatar: user.avatar
  }
});

const issueAuthResponse = (res: Response, user: any) => {
  const token = generateToken(user._id.toString());

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json(buildAuthenticatedPayload(user, token));
};

const asString = (value: unknown, maxLength = 250): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const initFirebaseAdmin = () => {
  if (firebaseInitialized || admin.apps.length > 0) {
    firebaseInitialized = true;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });

  firebaseInitialized = true;
};

const verifyFirebaseIdToken = async (idToken: string) => {
  initFirebaseAdmin();
  return admin.auth().verifyIdToken(idToken, true);
};

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
};

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    const authSettings = await getAuthSettings();
    const name = asString(req.body?.name, 100);
    const email = asString(req.body?.email, 200).toLowerCase();
    const password = asString(req.body?.password, 200);
    const role = asString(req.body?.role, 20);

    if (!authSettings.registrationEnabled) {
      return res.status(403).json({
        success: false,
        message: 'New registrations are currently disabled by the administrator'
      });
    }

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const passwordError = validatePasswordWithSettings(password, authSettings);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      isVerified: false
    });

    const token = generateToken(user._id.toString());
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      ...buildAuthenticatedPayload(user, token),
      message: 'Registration successful'
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const authSettings = await getAuthSettings();
    const email = asString(req.body?.email, 200).toLowerCase();
    const password = asString(req.body?.password, 200);

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    if (authSettings.twoFactorEnabled) {
      const challenge = createTwoFactorChallenge(user._id.toString());
      console.log(`[2FA] Login code for ${user.email}: ${challenge.code}`);

      return res.json({
        success: true,
        requiresTwoFactor: true,
        message: 'Two-factor authentication code is required',
        twoFactorToken: challenge.token,
        ...(process.env.NODE_ENV !== 'production' ? { twoFactorCode: challenge.code } : {})
      });
    }

    issueAuthResponse(res, user);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

// Logout user
export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie('token');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// Get user profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isEmailVerified: req.user.isEmailVerified,
        avatar: req.user.avatar,
        phone: req.user.profile?.phone,
        bio: req.user.profile?.bio
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const name = asString(req.body?.name, 100);
    const phone = req.body?.phone === undefined ? undefined : asString(req.body?.phone, 30);
    const bio = req.body?.bio === undefined ? undefined : asString(req.body?.bio, 500);
    const address = req.body?.address === undefined ? undefined : asString(req.body?.address, 300);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (phone !== undefined) {
      if (!user.profile) user.profile = {};
      user.profile.phone = phone;
    }
    if (bio !== undefined) {
      if (!user.profile) user.profile = {};
      user.profile.bio = bio;
    }
    if (address !== undefined) {
      if (!user.profile) user.profile = {};
      user.profile.address = address;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        phone: user.profile?.phone,
        bio: user.profile?.bio,
        address: user.profile?.address
      }
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
};

// Google login/signup via Firebase ID token
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const authSettings = await getAuthSettings();
    const idToken = asString(req.body?.idToken, 5000);
    const role = asString(req.body?.role, 20);

    if (!authSettings.socialLoginEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Social login is currently disabled by the administrator'
      });
    }

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required'
      });
    }

    const decoded = await verifyFirebaseIdToken(idToken);
    const email = (decoded.email || '').toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google account email is required'
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: decoded.name || email.split('@')[0],
        email,
        password: crypto.randomBytes(32).toString('hex'),
        role: role === 'lawyer' ? 'lawyer' : 'user',
        isVerified: true,
        isEmailVerified: true,
        avatar: decoded.picture || ''
      });
    } else {
      if (!user.isEmailVerified) user.isEmailVerified = true;
      if (!user.isVerified) user.isVerified = true;
      if (decoded.picture && !user.avatar) user.avatar = decoded.picture;
      user.lastLogin = new Date();
      await user.save();
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    if (authSettings.twoFactorEnabled) {
      const challenge = createTwoFactorChallenge(user._id.toString());
      console.log(`[2FA] Google login code for ${user.email}: ${challenge.code}`);

      return res.json({
        success: true,
        requiresTwoFactor: true,
        message: 'Two-factor authentication code is required',
        twoFactorToken: challenge.token,
        ...(process.env.NODE_ENV !== 'production' ? { twoFactorCode: challenge.code } : {})
      });
    }

    const token = generateToken(user._id.toString());

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      ...buildAuthenticatedPayload(user, token),
      message: 'Google authentication successful'
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(401).json({
      success: false,
      message: error?.message || 'Google authentication failed'
    });
  }
};

export const verifyTwoFactor = async (req: Request, res: Response) => {
  try {
    const twoFactorToken = asString(req.body?.twoFactorToken, 100);
    const code = asString(req.body?.code, 10);

    if (!twoFactorToken || !code) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor token and code are required'
      });
    }

    const challenge = twoFactorChallenges.get(twoFactorToken);
    if (!challenge) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired two-factor token'
      });
    }

    if (Date.now() > challenge.expiresAt) {
      twoFactorChallenges.delete(twoFactorToken);
      return res.status(400).json({
        success: false,
        message: 'Two-factor code expired. Please login again.'
      });
    }

    if (challenge.code !== code) {
      return res.status(401).json({
        success: false,
        message: 'Invalid two-factor code'
      });
    }

    const user = await User.findById(challenge.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    twoFactorChallenges.delete(twoFactorToken);
    issueAuthResponse(res, user);
  } catch (error: any) {
    console.error('Two-factor verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during two-factor verification'
    });
  }
};

export const getPublicAuthSettings = async (req: Request, res: Response) => {
  try {
    const settings = await getAuthSettings();
    res.json(settings);
  } catch (error: any) {
    console.error('Auth settings fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch authentication settings'
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const email = asString(req.body?.email, 200).toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    const user = await User.findOne({ email });

    // Avoid account enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If this email exists, a reset link has been sent'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Jury AI Password Reset',
        template: 'password-reset',
        data: {
          name: user.name,
          resetUrl,
        }
      });
    } catch (emailError) {
      console.error('Password reset email send failed:', emailError);
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({
          success: false,
          message: 'Unable to send reset email right now. Please try again later.'
        });
      }
    }

    return res.json({
      success: true,
      message: 'Password reset link sent to your email',
      ...(process.env.NODE_ENV !== 'production' ? { resetUrl } : {})
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Server error during password reset request'
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const token = asString(req.body?.token, 500);
    const password = asString(req.body?.password, 200);

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const authSettings = await getAuthSettings();
    const passwordError = validatePasswordWithSettings(password, authSettings);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successful. Please sign in with your new password.'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Server error during password reset'
    });
  }
};
