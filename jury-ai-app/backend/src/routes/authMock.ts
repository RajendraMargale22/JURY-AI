import express from 'express';
import { logout, getProfile, updateProfile, getPublicAuthSettings, forgotPassword, resetPassword, login, register, googleAuth } from '../controllers/authControllerMock';
// import { auth } from '../middleware/authMock';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/google', googleAuth);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/settings', getPublicAuthSettings);

// Make profile routes public for demo
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
