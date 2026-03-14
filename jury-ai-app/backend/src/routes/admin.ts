import express from 'express';
import { body, query } from 'express-validator';
import {
  getDashboardStats,
  getUsers,
  updateUser,
  deleteUser,
  getLawyers,
  verifyLawyer,
  suspendUser,
  getChatSessions,
  getDocuments,
  getTemplates,
  createTemplate,
  updateTemplate,
  updateTemplateStatus,
  deleteTemplate,
  getAnalytics,
  getSystemSettings,
  updateSystemSettings
} from '../controllers/adminController';
import { adminAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/errorHandler';

const router = express.Router();

// Dashboard stats
router.get('/dashboard', adminAuth, getDashboardStats);

// User management
router.get('/users', [
  adminAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional({ checkFalsy: false }).isString().withMessage('Search must be a string'),
  query('role').optional({ checkFalsy: false }).isIn(['user', 'lawyer', 'admin', 'all', '']).withMessage('Invalid role filter'),
  query('status').optional({ checkFalsy: false }).isIn(['active', 'inactive', 'suspended', 'all', '']).withMessage('Invalid status filter')
], validateRequest, getUsers);

router.put('/users/:id', [
  adminAuth,
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('role').optional().isIn(['user', 'lawyer', 'admin']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], validateRequest, updateUser);

router.delete('/users/:id', adminAuth, deleteUser);

router.put('/users/:id/suspend', adminAuth, suspendUser);

// Lawyer management
router.get('/lawyers', [
  adminAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional({ checkFalsy: false }).isString().withMessage('Search must be a string'),
  query('status').optional({ checkFalsy: false }).isIn(['pending', 'verified', 'rejected', 'all', '']).withMessage('Invalid status filter')
], validateRequest, getLawyers);

router.put('/lawyers/:id/verify', [
  adminAuth,
  body('status').isIn(['verified', 'rejected']).withMessage('Status must be verified or rejected'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], validateRequest, verifyLawyer);

// Chat monitoring
router.get('/chats', [
  adminAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'completed', 'flagged']).withMessage('Invalid status filter')
], validateRequest, getChatSessions);

// Document management
router.get('/documents', [
  adminAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isString().withMessage('Type must be a string')
], validateRequest, getDocuments);

// Template management
router.get('/templates', adminAuth, getTemplates);

router.post('/templates', [
  adminAuth,
  body('title').trim().isLength({ min: 2, max: 100 }).withMessage('Template title must be between 2 and 100 characters'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('category').isString().withMessage('Category is required'),
  body('content').isString().withMessage('Content is required'),
  body('fields').optional().isArray().withMessage('Fields must be an array')
], validateRequest, createTemplate);

router.put('/templates/:id', [
  adminAuth,
  body('title').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Template title must be between 2 and 100 characters'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('category').optional().isString().withMessage('Category must be a string'),
  body('content').optional().isString().withMessage('Content must be a string'),
  body('fields').optional().isArray().withMessage('Fields must be an array')
], validateRequest, updateTemplate);

router.put('/templates/:id/status', [
  adminAuth,
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], validateRequest, updateTemplateStatus);

router.delete('/templates/:id', adminAuth, deleteTemplate);

// Analytics
router.get('/analytics', [
  adminAuth,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('type').optional().isIn(['users', 'chats', 'documents', 'revenue']).withMessage('Invalid analytics type')
], validateRequest, getAnalytics);

// System settings
router.get('/settings', adminAuth, getSystemSettings);

router.put('/settings', [
  adminAuth,
  body('siteName').optional().isString().withMessage('Site name must be a string'),
  body('adminEmail').optional().isEmail().withMessage('Please provide a valid admin email'),
  body('maxUploadSize').optional().isInt({ min: 1, max: 100 }).withMessage('Max upload size must be between 1 and 100 MB'),
  body('maintenanceMode').optional().isBoolean().withMessage('Maintenance mode must be a boolean'),
  body('sessionTimeout').optional().isInt({ min: 5, max: 480 }).withMessage('Session timeout must be between 5 and 480 minutes'),
  body('twoFactorAuth').optional().isBoolean().withMessage('Two factor auth must be a boolean'),
  body('ipWhitelist').optional().isBoolean().withMessage('IP whitelist must be a boolean')
], validateRequest, updateSystemSettings);

export default router;
