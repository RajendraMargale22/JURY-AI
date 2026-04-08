import { Response } from 'express';
import User from '../models/User';
import Chat from '../models/Chat';
import Document from '../models/Document';
import Template from '../models/Template';
import SystemSettings from '../models/SystemSettings';
import { AuthRequest } from '../types/interfaces';
import {
  defaultSystemSettings,
  normalizeSettingsPayload,
  getMergedSystemSettings,
} from '../utils/systemSettings';

const asString = (value: unknown, maxLength = 200): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const asPositiveInt = (value: unknown, fallback: number, max = 100): number => {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


// Get dashboard statistics
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalLawyers,
      pendingVerifications,
      totalChats,
      totalTemplates,
      totalDocuments
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'lawyer' }),
      User.countDocuments({ role: 'lawyer', isEmailVerified: false }),
      Chat.countDocuments(),
      Template.countDocuments(),
      Document.countDocuments()
    ]);

    // Recent activities
    const recentActivity = [
      {
        type: 'User Registration',
        description: 'New user registered',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      },
      {
        type: 'Document Upload',
        description: 'Document analysis completed',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        type: 'Template Created',
        description: 'New legal template added',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      }
    ];

    res.json({
      totalUsers,
      totalLawyers,
      pendingVerifications,
      totalChats,
      totalPosts: 0, // Community posts removed
      totalTemplates,
      totalDocuments,
      recentActivity
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

// Get users with pagination and filtering
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = asPositiveInt(req.query.page, 1, 10000);
    const limit = asPositiveInt(req.query.limit, 10, 100);
    const search = asString(req.query.search, 120);
    const role = asString(req.query.role, 40);
    const status = asString(req.query.status, 40);

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    const andConditions: any[] = [];
    if (search) {
      const safeSearch = escapeRegex(search);
      andConditions.push({
        $or: [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } }
        ]
      });
    }
    if (role && role !== 'all') {
      query.role = role;
    }
    if (status && status !== 'all') {
      if (status === 'active') {
        andConditions.push({
          $or: [
          { accountStatus: 'active' },
          { accountStatus: { $exists: false }, isActive: true }
          ]
        });
      } else if (status === 'inactive') {
        andConditions.push({
          $or: [
            { accountStatus: 'inactive' },
            { accountStatus: { $exists: false }, isActive: false }
          ]
        });
      } else if (status === 'suspended') {
        query.accountStatus = 'suspended';
      }
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    // Map users to match frontend expectations
    const mappedUsers = users.map(user => ({
      _id: user._id,
      username: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isEmailVerified || false,
      status: user.accountStatus || (user.isActive ? 'active' : 'inactive'),
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));

    res.json({
      users: mappedUsers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// Update user
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

// Delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?.id?.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account'
      });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // TODO: Clean up user-related data (chats, documents, etc.)

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// Update user account status (active/inactive/suspended)
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const status = asString(req.body?.status, 20) as 'active' | 'inactive' | 'suspended';

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be active, inactive, or suspended'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.accountStatus = status;
    user.isActive = status === 'active';
    await user.save();

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: {
        id: user._id,
        status: user.accountStatus,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

// Suspend/activate user
export const suspendUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    user.accountStatus = user.isActive ? 'active' : 'suspended';
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'suspended'} successfully`,
      data: { isActive: user.isActive, status: user.accountStatus }
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

// Get lawyers with verification status
export const getLawyers = async (req: AuthRequest, res: Response) => {
  try {
    const page = asPositiveInt(req.query.page, 1, 10000);
    const limit = asPositiveInt(req.query.limit, 10, 100);
    const status = asString(req.query.status, 40);
    const search = asString(req.query.search, 120);

    const skip = (page - 1) * limit;

    const query: any = { role: 'lawyer' };
    
    if (status && status !== 'all') {
      if (status === 'pending') {
        query.lawyerVerificationStatus = 'pending';
      } else if (status === 'verified') {
        query.lawyerVerificationStatus = 'verified';
      } else if (status === 'rejected') {
        query.lawyerVerificationStatus = 'rejected';
      }
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const [lawyers, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    // Map lawyers to match frontend expectations
    const mappedLawyers = lawyers.map(lawyer => ({
      _id: lawyer._id,
      username: lawyer.name,
      email: lawyer.email,
      phone: lawyer.profile?.phone || '',
      specializations: lawyer.specialization || [],
      experience: lawyer.experience || 0,
      licenseNumber: lawyer.barNumber || '',
      barAssociation: lawyer.city || '',
      verificationStatus: lawyer.lawyerVerificationStatus || (lawyer.isEmailVerified ? 'verified' : 'pending'),
      isVerified: (lawyer.lawyerVerificationStatus || (lawyer.isEmailVerified ? 'verified' : 'pending')) === 'verified',
      isActive: lawyer.isActive,
      createdAt: lawyer.createdAt,
      verifiedAt: lawyer.verifiedAt,
      verifiedBy: lawyer.verifiedBy,
      documents: []
    }));

    res.json({
      lawyers: mappedLawyers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get lawyers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lawyers'
    });
  }
};

// Verify lawyer
export const verifyLawyer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, action, notes, reason } = req.body;

    const requestedStatus = status || (action === 'approve' ? 'verified' : action === 'reject' ? 'rejected' : undefined);

    if (!requestedStatus || !['verified', 'rejected', 'suspended'].includes(requestedStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be verified, rejected, or suspended'
      });
    }

    const lawyer = await User.findById(id);
    if (!lawyer || lawyer.role !== 'lawyer') {
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found'
      });
    }

    if (requestedStatus === 'verified') {
      lawyer.isEmailVerified = true;
      lawyer.isVerified = true;
      lawyer.isActive = true;
    } else if (requestedStatus === 'rejected') {
      lawyer.isActive = false;
      lawyer.isEmailVerified = false;
    } else if (requestedStatus === 'suspended') {
      lawyer.isActive = false;
    }

    lawyer.lawyerVerificationStatus = requestedStatus;

    // Add verification notes
    lawyer.verificationNotes = notes || reason;
    lawyer.verifiedAt = new Date();
    lawyer.verifiedBy = req.user.id;

    await lawyer.save();

    res.json({
      success: true,
      message: `Lawyer ${requestedStatus} successfully`,
      data: lawyer
    });
  } catch (error) {
    console.error('Verify lawyer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify lawyer'
    });
  }
};

// Get chat sessions
export const getChatSessions = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const [chats, total] = await Promise.all([
      Chat.find(query)
        .populate('user', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Chat.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        chats,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat sessions'
    });
  }
};

// Get documents
export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;

    const skip = (page - 1) * limit;

    const query: any = {};
    if (type) {
      query.type = type;
    }

    const [documents, total] = await Promise.all([
      Document.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Document.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    });
  }
};

// Get templates
export const getTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const templates = await Template.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
};

// Create template
export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, content, fields = [] } = req.body;

    const template = new Template({
      title,
      description,
      category,
      content,
      fields,
      createdBy: req.user.id
    });

    await template.save();
    await template.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template'
    });
  }
};

// Update template
export const updateTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const template = await Template.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template'
    });
  }
};

// Update template status (activate/deactivate)
export const updateTemplateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const template = await Template.findByIdAndUpdate(
      id,
      { isActive, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template status updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Update template status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template status'
    });
  }
};

// Delete template
export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await Template.findByIdAndDelete(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template'
    });
  }
};

// Get analytics
export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const period = asString(req.query.period, 8) || '30d';
    const type = asString(req.query.type, 30);
    void type;

    // Calculate date range
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '1y') days = 365;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Mock analytics data for now
    const analytics = {
      userGrowth: {
        labels: Array.from({ length: days }, (_, i) => {
          const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          return date.toLocaleDateString();
        }),
        data: Array.from({ length: days }, () => Math.floor(Math.random() * 50) + 10)
      },
      chatSessions: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: [120, 150, 180, 200, 160, 90, 100]
      },
      documentTypes: {
        labels: ['Contracts', 'Legal Notices', 'Agreements', 'Patents', 'Others'],
        data: [35, 25, 20, 15, 5]
      },
      performance: {
        avgResponseTime: '2.3s',
        uptime: '99.9%',
        satisfactionRate: '94%',
        activeUsers: 1250
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

// Get system settings
export const getSystemSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await getMergedSystemSettings();

    res.json(settings);
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings'
    });
  }
};

// Update system settings
export const updateSystemSettings = async (req: AuthRequest, res: Response) => {
  try {
    const incoming = (req.body || {}) as Record<string, unknown>;
    const updates = normalizeSettingsPayload(incoming);

    const existingDoc = await SystemSettings.findOne({ key: 'global' }).lean();
    const existingSettings = (existingDoc?.settings || {}) as Record<string, unknown>;

    const mergedSettings = {
      ...defaultSystemSettings,
      ...normalizeSettingsPayload(existingSettings),
      ...updates
    };

    await SystemSettings.findOneAndUpdate(
      { key: 'global' },
      {
        key: 'global',
        settings: mergedSettings,
        updatedBy: req.user?.id
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    res.json({
      success: true,
      message: 'System settings updated successfully',
      data: mergedSettings
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings'
    });
  }
};
