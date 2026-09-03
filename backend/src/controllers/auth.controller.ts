import { Request, Response, NextFunction } from 'express';
import { VerificationPurpose } from '@prisma/client';
import { authService } from '../services/auth.service';
import { verificationCodeService } from '../services/verification-code.service';
import { successResponse } from '../utils/response';
import { ApiErrorClass } from '../utils/response';
import type {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  RefreshTokenInput,
  RequestCodeInput,
  VerifyCodeInput,
  ChangePasswordInput,
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
   * Reset proprietor password. Requires a valid verification code issued via
   * /auth/request-code with purpose=FORGOT_PASSWORD.
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
   * POST /api/v1/auth/request-code
   * Issue a one-time 6-digit verification code for the given email + purpose.
   * For FORGOT_PASSWORD/RESET_PASSWORD the email must belong to an existing
   * proprietor account (we still return 200 on unknown emails to avoid email
   * enumeration, but the code is not delivered).
   */
  async requestCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RequestCodeInput;
      const email = input.email.toLowerCase();

      // Gate certain purposes to known proprietors.
      if (
        input.purpose === VerificationPurpose.FORGOT_PASSWORD ||
        input.purpose === VerificationPurpose.RESET_PASSWORD
      ) {
        const user = await authService.findUserByEmail(email);
        if (!user || user.role !== 'PROPRIETOR') {
          // Don't reveal whether the email exists. Return a generic success.
          res
            .status(200)
            .json(successResponse({ sent: false, devCode: undefined }, 'If the email matches a proprietor account, a code has been sent.'));
          return;
        }
      }

      const metadata = input.purpose === VerificationPurpose.EMAIL_CHANGE && input.newEmail
        ? { newEmail: input.newEmail.toLowerCase() }
        : undefined;

      const result = await verificationCodeService.requestCode({
        email,
        purpose: input.purpose as VerificationPurpose,
        metadata,
      });

      res.status(200).json(successResponse(result, 'Verification code sent'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/verify-code
   * Check whether a code is valid without consuming it for a state change.
   * Returns 200 with { valid: true } on success or 400 with an error code.
   */
  async verifyCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as VerifyCodeInput;
      await verificationCodeService.verifyCode({
        email: input.email,
        code: input.code,
        purpose: input.purpose as VerificationPurpose,
      });
      res.status(200).json(successResponse({ valid: true }, 'Code is valid'));
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

  /**
   * POST /api/v1/auth/change-password
   * Authenticated self-service password change. Requires the current password.
   * Protected route.
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiErrorClass(401, 'Authentication required', 'Unauthorized');
      }
      const input = req.body as ChangePasswordInput;
      await authService.changePassword(req.user.userId, input);
      res.status(200).json(successResponse(null, 'Password changed successfully'));
    } catch (error) {
      next(error);
    }
  },
};
