import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { API_PREFIX } from './config/constants';
import authRoutes from './routes/auth.routes';

export function createApp(): Application {
  const app = express();

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'EduGrade API is running',
      timestamp: new Date().toISOString(),
      environment: env.nodeEnv,
    });
  });

  // API routes
  app.use(`${API_PREFIX}/auth`, authRoutes);

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
