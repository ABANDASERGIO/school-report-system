import bcrypt from 'bcryptjs';
import { Teacher, UserRole, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiErrorClass } from '../utils/response';
import { mailService, buildBrandedHtml } from './mail.service';
import { APP_NAME } from '../config/constants';
import { cloudinaryService } from './cloudinary.service';
import type {
  CreateTeacherInput,
  UpdateTeacherInput,
} from '../validators/teacher.validator';

const BCRYPT_COST = 12;

// Shape returned to the frontend. Matches the frontend Teacher model.
export interface TeacherResponse {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  photoUrl: string;
  photoPublicId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  };
}

function toTeacherResponse(teacher: Teacher & { user?: { id: string; email: string; role: UserRole; isActive: boolean } | null }): TeacherResponse {
  return {
    id: teacher.id,
    userId: teacher.userId,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    email: teacher.email,
    phone: teacher.phone ?? '',
    address: teacher.address ?? '',
    photoUrl: teacher.photoUrl ?? '',
    photoPublicId: teacher.photoPublicId ?? '',
    isActive: teacher.isActive,
    createdAt: teacher.createdAt.toISOString(),
    updatedAt: teacher.updatedAt.toISOString(),
    ...(teacher.user && {
      user: {
        id: teacher.user.id,
        email: teacher.user.email,
        role: teacher.user.role,
        isActive: teacher.user.isActive,
      },
    }),
  };
}

