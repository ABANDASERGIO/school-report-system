import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  requestCodeSchema,
  verifyCodeSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register the first proprietor account. Subsequent calls are rejected.
 * Public route.
 */
router.post(
  '/register',
  validateBody(registerSchema),
  authController.register
);

/**
 * POST /api/v1/auth/login
 * Login with email and password.
 * Public route.
 */
router.post(
  '/login',
  validateBody(loginSchema),
  authController.login
);

/**
 * POST /api/v1/auth/refresh
 * Exchange a valid refresh token for a new access + refresh token pair.
 * Public route.
 */
router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  authController.refresh
);

/**
 * POST /api/v1/auth/forgot-password
 * Legacy lookup used by older clients. The new recovery flow is
 * /auth/request-code (purpose=FORGOT_PASSWORD) followed by
 * /auth/reset-password (which now requires the code).
 * Public route.
 */
router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * POST /api/v1/auth/request-code
 * Issue a 6-digit verification code for password reset, email change, etc.
 * Public route.
 */
router.post(
  '/request-code',
  validateBody(requestCodeSchema),
  authController.requestCode
);

/**
 * POST /api/v1/auth/verify-code
 * Check whether a verification code is valid (does not consume it for a
 * state change). Public route.
 */
router.post(
  '/verify-code',
  validateBody(verifyCodeSchema),
  authController.verifyCode
);

/**
 * POST /api/v1/auth/reset-password
 * Reset a proprietor password. Requires a valid code issued by /request-code
 * with purpose=FORGOT_PASSWORD.
 * Public route.
 */
router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

/**
 * GET /api/v1/auth/has-proprietor
 * Check if a proprietor account exists (used by signup page to lock it).
 * Public route.
 */
router.get('/has-proprietor', authController.hasProprietor);

/**
 * GET /api/v1/auth/me
 * Get the currently authenticated user.
 * Protected route.
 */
router.get('/me', authenticate, authController.me);

/**
 * POST /api/v1/auth/logout
 * Logout endpoint. Stateless JWT in MVP - client discards tokens.
 * Protected route (so we know who is logging out).
 */
router.post('/logout', authenticate, authController.logout);

/**
 * POST /api/v1/auth/change-password
 * Authenticated self-service password change. Requires the current password.
 * Protected route.
 */
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

export default router;
