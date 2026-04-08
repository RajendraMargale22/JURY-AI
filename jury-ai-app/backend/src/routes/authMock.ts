import express from 'express';
import { logout, getProfile, updateProfile, getPublicAuthSettings } from '../controllers/authControllerMock';
// import { auth } from '../middleware/authMock';

const router = express.Router();

// Public routes
router.post('/logout', logout);
router.get('/settings', getPublicAuthSettings);

// Make profile routes public for demo
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
