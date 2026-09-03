import { Enrollment, Prisma, EnrollmentStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiErrorClass } from '../utils/response';
import type {
  CreateEnrollmentInput,
  UpdateEnrollmentInput,
} from '../validators/enrollment.validator';

export interface EnrollmentResponse {
  id: string;
  studentId: string;
  classId: string;
  sessionId: string;
  status: EnrollmentStatus;
  enrollmentDate: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    studentNumber: string;
  };
  class?: {
    id: string;
    name: string;
    code: string;
  };
  session?: {
    id: string;
    name: string;
  };
}

type EnrollmentWithRelations = Enrollment & {
  student?: { id: string; firstName: string; lastName: string; studentNumber: string } | null;
  class?: { id: string; name: string; code: string } | null;
  session?: { id: string; name: string } | null;
};

function toEnrollmentResponse(enrollment: EnrollmentWithRelations): EnrollmentResponse {
  return {
    id: enrollment.id,
    studentId: enrollment.studentId,
    classId: enrollment.classId,
    sessionId: enrollment.sessionId,
    status: enrollment.status,
    enrollmentDate: enrollment.enrollmentDate.toISOString().split('T')[0],
    createdAt: enrollment.createdAt.toISOString(),
    updatedAt: enrollment.updatedAt.toISOString(),
    ...(enrollment.student && {
      student: {
        id: enrollment.student.id,
        firstName: enrollment.student.firstName,
        lastName: enrollment.student.lastName,
        studentNumber: enrollment.student.studentNumber,
      },
    }),
    ...(enrollment.class && {
      class: {
        id: enrollment.class.id,
        name: enrollment.class.name,
        code: enrollment.class.code,
      },
    }),
    ...(enrollment.session && {
      session: {
        id: enrollment.session.id,
        name: enrollment.session.name,
      },
    }),
  };
}

