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
