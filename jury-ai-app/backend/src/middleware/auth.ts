import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;

    console.log('Auth middleware - Token from header:', req.header('Authorization') ? 'exists' : 'none');
    console.log('Auth middleware - Token from cookie:', req.cookies.token ? 'exists' : 'none');

    if (!token) {
      console.log('Auth middleware - No token found');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      console.log('Auth middleware - User not found for token');
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (!user.isActive) {
      console.log('Auth middleware - User account is deactivated');
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    console.log('Auth middleware - User authenticated:', user.email, 'Role:', user.role);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await auth(req, res, () => {
      if (req.user && req.user.role === 'admin') {
        next();
      } else {
        res.status(403).json({ message: 'Admin access required' });
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export const lawyerAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await auth(req, res, () => {
      if (req.user && (req.user.role === 'lawyer' || req.user.role === 'admin')) {
        next();
      } else {
        res.status(403).json({ message: 'Lawyer access required' });
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};
