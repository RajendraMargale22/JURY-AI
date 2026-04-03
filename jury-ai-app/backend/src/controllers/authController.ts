import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import admin from 'firebase-admin';
import User from '../models/User';
import { AuthRequest } from '../types/interfaces';

let firebaseInitialized = false;

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
    const name = asString(req.body?.name, 100);
    const email = asString(req.body?.email, 200).toLowerCase();
    const password = asString(req.body?.password, 200);
    const role = asString(req.body?.role, 20);

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
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

    // Generate token
    const token = generateToken(user._id.toString());

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
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

    // Generate token
    const token = generateToken(user._id.toString());

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
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
    const idToken = asString(req.body?.idToken, 5000);
    const role = asString(req.body?.role, 20);

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

    const token = generateToken(user._id.toString());

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Google authentication successful',
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
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(401).json({
      success: false,
      message: error?.message || 'Google authentication failed'
    });
  }
};