export const enrollmentService = {
  /**
   * List enrollments. Supports filtering by sessionId, classId, studentId,
   * and status. Includes the related student, class, and session summaries.
   */
  async getEnrollments(filters: {
    sessionId?: string;
    classId?: string;
    studentId?: string;
    status?: EnrollmentStatus;
  }): Promise<EnrollmentResponse[]> {
    const where: Prisma.EnrollmentWhereInput = {};
    if (filters.sessionId) where.sessionId = filters.sessionId;
    if (filters.classId) where.classId = filters.classId;
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.status) where.status = filters.status;

    const enrollments = await prisma.enrollment.findMany({
      where,
      orderBy: [{ sessionId: 'asc' }, { classId: 'asc' }, { enrollmentDate: 'asc' }],
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        class: { select: { id: true, name: true, code: true } },
        session: { select: { id: true, name: true } },
      },
    });
    return enrollments.map(toEnrollmentResponse);
  },

  /**
   * Get a single enrollment by ID.
   */
  async getEnrollmentById(id: string): Promise<EnrollmentResponse> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        class: { select: { id: true, name: true, code: true } },
        session: { select: { id: true, name: true } },
      },
    });
    if (!enrollment) {
      throw new ApiErrorClass(404, 'Enrollment not found', 'EnrollmentNotFound');
    }
    return toEnrollmentResponse(enrollment);
  },

  /**
   * Create a new enrollment. Enforces:
   *  - student/class/session must exist
   *  - the (studentId, classId, sessionId) tuple must be unique
   *  - if the student has an ACTIVE enrollment in this session, a 409 is
   *    returned (a student can only be actively enrolled in one class per
   *    academic year). To switch class, deactivate the previous enrollment.
   */
  async createEnrollment(input: CreateEnrollmentInput): Promise<EnrollmentResponse> {
    // Validate foreign keys up-front for clearer error messages
    const [student, cls, session] = await Promise.all([
      prisma.student.findUnique({ where: { id: input.studentId } }),
      prisma.class.findUnique({ where: { id: input.classId } }),
      prisma.academicSession.findUnique({ where: { id: input.sessionId } }),
    ]);
    if (!student) {
      throw new ApiErrorClass(404, 'Student not found', 'StudentNotFound');
    }
    if (!cls) {
      throw new ApiErrorClass(404, 'Class not found', 'ClassNotFound');
    }
    if (!session) {
      throw new ApiErrorClass(404, 'Academic session not found', 'SessionNotFound');
    }

    // If a non-ACTIVE enrollment already exists with the same triple, we
    // either re-activate it (if input status is ACTIVE) or block duplicates.
    if (input.status === 'ACTIVE') {
      const existingActive = await prisma.enrollment.findFirst({
        where: {
          studentId: input.studentId,
          sessionId: input.sessionId,
          status: 'ACTIVE',
        },
      });
      if (existingActive) {
        throw new ApiErrorClass(
          409,
          'Student is already actively enrolled in a class in this academic year',
          'StudentAlreadyEnrolled'
        );
      }
    }

    try {
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: input.studentId,
          classId: input.classId,
          sessionId: input.sessionId,
          status: input.status,
          enrollmentDate: input.enrollmentDate ? new Date(input.enrollmentDate) : new Date(),
        },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
          class: { select: { id: true, name: true, code: true } },
          session: { select: { id: true, name: true } },
        },
      });
      return toEnrollmentResponse(enrollment);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApiErrorClass(
          409,
          'An enrollment with this student/class/session already exists',
          'EnrollmentDuplicate'
        );
      }
      throw error;
    }
  },

  /**
   * Update an enrollment's class and/or status. If a class change would
   * leave the student with two ACTIVE enrollments in the same session, the
   * move is rejected.
   */
  async updateEnrollment(id: string, input: UpdateEnrollmentInput): Promise<EnrollmentResponse> {
    const existing = await prisma.enrollment.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Enrollment not found', 'EnrollmentNotFound');
    }

    if (input.classId && input.classId !== existing.classId) {
      const cls = await prisma.class.findUnique({ where: { id: input.classId } });
      if (!cls) {
        throw new ApiErrorClass(404, 'Class not found', 'ClassNotFound');
      }
    }

    // If the new status is ACTIVE, make sure no other ACTIVE enrollment
    // exists for the same student/session.
    if (input.status === 'ACTIVE' && existing.status !== 'ACTIVE') {
      const conflict = await prisma.enrollment.findFirst({
        where: {
          studentId: existing.studentId,
          sessionId: existing.sessionId,
          status: 'ACTIVE',
          NOT: { id: existing.id },
        },
      });
      if (conflict) {
        throw new ApiErrorClass(
          409,
          'Student is already actively enrolled in another class in this academic year',
          'StudentAlreadyEnrolled'
        );
      }
    }

    const data: Prisma.EnrollmentUpdateInput = {};
    if (input.classId !== undefined) data.class = { connect: { id: input.classId } };
    if (input.status !== undefined) data.status = input.status;
    if (input.enrollmentDate !== undefined) {
      data.enrollmentDate = new Date(input.enrollmentDate);
    }

    try {
      const updated = await prisma.enrollment.update({
        where: { id },
        data,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
          class: { select: { id: true, name: true, code: true } },
          session: { select: { id: true, name: true } },
        },
      });
      return toEnrollmentResponse(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApiErrorClass(
          409,
          'An enrollment with this student/class/session already exists',
          'EnrollmentDuplicate'
        );
      }
      throw error;
    }
  },

  /**
   * Convenience: soft-remove an enrollment by setting its status to
   * WITHDRAWN. The row is preserved for historical accuracy.
   */
  async withdrawEnrollment(id: string): Promise<EnrollmentResponse> {
    return this.updateEnrollment(id, { status: 'WITHDRAWN' });
  },

  /**
   * Convenience: remove a student from a session entirely. If the student
   * has multiple enrollments in the session (e.g. moved class), this sets
   * all of them to WITHDRAWN. Returns the count withdrawn.
   */
  async removeStudentFromSession(
    studentId: string,
    sessionId: string
  ): Promise<{ withdrawn: number }> {
    const result = await prisma.enrollment.updateMany({
      where: { studentId, sessionId, status: { not: 'WITHDRAWN' } },
      data: { status: 'WITHDRAWN' },
    });
    if (result.count === 0) {
      throw new ApiErrorClass(
        404,
        'No active enrollment found for this student in the given session',
        'EnrollmentNotFound'
      );
    }
    return { withdrawn: result.count };
  },

  /**
   * Hard delete an enrollment row. Refuses if the student has results
   * linked to it (those would be silently lost). Use withdrawEnrollment
   * for soft-removal.
   */
  async deleteEnrollment(id: string): Promise<void> {
    const existing = await prisma.enrollment.findUnique({
      where: { id },
      include: { _count: { select: { results: true } } },
    });
    if (!existing) {
      throw new ApiErrorClass(404, 'Enrollment not found', 'EnrollmentNotFound');
    }
    if (existing._count.results > 0) {
      throw new ApiErrorClass(
        400,
        `Cannot delete an enrollment with ${existing._count.results} result(s). Withdraw it instead to preserve history.`,
        'EnrollmentInUse'
      );
    }
    await prisma.enrollment.delete({ where: { id } });
  },
};
