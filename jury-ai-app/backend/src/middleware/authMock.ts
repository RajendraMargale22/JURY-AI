import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { mockDB } from '../utils/mockDatabase';

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

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const user = mockDB.findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const adminAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

export const lawyerAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === 'lawyer' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Lawyer access required' });
  }
};
