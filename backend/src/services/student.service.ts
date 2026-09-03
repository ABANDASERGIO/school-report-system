import { Student, Prisma, Gender } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiErrorClass } from '../utils/response';
import { cloudinaryService } from './cloudinary.service';
import type { CreateStudentInput, UpdateStudentInput } from '../validators/student.validator';

export interface StudentResponse {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: Gender;
  address: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  studentNumber: string;
  photoUrl: string;
  photoPublicId: string;
  createdAt: string;
  updatedAt: string;
}

function toStudentResponse(student: Student): StudentResponse {
  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    dateOfBirth: student.dateOfBirth.toISOString().split('T')[0],
    placeOfBirth: student.placeOfBirth ?? '',
    gender: student.gender,
    address: student.address ?? '',
    phone: student.phone ?? '',
    parentName: student.parentName ?? '',
    parentPhone: student.parentPhone ?? '',
    studentNumber: student.studentNumber,
    photoUrl: student.photoUrl ?? '',
    photoPublicId: student.photoPublicId ?? '',
    createdAt: student.createdAt.toISOString(),
    updatedAt: student.updatedAt.toISOString(),
  };
}

/**
 * Generate the next student number in a given year. Format: STU-YYYY-NNNN
 * where NNNN is the next 4-digit counter within that calendar year.
 * Falls back to 0001 if no students exist for the year.
 */
