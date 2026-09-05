import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { API_PREFIX } from './config/constants';
import authRoutes from './routes/auth.routes';
import teacherRoutes from './routes/teacher.routes';
import settingsRoutes from './routes/settings.routes';
import sessionRoutes from './routes/session.routes';
import termRoutes from './routes/term.routes';
import sequenceRoutes from './routes/sequence.routes';
import classRoutes from './routes/class.routes';
import subjectRoutes from './routes/subject.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import studentRoutes from './routes/student.routes';
import assignmentRoutes from './routes/assignment.routes';
import resultRoutes from './routes/result.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportCardRoutes from './routes/report-card.routes';
import notificationRoutes from './routes/notification.routes';
import auditLogRoutes from './routes/audit-log.routes';
import uploadRoutes from './routes/upload.routes';
import { prisma } from './config/database';

export function createApp(): Application {
  const app = express();

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting for public auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'TooManyRequests',
      message: 'Too many attempts. Please try again later.',
      statusCode: 429,
    },
  });

  const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'TooManyRequests',
      message: 'Too many OTP requests. Please try again in an hour.',
      statusCode: 429,
    },
  });

  // CORS
  // In development, allow any localhost origin. In production, use the configured FRONTEND_URL.
  const corsOrigin = env.isDevelopment
    ? true
    : env.frontendUrl;

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Health check
  app.get('/health', async (_req: Request, res: Response) => {
    let dbOk = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }
    res.json({
      success: dbOk,
      message: dbOk ? 'EduGrade API is running' : 'Database unreachable',
      timestamp: new Date().toISOString(),
      environment: env.nodeEnv,
      database: dbOk ? 'connected' : 'error',
    });
  });

  // API routes with rate limiting
  app.use(`${API_PREFIX}/auth/register`, authLimiter);
  app.use(`${API_PREFIX}/auth/login`, authLimiter);
  app.use(`${API_PREFIX}/auth/forgot-password`, authLimiter);
  app.use(`${API_PREFIX}/auth/request-code`, otpLimiter);
  app.use(`${API_PREFIX}/auth/verify-code`, authLimiter);
  app.use(`${API_PREFIX}/auth/reset-password`, authLimiter);
  app.use(`${API_PREFIX}/auth/has-proprietor`, authLimiter);

  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/teachers`, teacherRoutes);
  app.use(`${API_PREFIX}/settings`, settingsRoutes);
  app.use(`${API_PREFIX}/sessions`, sessionRoutes);
  app.use(`${API_PREFIX}/terms`, termRoutes);
  app.use(`${API_PREFIX}/sequences`, sequenceRoutes);
  app.use(`${API_PREFIX}/classes`, classRoutes);
  app.use(`${API_PREFIX}/subjects`, subjectRoutes);
  app.use(`${API_PREFIX}/enrollments`, enrollmentRoutes);
  app.use(`${API_PREFIX}/students`, studentRoutes);
  app.use(`${API_PREFIX}/assignments`, assignmentRoutes);
  app.use(`${API_PREFIX}/results`, resultRoutes);
  app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
  app.use(`${API_PREFIX}/report-cards`, reportCardRoutes);
  app.use(`${API_PREFIX}/notifications`, notificationRoutes);
  app.use(`${API_PREFIX}/audit-logs`, auditLogRoutes);
  app.use(`${API_PREFIX}/uploads`, uploadRoutes);

  // Catch-all for unimplemented API routes
  app.use(API_PREFIX, (_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'NotFound',
      message: 'API endpoint not found',
      statusCode: 404,
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
