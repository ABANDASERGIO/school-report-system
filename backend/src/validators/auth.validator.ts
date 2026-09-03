import { z } from 'zod';

const codeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Verification code must be 6 digits');

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  schoolName: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Backward-compatible lookup used by the legacy forgot-password page. The
// recovery flow now goes through /auth/request-code + /auth/reset-password
// (with the code), but the old endpoint is kept for compatibility.
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// New: request a verification code (purpose determines which flow).
export const requestCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
  purpose: z.enum(['FORGOT_PASSWORD', 'RESET_PASSWORD', 'EMAIL_CHANGE', 'WELCOME']),
  newEmail: z.string().email('Invalid email address').optional(),
});

// New: verify a code without consuming it for a state change (optional helper).
export const verifyCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: codeSchema,
  purpose: z.enum(['FORGOT_PASSWORD', 'RESET_PASSWORD', 'EMAIL_CHANGE', 'WELCOME']),
});

// New: reset a proprietor password with a previously-issued code.
export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: codeSchema,
  newPassword: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Authenticated change-password. The current password is required so a
 * stolen access token alone is not enough to take over an account.
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type RequestCodeInput = z.infer<typeof requestCodeSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