export const teacherService = {
  /**
   * List all teachers. Soft-deleted (suspended) teachers are included.
   */
  async getTeachers(): Promise<TeacherResponse[]> {
    const teachers = await prisma.teacher.findMany({
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      include: { user: true },
    });
    return teachers.map(toTeacherResponse);
  },

  /**
   * Get a single teacher by id.
   */
  async getTeacherById(id: string): Promise<TeacherResponse> {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!teacher) {
      throw new ApiErrorClass(404, 'Teacher not found', 'TeacherNotFound');
    }
    return toTeacherResponse(teacher);
  },

  /**
   * Get the teacher record linked to a User (used after login).
   */
  async getTeacherByUserId(userId: string): Promise<TeacherResponse | null> {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: { user: true },
    });
    return teacher ? toTeacherResponse(teacher) : null;
  },

  /**
   * Create a new teacher. Creates both a User (TEACHER role) and a Teacher
   * record in a transaction.
   */
  async createTeacher(input: CreateTeacherInput): Promise<TeacherResponse> {
    const normalizedEmail = input.email.toLowerCase();

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new ApiErrorClass(409, 'A user with this email already exists', 'EmailTaken');
    }

    const hashedPassword = await bcrypt.hash(input.password, BCRYPT_COST);

    try {
      const teacher = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            role: UserRole.TEACHER,
            isActive: true,
          },
        });

        // Create teacher profile
        const newTeacher = await tx.teacher.create({
          data: {
            userId: user.id,
            firstName: input.firstName,
            lastName: input.lastName,
            email: normalizedEmail,
            phone: input.phone || null,
            address: input.address || null,
            photoUrl: input.photoUrl || null,
            photoPublicId: input.photoPublicId || null,
            isActive: true,
          },
        });

        return { ...newTeacher, user };
      });

      return toTeacherResponse(teacher);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApiErrorClass(409, 'A user with this email already exists', 'EmailTaken');
      }
      throw error;
    }
  },

  /**
   * Update a teacher profile. Email updates update both User and Teacher.
   */
  async updateTeacher(id: string, input: UpdateTeacherInput): Promise<TeacherResponse> {
    const existing = await prisma.teacher.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new ApiErrorClass(404, 'Teacher not found', 'TeacherNotFound');
    }

    // If email is changing, ensure the new email is not already in use
    if (input.email && input.email.toLowerCase() !== existing.email) {
      const normalizedEmail = input.email.toLowerCase();
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingUser && existingUser.id !== existing.userId) {
        throw new ApiErrorClass(409, 'A user with this email already exists', 'EmailTaken');
      }
    }

    // Detect photo replacement so we can free the old Cloudinary asset.
    const photoReplaced =
      input.photoPublicId !== undefined &&
      input.photoPublicId !== existing.photoPublicId;
    const photoCleared =
      (input.photoUrl !== undefined && (input.photoUrl === null || input.photoUrl === '')) ||
      (input.photoPublicId !== undefined && (input.photoPublicId === null || input.photoPublicId === ''));
    const oldPhotoPublicId = existing.photoPublicId;
    const shouldDeleteOldPhoto =
      (photoReplaced || photoCleared) && Boolean(oldPhotoPublicId);

    try {
      const teacher = await prisma.$transaction(async (tx) => {
        const data: Prisma.TeacherUpdateInput = {};
        if (input.firstName !== undefined) data.firstName = input.firstName;
        if (input.lastName !== undefined) data.lastName = input.lastName;
        if (input.phone !== undefined) data.phone = input.phone || null;
        if (input.address !== undefined) data.address = input.address || null;
        if (input.photoUrl !== undefined) data.photoUrl = input.photoUrl || null;
        if (input.photoPublicId !== undefined) data.photoPublicId = input.photoPublicId || null;
        if (input.isActive !== undefined) data.isActive = input.isActive;

        if (input.email !== undefined) {
          const normalizedEmail = input.email.toLowerCase();
          data.email = normalizedEmail;
          // Sync the email on the linked user
          await tx.user.update({
            where: { id: existing.userId },
            data: { email: normalizedEmail },
          });
        }

        const updated = await tx.teacher.update({
          where: { id },
          data,
          include: { user: true },
        });
        return updated;
      });

      if (shouldDeleteOldPhoto) {
        // Best-effort cleanup so deleted photos don't linger in Cloudinary.
        // Failures are logged but do not fail the request.
        try {
          await cloudinaryService.deleteImage(oldPhotoPublicId);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[teacher.updateTeacher] Failed to delete old photo:', err);
        }
      }

      return toTeacherResponse(teacher);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ApiErrorClass(404, 'Teacher not found', 'TeacherNotFound');
      }
      throw error;
    }
  },

  /**
   * Suspend a teacher (soft-delete). Sets isActive = false on both
   * User and Teacher.
   */
  async suspendTeacher(id: string): Promise<TeacherResponse> {
    const existing = await prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Teacher not found', 'TeacherNotFound');
    }

    const teacher = await prisma.$transaction(async (tx) => {
      const updated = await tx.teacher.update({
        where: { id },
        data: { isActive: false },
        include: { user: true },
      });
      await tx.user.update({
        where: { id: existing.userId },
        data: { isActive: false },
      });
      return updated;
    });

    return toTeacherResponse(teacher);
  },

  /**
   * Reactivate a suspended teacher.
   */
  async activateTeacher(id: string): Promise<TeacherResponse> {
    const existing = await prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Teacher not found', 'TeacherNotFound');
    }

    const teacher = await prisma.$transaction(async (tx) => {
      const updated = await tx.teacher.update({
        where: { id },
        data: { isActive: true },
        include: { user: true },
      });
      await tx.user.update({
        where: { id: existing.userId },
        data: { isActive: true },
      });
      return updated;
    });

    return toTeacherResponse(teacher);
  },

  /**
   * Reset a teacher's password. If newPassword is not provided, generate one.
   * Returns the new password so the proprietor can share it. Also emails the
   * new credentials to the teacher (via mailService, dev fallback to console).
   */
  async resetPassword(id: string, newPassword?: string): Promise<{ newPassword: string }> {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!teacher) {
      throw new ApiErrorClass(404, 'Teacher not found', 'TeacherNotFound');
    }

    const generatedPassword =
      newPassword && newPassword.length >= 6
        ? newPassword
        : Math.random().toString(36).slice(-8);

    const hashed = await bcrypt.hash(generatedPassword, BCRYPT_COST);

    await prisma.user.update({
      where: { id: teacher.userId },
      data: { password: hashed },
    });

    // Best-effort: notify the teacher of the new password. Failures are
    // non-fatal so the proprietor still receives the value to share.
    try {
      const html = buildBrandedHtml({
        preheader: `Your ${APP_NAME} password has been reset. New password: ${generatedPassword}`,
        heading: 'Your password was reset',
        bodyHtml: `
          <p style="margin:0 0 16px 0;">Hello <strong>${teacher.firstName}</strong>,</p>
          <p style="margin:0 0 16px 0;">Your <strong>${APP_NAME}</strong> account password has been reset by the school administrator.</p>
          <p style="margin:0 0 8px 0;">Your new password is:</p>
          <div style="margin:16px 0 24px 0;padding:16px 24px;text-align:center;background-color:#f1f5f9;border-radius:10px;border:1px dashed #cbd5e1;">
            <span style="display:inline-block;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:18px;letter-spacing:1px;color:#0f172a;font-weight:700;">${generatedPassword}</span>
          </div>
          <p style="margin:0;color:#475569;">Please sign in and change it as soon as possible.</p>
        `,
        footerNote: `If you did not expect this email, contact the school administrator immediately.`,
      });
      const text =
        `Hello ${teacher.firstName},\n\n` +
        `Your ${APP_NAME} account password has been reset by the school administrator.\n\n` +
        `New password: ${generatedPassword}\n\n` +
        `Please sign in and change it as soon as possible.`;
      await mailService.send({
        to: teacher.email,
        subject: `Your ${APP_NAME} password has been reset`,
        text,
        html,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[teacher.resetPassword] Failed to email new password:', err);
    }

    return { newPassword: generatedPassword };
  },

  /**
   * Search teachers by name, email, or address.
   */
  async searchTeachers(query: string): Promise<TeacherResponse[]> {
    const teachers = await prisma.teacher.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      include: { user: true },
    });
    return teachers.map(toTeacherResponse);
  },
};
