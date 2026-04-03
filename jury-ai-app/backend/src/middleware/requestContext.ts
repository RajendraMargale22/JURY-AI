import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const attachRequestContext = (req: Request, res: Response, next: NextFunction): void => {
  const headerValue = req.header('x-request-id');
  const requestId = (headerValue && headerValue.trim()) || randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
