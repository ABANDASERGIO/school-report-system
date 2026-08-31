import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { successResponse } from '../utils/response';
import { ApiErrorClass } from '../utils/response';
import type {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  RefreshTokenInput,
} from '../validators/auth.validator';

export const authController = {
  /**
   * POST /api/v1/auth/register
   * Register the first proprietor account.
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RegisterInput;
      const result = await authService.registerProprietor(input);
      res.status(201).json(successResponse(result, 'Proprietor account created successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/login
   * Login with email and password.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as LoginInput;
      const result = await authService.login(input);
      res.status(200).json(successResponse(result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/auth/me
   * Get current authenticated user.
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiErrorClass(401, 'Authentication required', 'Unauthorized');
      }
      const user = await authService.getCurrentUser(req.user.userId);
      res.status(200).json(successResponse(user));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token using a valid refresh token.
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as RefreshTokenInput;
      const result = await authService.refreshToken(refreshToken);
      res.status(200).json(successResponse(result, 'Token refreshed'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/logout
   * Logout endpoint (client should discard tokens).
   * Stateless JWT - server has nothing to invalidate in MVP.
   */
  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(successResponse(null, 'Logged out successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/forgot-password
   * Look up a proprietor account by email.
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const user = await authService.findUserByEmail(email);
      if (!user) {
        throw new ApiErrorClass(404, 'No account found with that email.', 'UserNotFound');
      }
      if (user.role !== 'PROPRIETOR') {
        throw new ApiErrorClass(
          403,
          'This recovery page is for proprietor accounts only.',
          'NotProprietor'
        );
      }
      res.status(200).json(successResponse({ email: user.email }, 'Proprietor account found'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/reset-password
   * Reset proprietor password.
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as ResetPasswordInput;
      await authService.resetPasswordByEmail(input);
      res.status(200).json(successResponse(null, 'Password has been reset successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/auth/has-proprietor
   * Check if a proprietor account exists (used by signup page).
   */
  async hasProprietor(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exists = await authService.hasProprietor();
      res.status(200).json(successResponse({ exists }));
    } catch (error) {
      next(error);
    }
  },
};
