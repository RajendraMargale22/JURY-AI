import { Request, Response } from 'express';

// Logout user
export const logout = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Get user profile (public, demo)
export const getProfile = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      user: {
        id: 'demo-admin-id',
        name: 'Aditya Jare',
        email: 'aditya@example.com',
        role: 'admin',
        isEmailVerified: true,
        avatar: undefined
      }
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
