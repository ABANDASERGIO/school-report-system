import { Request, Response, NextFunction } from 'express';
import { ApiErrorClass } from '../utils/response';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    statusCode: 404,
  });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof ApiErrorClass) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  const message = err.message || 'An unexpected error occurred';
  const isInfrastructureError =
    err.name === 'PrismaClientInitializationError' ||
    err.name === 'PrismaClientUnknownRequestError' ||
    /Can't reach database server|database server|connection refused|ETIMEDOUT|ENOTFOUND|ECONNREFUSED/i.test(message);

  if (isInfrastructureError) {
    res.status(503).json({
      success: false,
      error: 'ServiceUnavailable',
      message: 'Service is temporarily unavailable. Please check your internet connection and try again.',
      statusCode: 503,
    });
    return;
  }

  // Prisma known errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: 'ConflictError',
        message: 'A record with this data already exists.',
        statusCode: 409,
      });
      return;
    }
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Record not found.',
        statusCode: 404,
      });
      return;
    }
  }

  // Default error
  res.status(500).json({
    success: false,
    error: 'InternalServerError',
    message: process.env.NODE_ENV === 'development' ? message : 'An unexpected error occurred',
    statusCode: 500,
  });
}