async function generateStudentNumber(year: number, tx: Prisma.TransactionClient | typeof prisma = prisma): Promise<string> {
  const prefix = `STU-${year}-`;
  // Find the highest existing number for this year. Use a count + filter
  // because the format is fixed-width.
  const last = await tx.student.findFirst({
    where: { studentNumber: { startsWith: prefix } },
    orderBy: { studentNumber: 'desc' },
    select: { studentNumber: true },
  });
  let nextSeq = 1;
  if (last) {
    const tail = last.studentNumber.slice(prefix.length);
    const parsed = parseInt(tail, 10);
    if (!isNaN(parsed)) nextSeq = parsed + 1;
  }
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

export const studentService = {
  /**
   * List all students, ordered by name.
   */
  async getStudents(): Promise<StudentResponse[]> {
    const students = await prisma.student.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    return students.map(toStudentResponse);
  },

  /**
   * Get a single student by ID.
   */
  async getStudentById(id: string): Promise<StudentResponse> {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new ApiErrorClass(404, 'Student not found', 'StudentNotFound');
    }
    return toStudentResponse(student);
  },

  /**
   * Create a new student. Auto-generates a unique student number scoped
   * to the current calendar year. If `enrollment` is provided, also
   * creates an ACTIVE enrollment in a single transaction.
   */
  async createStudent(input: CreateStudentInput): Promise<StudentResponse> {
    const year = new Date().getFullYear();
    const result = await prisma.$transaction(async (tx) => {
      const studentNumber = await generateStudentNumber(year, tx);

      const student = await tx.student.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : new Date('1970-01-01'),
          placeOfBirth: input.placeOfBirth || 'Unknown',
          gender: input.gender,
          address: input.address || null,
          phone: input.phone || null,
          parentName: input.parentName || null,
          parentPhone: input.parentPhone || null,
          photoUrl: input.photoUrl || null,
          photoPublicId: input.photoPublicId || null,
          studentNumber,
        },
      });

      if (input.enrollment) {
        // Validate the foreign keys before inserting
        const [cls, session] = await Promise.all([
          tx.class.findUnique({ where: { id: input.enrollment.classId } }),
          tx.academicSession.findUnique({ where: { id: input.enrollment.sessionId } }),
        ]);
        if (!cls) {
          throw new ApiErrorClass(404, 'Class not found', 'ClassNotFound');
        }
        if (!session) {
          throw new ApiErrorClass(404, 'Academic session not found', 'SessionNotFound');
        }

        // Block if the student already has an ACTIVE enrollment in this session
        const conflict = await tx.enrollment.findFirst({
          where: {
            studentId: student.id,
            sessionId: input.enrollment.sessionId,
            status: 'ACTIVE',
          },
        });
        if (conflict) {
          throw new ApiErrorClass(
            409,
            'Student is already actively enrolled in a class in this academic year',
            'StudentAlreadyEnrolled'
          );
        }

        await tx.enrollment.create({
          data: {
            studentId: student.id,
            classId: input.enrollment.classId,
            sessionId: input.enrollment.sessionId,
            status: 'ACTIVE',
          },
        });
      }

      return student;
    });

    return toStudentResponse(result);
  },

  /**
   * Update a student's profile. The student number is immutable.
   */
  async updateStudent(id: string, input: UpdateStudentInput): Promise<StudentResponse> {
    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Student not found', 'StudentNotFound');
    }

    // Detect photo replacement/clearing so we can free the old Cloudinary asset.
    const photoReplaced =
      input.photoPublicId !== undefined &&
      input.photoPublicId !== existing.photoPublicId;
    const photoCleared =
      (input.photoUrl !== undefined && (input.photoUrl === null || input.photoUrl === '')) ||
      (input.photoPublicId !== undefined && (input.photoPublicId === null || input.photoPublicId === ''));
    const oldPhotoPublicId = existing.photoPublicId;
    const shouldDeleteOldPhoto =
      (photoReplaced || photoCleared) && Boolean(oldPhotoPublicId);

    const data: Prisma.StudentUpdateInput = {};
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.dateOfBirth !== undefined && input.dateOfBirth !== '') {
      data.dateOfBirth = new Date(input.dateOfBirth);
    }
    if (input.placeOfBirth !== undefined) data.placeOfBirth = input.placeOfBirth || 'Unknown';
    if (input.gender !== undefined) data.gender = input.gender;
    if (input.address !== undefined) data.address = input.address || null;
    if (input.phone !== undefined) data.phone = input.phone || null;
    if (input.parentName !== undefined) data.parentName = input.parentName || null;
    if (input.parentPhone !== undefined) data.parentPhone = input.parentPhone || null;
    if (input.photoUrl !== undefined) data.photoUrl = input.photoUrl || null;
    if (input.photoPublicId !== undefined) data.photoPublicId = input.photoPublicId || null;
    // studentNumber is intentionally not updatable here; it is immutable.

    try {
      const updated = await prisma.student.update({ where: { id }, data });

      if (shouldDeleteOldPhoto) {
        // Best-effort cleanup so deleted photos don't linger in Cloudinary.
        try {
          await cloudinaryService.deleteImage(oldPhotoPublicId);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[student.updateStudent] Failed to delete old photo:', err);
        }
      }

      return toStudentResponse(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ApiErrorClass(404, 'Student not found', 'StudentNotFound');
      }
      throw error;
    }
  },

  /**
   * Soft-delete: withdraws all of the student's enrollments and marks the
   * student as inactive. We do not have an `isActive` column on Student,
   * so we implement soft-delete by withdrawing every ACTIVE enrollment.
   * The Student row is preserved for historical accuracy (results, etc).
   *
   * If the student has NO enrollments at all, the row is hard-deleted.
   */
  async deleteStudent(id: string): Promise<void> {
    const existing = await prisma.student.findUnique({
      where: { id },
      include: { _count: { select: { enrollments: true, results: true } } },
    });
    if (!existing) {
      throw new ApiErrorClass(404, 'Student not found', 'StudentNotFound');
    }

    await prisma.$transaction([
      prisma.enrollment.updateMany({
        where: { studentId: id, status: { not: 'WITHDRAWN' } },
        data: { status: 'WITHDRAWN' },
      }),
    ]);

    if (existing._count.enrollments === 0) {
      // No history to preserve; safe to hard-delete
      await prisma.student.delete({ where: { id } });
    }
  },

  /**
   * Search students by name, student number, parent name, or phone.
   * Case-insensitive.
   */
  async searchStudents(query: string): Promise<StudentResponse[]> {
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { studentNumber: { contains: query, mode: 'insensitive' } },
          { parentName: { contains: query, mode: 'insensitive' } },
          { parentPhone: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    return students.map(toStudentResponse);
  },
};
