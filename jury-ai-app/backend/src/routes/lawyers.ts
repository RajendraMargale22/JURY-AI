import express from 'express';
import { body, query } from 'express-validator';
import {
  applyAsLawyer,
  getFeaturedLawyers,
  getMyLawyerProfile,
  getPublicLawyers
} from '../controllers/lawyerController';
import { auth } from '../middleware/auth';
import { validateRequest } from '../middleware/errorHandler';

const router = express.Router();

router.get('/public', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('search').optional({ checkFalsy: false }).isString().withMessage('Search must be a string'),
  query('specialization').optional({ checkFalsy: false }).isString().withMessage('Specialization must be a string'),
  query('verifiedOnly').optional().isIn(['true', 'false']).withMessage('verifiedOnly must be true or false')
], validateRequest, getPublicLawyers);

router.get('/featured', [
  query('limit').optional().isInt({ min: 1, max: 12 }).withMessage('Limit must be between 1 and 12')
], validateRequest, getFeaturedLawyers);

router.post('/apply', [
  auth,
  body('specialization').custom((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    return false;
  }).withMessage('At least one specialization is required'),
  body('barNumber').isString().trim().notEmpty().withMessage('Bar number is required'),
  body('experience').optional().isNumeric().withMessage('Experience must be numeric'),
  body('consultationFee').optional().isNumeric().withMessage('Consultation fee must be numeric'),
  body('city').optional().isString().withMessage('City must be a string'),
  body('languages').optional().custom((value) => Array.isArray(value) || typeof value === 'string').withMessage('Languages must be a string or array')
], validateRequest, applyAsLawyer);

router.get('/me', auth, getMyLawyerProfile);

export default router;
