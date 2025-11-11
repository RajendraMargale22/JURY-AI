import express from 'express';
import { auth, adminAuth } from '../middleware/authMock';
import {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  deleteUser,
  getLawyers,
  verifyLawyer,
  getCommunityPosts,
  updatePostStatus,
  deletePost,
  getTemplates,
  updateTemplateStatus,
  deleteTemplate,
  createTemplate,
  getSettings,
  updateSettings
} from '../controllers/adminControllerMock';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(adminAuth);

// Dashboard
router.get('/dashboard', getDashboardStats);

// User management
router.get('/users', getUsers);
router.put('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUser);

// Lawyer management
router.get('/lawyers', getLawyers);
router.put('/lawyers/:lawyerId/verify', verifyLawyer);

// Community management
router.get('/community', getCommunityPosts);
router.put('/community/:postId/status', updatePostStatus);
router.delete('/community/:postId', deletePost);

// Template management
router.get('/templates', getTemplates);
router.post('/templates', createTemplate);
router.put('/templates/:templateId/status', updateTemplateStatus);
router.delete('/templates/:templateId', deleteTemplate);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
