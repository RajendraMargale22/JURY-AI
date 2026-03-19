import { Request, Response } from 'express';
import { mockDB } from '../utils/mockDatabase';
import { AuthRequest } from '../types/interfaces';

type MockSettingsMap = Record<string, string | number | boolean | string[]>;

const defaultMockSettings: MockSettingsMap = {
  siteName: 'Jury AI',
  siteDescription: 'AI-Powered Legal Assistant Platform',
  siteUrl: 'http://localhost:3000',
  supportEmail: 'support@juryai.com',
  contactEmail: 'contact@juryai.com',
  maintenanceMode: false,
  registrationEnabled: true,
  emailVerificationRequired: true,
  maxFileUploadSize: 10,
  allowedFileTypes: ['pdf', 'doc', 'docx', 'txt'],
  sessionTimeout: 24,
  logLevel: 'info',
  backupFrequency: 'daily',
  chatEnabled: true,
  chatRateLimit: 10,
  templatesEnabled: true,
  documentAnalysisEnabled: true,
  lawyerVerificationEnabled: true,
  autoVerifyLawyers: false,
  analyticsEnabled: true,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: false,
  twoFactorEnabled: false,
  socialLoginEnabled: false,
  maxLoginAttempts: 5,
  lockoutDuration: 15
};

let mockSettingsStore: MockSettingsMap = { ...defaultMockSettings };

// Get dashboard statistics
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = mockDB.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users with pagination and filters
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const role = req.query.role as string || 'all';
    const status = req.query.status as string || 'all';

    const result = mockDB.getAllUsers(page, limit, { search, role, status });
    
    res.json({
      users: result.users,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
      total: result.total
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user status
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const user = mockDB.updateUser(userId, { status });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User status updated successfully', user });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    // For demo purposes, we'll just mark as inactive instead of deleting
    const user = mockDB.updateUser(userId, { status: 'inactive' });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get lawyers with filters
export const getLawyers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const status = req.query.status as string || 'all';

    const result = mockDB.getAllUsers(page, limit, { search, role: 'lawyer', status });
    
    res.json({
      lawyers: result.users,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
      total: result.total
    });
  } catch (error) {
    console.error('Error fetching lawyers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify lawyer
export const verifyLawyer = async (req: AuthRequest, res: Response) => {
  try {
    const { lawyerId } = req.params;
    const { action, reason } = req.body;

    const updates: any = {};
    if (action === 'approve') {
      updates.isVerified = true;
      updates.verificationStatus = 'approved';
      updates.verifiedAt = new Date();
      updates.verifiedBy = req.user?.username;
    } else if (action === 'reject') {
      updates.isVerified = false;
      updates.verificationStatus = 'rejected';
      updates.rejectionReason = reason;
    }

    const lawyer = mockDB.updateUser(lawyerId, updates);
    
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    res.json({ 
      message: `Lawyer ${action}d successfully`, 
      lawyer 
    });
  } catch (error) {
    console.error('Error verifying lawyer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get community posts
export const getCommunityPosts = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const status = req.query.status as string || 'all';
    const category = req.query.category as string || 'all';

    const result = mockDB.getAllPosts(page, limit, { search, status, category });
    
    res.json({
      posts: result.posts,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
      total: result.total
    });
  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update post status
export const updatePostStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { status } = req.body;

    // In a real implementation, you'd update the post in the database
    res.json({ message: 'Post status updated successfully' });
  } catch (error) {
    console.error('Error updating post status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete post
export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    
    // In a real implementation, you'd delete the post from the database
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get templates
export const getTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const category = req.query.category as string || 'all';
    const status = req.query.status as string || 'all';

    const result = mockDB.getAllTemplates(page, limit, { search, category, status });
    
    res.json({
      templates: result.templates,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
      total: result.total
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update template status
export const updateTemplateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { templateId } = req.params;
    const { isActive } = req.body;

    const template = mockDB.updateTemplate(templateId, { isActive });
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({ message: 'Template status updated successfully', template });
  } catch (error) {
    console.error('Error updating template status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete template
export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { templateId } = req.params;
    
    // In a real implementation, you'd delete the template from the database
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create template
export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, content } = req.body;
    
    // In a real implementation, you'd create the template in the database
    res.status(201).json({ 
      message: 'Template created successfully',
      template: {
        id: Date.now().toString(),
        title,
        description,
        category,
        content,
        isActive: true,
        createdBy: req.user?.id,
        downloads: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get system settings
export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    res.json(mockSettingsStore);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update system settings
export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const incoming = (req.body || {}) as Record<string, unknown>;
    const nextSettings: MockSettingsMap = { ...mockSettingsStore };

    Object.keys(defaultMockSettings).forEach((key) => {
      if (!(key in incoming)) {
        return;
      }

      const defaultValue = defaultMockSettings[key];
      const candidate = incoming[key];

      if (typeof defaultValue === 'boolean' && typeof candidate === 'boolean') {
        nextSettings[key] = candidate;
      } else if (typeof defaultValue === 'number' && typeof candidate === 'number' && Number.isFinite(candidate)) {
        nextSettings[key] = candidate;
      } else if (typeof defaultValue === 'string' && typeof candidate === 'string') {
        nextSettings[key] = candidate;
      } else if (Array.isArray(defaultValue) && Array.isArray(candidate)) {
        nextSettings[key] = candidate.filter((item): item is string => typeof item === 'string');
      }
    });

    mockSettingsStore = nextSettings;

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: mockSettingsStore
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
