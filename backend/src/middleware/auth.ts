import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';
import { ApiErrorClass } from '../utils/response';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiErrorClass(401, 'Authentication required. Please provide a valid token.', 'Unauthorized');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof ApiErrorClass) {
      next(error);
      return;
    }
    next(new ApiErrorClass(401, 'Invalid or expired token', 'Unauthorized'));
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiErrorClass(401, 'Authentication required', 'Unauthorized'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ApiErrorClass(403, 'You do not have permission to perform this action', 'Forbidden'));
      return;
    }

    next();
  };
}

export const requireProprietor = requireRole(UserRole.PROPRIETOR);
export const requireTeacher = requireRole(UserRole.TEACHER, UserRole.PROPRIETOR);
