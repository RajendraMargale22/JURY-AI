import { Request, Response } from 'express';

// Logout user
export const logout = (req: Request, res: Response) => {
  res.cookie('token', 'mock-jwt-token', {
    httpOnly: true,
    expires: new Date(0), // expire immediately
  });
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

const dummyUser = {
  id: 'demo-admin-id',
  uid: 'demo-admin-id',
  name: 'Aditya Jare',
  email: 'aditya@example.com',
  role: 'admin',
  isEmailVerified: true,
  avatar: undefined
};

// Login user
export const login = (req: Request, res: Response) => {
  res.cookie('token', 'mock-jwt-token', { httpOnly: true });
  res.json({
    success: true,
    token: 'mock-jwt-token',
    user: dummyUser
  });
};

// Register user
export const register = (req: Request, res: Response) => {
  res.cookie('token', 'mock-jwt-token', { httpOnly: true });
  res.json({
    success: true,
    token: 'mock-jwt-token',
    user: dummyUser
  });
};

export const googleAuth = (req: Request, res: Response) => {
  res.cookie('token', 'mock-jwt-token', { httpOnly: true });
  res.json({
    success: true,
    token: 'mock-jwt-token',
    user: dummyUser
  });
};

// Get user profile (public, demo)
export const getProfile = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      user: dummyUser
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Update user profile (public, demo)
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, phone, bio, specialization, experience } = req.body;
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: 'demo-admin-id',
        name: name || 'Aditya Jare',
        email: 'aditya@example.com',
        role: 'admin',
        isEmailVerified: true,
        avatar: undefined,
        phone,
        bio,
        specialization,
        experience
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during profile update' 
    });
  }
};

export const getPublicAuthSettings = async (_req: Request, res: Response) => {
  // Import the actual settings store so toggling features in admin panel takes effect
  try {
    const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/admin/settings`, {
      headers: { 'Authorization': 'Bearer mock-jwt-token' }
    });
    if (response.ok) {
      const payload = await response.json() as any;
      const data = payload?.data || payload;
      res.json({
        registrationEnabled: data.registrationEnabled ?? true,
        socialLoginEnabled: data.socialLoginEnabled ?? false,
        twoFactorEnabled: data.twoFactorEnabled ?? false,
        chatEnabled: data.chatEnabled ?? true,
        templatesEnabled: data.templatesEnabled ?? true,
        documentAnalysisEnabled: data.documentAnalysisEnabled ?? true,
        passwordMinLength: data.passwordMinLength ?? 8,
        passwordRequireUppercase: data.passwordRequireUppercase ?? true,
        passwordRequireNumbers: data.passwordRequireNumbers ?? true,
        passwordRequireSpecialChars: data.passwordRequireSpecialChars ?? false,
      });
      return;
    }
  } catch (err) {
    // Fall through to defaults
  }
  res.json({
    registrationEnabled: true,
    socialLoginEnabled: true,
    twoFactorEnabled: false,
    chatEnabled: true,
    templatesEnabled: true,
    documentAnalysisEnabled: true,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your email address'
    });
  }

  const resetUrl = 'http://localhost:3000/reset-password?token=mock-reset-token';
  return res.json({
    success: true,
    message: 'Password reset link sent to your email',
    resetUrl,
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const token = String(req.body?.token || '').trim();
  const password = String(req.body?.password || '').trim();

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: 'Reset token and new password are required'
    });
  }

  return res.json({
    success: true,
    message: 'Password reset successful. Please sign in with your new password.'
  });
};
