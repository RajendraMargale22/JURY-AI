import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Mock routes
import authRoutes from './routes/authMock';
import adminRoutes from './routes/adminMock';
import chatRoutes from './routes/chat';
import templateRoutes from './routes/templates';

import { errorHandler } from './middleware/errorHandler';
import { attachRequestContext } from './middleware/requestContext';
import { responseEnvelope } from './middleware/responseEnvelope';

dotenv.config();

const app = express();
const allowedOrigins = ['http://localhost:3000'];

const isUnsafeMethod = (method: string) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());

const csrfOriginGuard: express.RequestHandler = (req, res, next) => {
  if (!isUnsafeMethod(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  const hasValidOrigin = !!origin && allowedOrigins.some((allowed) => origin.startsWith(allowed));
  const hasValidReferer = !!referer && allowedOrigins.some((allowed) => referer.startsWith(allowed));

  if (!hasValidOrigin && !hasValidReferer) {
    return res.status(403).json({ message: 'CSRF validation failed' });
  }

  return next();
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(compression());
app.use(limiter);
app.use(morgan('combined'));
app.use(attachRequestContext);
app.use(responseEnvelope);
app.use(csrfOriginGuard);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth')) {
    return next();
  }
  return csrfProtection(req, res, next);
});

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/templates', templateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Jury AI Backend is running with mock database'
  });
});

// 404 handler - must come before error handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Using mock database for demonstration`);
  console.log(`📧 Demo credentials:`);
  console.log(`   Admin: username=admin, password=password`);
  console.log(`   User: username=demo_user, password=password`);
  console.log(`   Lawyer: username=demo_lawyer, password=password`);
});

export default app;
