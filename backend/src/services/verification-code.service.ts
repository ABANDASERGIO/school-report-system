import { VerificationPurpose } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiErrorClass } from '../utils/response';
import { mailService, buildBrandedHtml } from './mail.service';
import { APP_NAME } from '../config/constants';

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 15;

export interface RequestCodeInput {
  email: string;
  purpose: VerificationPurpose;
  // Optional payload to store alongside the code (e.g. { newEmail } for EMAIL_CHANGE).
  metadata?: Record<string, unknown>;
  // The user account that initiated the request, if known. When provided, we
  // verify the email matches the user's email or (for EMAIL_CHANGE) the metadata.newEmail.
  userId?: string;
}

export interface VerifyCodeInput {
  email: string;
  code: string;
  purpose: VerificationPurpose;
}

function generateCode(): string {
  // 6-digit numeric code (000000–999999), left-padded with zeros.
  const n = Math.floor(Math.random() * 1_000_000);
  return n.toString().padStart(CODE_LENGTH, '0');
}

function buildEmail(purpose: VerificationPurpose, code: string, minutes: number): {
  subject: string;
  text: string;
  html: string;
} {
  const expiry = `${minutes} minutes`;
  const safeCode = code.replace(/[<>&"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : '&quot;'
  );

  let subject = '';
  let heading = '';
  let body = '';
  let preheader = '';

  switch (purpose) {
    case VerificationPurpose.FORGOT_PASSWORD:
    case VerificationPurpose.RESET_PASSWORD:
      subject = `Your ${APP_NAME} password reset code`;
      heading = 'Reset your password';
      preheader = `Your ${APP_NAME} verification code is ${code}.`;
      body = `
        <p style="margin:0 0 16px 0;">You requested to reset your <strong>${APP_NAME}</strong> password.</p>
        <p style="margin:0 0 8px 0;">Use the verification code below to continue. The code expires in <strong>${expiry}</strong>.</p>
        <div style="margin:24px 0;padding:16px 24px;text-align:center;background-color:#f1f5f9;border-radius:10px;border:1px dashed #cbd5e1;">
          <span style="display:inline-block;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:28px;letter-spacing:6px;color:#0f172a;font-weight:700;">${safeCode}</span>
        </div>
        <p style="margin:0 0 8px 0;color:#475569;">If you did not request this, you can safely ignore this email. Your password will remain unchanged.</p>
      `;
      break;
    case VerificationPurpose.EMAIL_CHANGE:
      subject = `Confirm your new email address`;
      heading = 'Confirm your email change';
      preheader = `Your ${APP_NAME} email-change code is ${code}.`;
      body = `
        <p style="margin:0 0 16px 0;">Use the code below to confirm your new email address on <strong>${APP_NAME}</strong>.</p>
        <div style="margin:24px 0;padding:16px 24px;text-align:center;background-color:#f1f5f9;border-radius:10px;border:1px dashed #cbd5e1;">
          <span style="display:inline-block;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:28px;letter-spacing:6px;color:#0f172a;font-weight:700;">${safeCode}</span>
        </div>
        <p style="margin:0;color:#475569;">This code expires in <strong>${expiry}</strong>.</p>
      `;
      break;
    case VerificationPurpose.WELCOME:
      subject = `Welcome to ${APP_NAME}`;
      heading = `Welcome to ${APP_NAME}`;
      preheader = `Your account has been created. Verification code: ${code}.`;
      body = `
        <p style="margin:0 0 16px 0;">Your <strong>${APP_NAME}</strong> account has been created.</p>
        <p style="margin:0 0 8px 0;">Here's your verification code:</p>
        <div style="margin:24px 0;padding:16px 24px;text-align:center;background-color:#f1f5f9;border-radius:10px;border:1px dashed #cbd5e1;">
          <span style="display:inline-block;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:28px;letter-spacing:6px;color:#0f172a;font-weight:700;">${safeCode}</span>
        </div>
        <p style="margin:0;color:#475569;">This code expires in <strong>${expiry}</strong>.</p>
      `;
      break;
    default:
      subject = `Your ${APP_NAME} verification code`;
      heading = 'Your verification code';
      preheader = `Your ${APP_NAME} verification code is ${code}.`;
      body = `
        <p style="margin:0 0 16px 0;">Your verification code is below. It expires in <strong>${expiry}</strong>.</p>
        <div style="margin:24px 0;padding:16px 24px;text-align:center;background-color:#f1f5f9;border-radius:10px;border:1px dashed #cbd5e1;">
          <span style="display:inline-block;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:28px;letter-spacing:6px;color:#0f172a;font-weight:700;">${safeCode}</span>
        </div>
      `;
  }

  // Plain-text fallback for clients that don't render HTML. Mirrors the
  // essential content of the HTML body so the message is still usable.
  const text = body
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const html = buildBrandedHtml({
    preheader,
    heading,
    bodyHtml: body,
    footerNote: `You received this email because someone used this address on ${APP_NAME}. If this wasn't you, you can ignore this email.`,
  });

  return { subject, text, html };
}

export const verificationCodeService = {
  /**
   * Issue a new 6-digit code for the given email + purpose.
   * Any previous unused codes for the same email+purpose are invalidated.
   * Sends the code via mailService. Returns the issued code only in dev mode
   * (so local testing does not require a real inbox).
   */
  async requestCode(input: RequestCodeInput): Promise<{ sent: boolean; devCode?: string }> {
    const email = input.email.toLowerCase().trim();
    if (!email) {
      throw new ApiErrorClass(400, 'Email is required', 'EmailRequired');
    }

    // Invalidate any prior unused codes for the same email+purpose.
    await prisma.verificationCode.updateMany({
      where: {
        email,
        purpose: input.purpose,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

    await prisma.verificationCode.create({
      data: {
        email,
        code,
        purpose: input.purpose,
        userId: input.userId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        expiresAt,
      },
    });

    const { subject, text, html } = buildEmail(input.purpose, code, CODE_TTL_MINUTES);
    const sent = await mailService.send({ to: email, subject, text, html });

    return {
      sent,
      // Surface the code in dev so the flow is testable without a mail server.
      devCode: env_isDev() ? code : undefined,
    };
  },

  /**
   * Verify a code for an email+purpose. Marks the code as used on success.
   * Throws ApiErrorClass on invalid/expired/used codes.
   * Returns the matched record (without the code) on success.
   */
  async verifyCode(input: VerifyCodeInput): Promise<{
    id: string;
    userId: string | null;
    email: string;
    purpose: VerificationPurpose;
    metadata: Record<string, unknown> | null;
  }> {
    const email = input.email.toLowerCase().trim();
    const code = input.code.trim();

    const record = await prisma.verificationCode.findFirst({
      where: {
        email,
        purpose: input.purpose,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new ApiErrorClass(400, 'No active verification code for this email and purpose.', 'CodeNotFound');
    }

    if (record.expiresAt < new Date()) {
      throw new ApiErrorClass(400, 'Verification code has expired. Please request a new one.', 'CodeExpired');
    }

    if (record.code !== code) {
      throw new ApiErrorClass(400, 'Invalid verification code.', 'CodeInvalid');
    }

    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return {
      id: record.id,
      userId: record.userId,
      email: record.email,
      purpose: record.purpose,
      metadata: record.metadata ? JSON.parse(record.metadata) : null,
    };
  },
};

function env_isDev(): boolean {
  return process.env.NODE_ENV !== 'production';
}
