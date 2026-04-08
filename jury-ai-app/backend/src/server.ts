import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import rateLimit from 'express-rate-limit';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './config/database';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import chatRoutes from './routes/chat';
import templateRoutes from './routes/templates';
// import userRoutes from './routes/users';
import lawyerRoutes from './routes/lawyers';
// import documentRoutes from './routes/documents';
// import analyticsRoutes from './routes/analytics';
import { errorHandler } from './middleware/errorHandler';
import { attachRequestContext } from './middleware/requestContext';
import { responseEnvelope } from './middleware/responseEnvelope';
// import { socketHandler } from './utils/socketHandler';

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_URL || 'http://localhost:3000'
];

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

// Rate limiting (more lenient for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 for dev, 100 for production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(limiter);
app.use(morgan('combined'));
app.use(attachRequestContext);
app.use(responseEnvelope);

// CORS configuration - must be before routes
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition']
}));
app.use(csrfOriginGuard);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth')) {
      return next();
    }
    return csrfProtection(req, res, next);
  });

  app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });
} else {
  app.get('/api/csrf-token', (_req, res) => {
    res.json({ csrfToken: 'dev-csrf-disabled' });
  });
}

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/lawyers', lawyerRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/documents', documentRoutes);
// app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Socket.io setup (will be implemented later)
// socketHandler(io);

// 404 handler - must come before error handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});

const io = new SocketServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

void io;

export default app;
