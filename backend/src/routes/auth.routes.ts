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
 * Look up a proprietor account by email for the recovery flow.
 * Public route.
 */
router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * POST /api/v1/auth/reset-password
 * Reset a proprietor password.
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

export default router;
