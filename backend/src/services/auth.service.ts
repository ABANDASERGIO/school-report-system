import bcrypt from 'bcryptjs';
import { UserRole, User, VerificationPurpose } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiErrorClass } from '../utils/response';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  AccessToken,
  RefreshToken,
} from '../utils/jwt';
import type {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from '../validators/auth.validator';
import { verificationCodeService } from './verification-code.service';
import { mailService, buildBrandedHtml } from './mail.service';
import { APP_NAME } from '../config/constants';
import { auditLogService } from './audit-log.service';
import { notificationService } from './notification.service';

const BCRYPT_COST = 12;

export interface AuthResult {
  accessToken: AccessToken;
  refreshToken: RefreshToken;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: UserRole;
  };
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: (user as any).firstName ?? null,
    lastName: (user as any).lastName ?? null,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function buildAuthResult(user: User): AuthResult {
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = signRefreshToken({
    userId: user.id,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: (user as any).firstName ?? null,
      lastName: (user as any).lastName ?? null,
      role: user.role,
    },
  };
}

export const authService = {
  /**
   * Register the first proprietor account.
   * Only allowed if no proprietor exists yet.
   */
  async registerProprietor(input: RegisterInput): Promise<AuthResult> {
    // Check if any proprietor already exists
    const existingProprietor = await prisma.user.findFirst({
      where: { role: UserRole.PROPRIETOR },
    });

    if (existingProprietor) {
      throw new ApiErrorClass(
        409,
        'A proprietor account already exists. Contact support.',
        'ProprietorExists'
      );
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ApiErrorClass(
        409,
        'An account with this email already exists.',
        'EmailTaken'
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, BCRYPT_COST);

    // Create proprietor user
    const newUser = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        password: hashedPassword,
        role: UserRole.PROPRIETOR,
        isActive: true,
      },
    });

    // Optionally store school name in settings
    if (input.schoolName) {
      await prisma.schoolSetting.upsert({
        where: { key: 'school_name' },
        create: {
          key: 'school_name',
          value: input.schoolName,
          description: 'Official name of the school',
        },
        update: { value: input.schoolName },
      });
    }

    // Best-effort welcome email. We do not block registration on mail failures.
    try {
      const html = buildBrandedHtml({
        preheader: `Welcome to ${APP_NAME}!`,
        heading: `Welcome to ${APP_NAME}`,
        bodyHtml: `
          <p style="margin:0 0 16px 0;">Hello <strong>${input.firstName}</strong>,</p>
          <p style="margin:0 0 16px 0;">Your <strong>${APP_NAME}</strong> proprietor account has been created.</p>
          ${input.schoolName ? `<p style="margin:0 0 16px 0;">School: <strong>${input.schoolName}</strong></p>` : ''}
          <p style="margin:0;color:#475569;">You can sign in with the email address you used to register.</p>
        `,
      });
      const text =
        `Hello ${input.firstName},\n\n` +
        `Your ${APP_NAME} proprietor account has been created.\n\n` +
        (input.schoolName ? `School: ${input.schoolName}\n\n` : '') +
        `You can sign in with the email you used to register.`;
      await mailService.send({
        to: input.email,
        subject: `Welcome to ${APP_NAME}`,
        text,
        html,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[auth.registerProprietor] Failed to send welcome email:', err);
    }

    return buildAuthResult(newUser);
  },

  /**
   * Login with email and password.
   * Returns access token, refresh token, and user data.
   */
  async login(input: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new ApiErrorClass(401, 'Invalid email or password', 'InvalidCredentials');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new ApiErrorClass(401, 'Invalid email or password', 'InvalidCredentials');
    }

    if (!user.isActive) {
      throw new ApiErrorClass(
        403,
        'Your account has been deactivated. Contact the proprietor.',
        'AccountDeactivated'
      );
    }

    return buildAuthResult(user);
  },

  /**
   * Get current user by ID.
   */
  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiErrorClass(404, 'User not found', 'UserNotFound');
    }

    return toUserResponse(user);
  },

  /**
   * Refresh access token using a valid refresh token.
   */
  async refreshToken(refreshTokenString: string): Promise<AuthResult> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshTokenString);
    } catch {
      throw new ApiErrorClass(401, 'Invalid or expired refresh token', 'InvalidRefreshToken');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      throw new ApiErrorClass(401, 'User not found or inactive', 'InvalidRefreshToken');
    }

    return buildAuthResult(user);
  },

  /**
   * Find user by email (used for forgot-password flow).
   */
  async findUserByEmail(email: string): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return user ? toUserResponse(user) : null;
  },

  /**
   * Reset a proprietor password using a previously-issued verification code.
   * Verifies the code, ensures the email belongs to a proprietor, and only then
   * hashes and stores the new password.
   */
  async resetPasswordByEmail(input: ResetPasswordInput): Promise<void> {
    await verificationCodeService.verifyCode({
      email: input.email,
      code: input.code,
      purpose: VerificationPurpose.FORGOT_PASSWORD,
    });

    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new ApiErrorClass(404, 'No account found with that email.', 'UserNotFound');
    }

    if (user.role !== UserRole.PROPRIETOR) {
      throw new ApiErrorClass(
        403,
        'Only proprietor accounts can be recovered from this page.',
        'NotProprietor'
      );
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, BCRYPT_COST);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
  },

  /**
   * Check if any proprietor account exists.
   * Used by the signup page to lock it once a proprietor is created.
   */
  async hasProprietor(): Promise<boolean> {
    const count = await prisma.user.count({
      where: { role: UserRole.PROPRIETOR },
    });
    return count > 0;
  },

  /**
   * Authenticated self-service password change. Verifies the current
   * password, hashes and stores the new one, audit-logs the change, and
   * drops a notification on the user's bell inbox. Inactive users cannot
   * change their own password.
   */
  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiErrorClass(404, 'User not found', 'UserNotFound');
    }
    if (!user.isActive) {
      throw new ApiErrorClass(403, 'Account is deactivated', 'AccountDeactivated');
    }

    const ok = await bcrypt.compare(input.currentPassword, user.password);
    if (!ok) {
      throw new ApiErrorClass(401, 'Current password is incorrect', 'InvalidCurrentPassword');
    }

    // Defensive: don't allow setting the same password.
    const sameAsBefore = await bcrypt.compare(input.newPassword, user.password);
    if (sameAsBefore) {
      throw new ApiErrorClass(
        400,
        'New password must be different from the current password.',
        'PasswordUnchanged'
      );
    }

    const hashed = await bcrypt.hash(input.newPassword, BCRYPT_COST);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    // Best-effort audit + notification. Failures are logged but never break
    // the request (matches the pattern used elsewhere).
    try {
      await auditLogService.log({
        userId: user.id,
        userEmail: user.email,
        action: 'PASSWORD_CHANGED',
        entityType: 'User',
        entityId: user.id,
        payload: { selfService: true },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[auth.changePassword] audit log failed:', err);
    }
    try {
      await notificationService.push({
        userId: user.id,
        title: 'Password changed',
        body: 'Your password was changed successfully. If this was not you, contact the proprietor immediately.',
        link: '/settings',
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[auth.changePassword] notification failed:', err);
    }
  },
};
