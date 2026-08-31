import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiErrorClass } from '../utils/response';

/**
 * Middleware factory that validates req.body against a Zod schema.
 * Replaces req.body with the parsed (and stripped) data on success.
 */
export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        next(new ApiErrorClass(400, messages, 'ValidationError'));
        return;
      }
      next(error);
    }
  };
}

/**
 * Middleware factory that validates req.query against a Zod schema.
 */
export function validateQuery<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        next(new ApiErrorClass(400, messages, 'ValidationError'));
        return;
      }
      next(error);
    }
  };
}

/**
 * Middleware factory that validates req.params against a Zod schema.
 */
export function validateParams<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.params);
      req.params = parsed as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        next(new ApiErrorClass(400, messages, 'ValidationError'));
        return;
      }
      next(error);
    }
  };
}
