import { Assignment, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiErrorClass } from '../utils/response';
import type {
  CreateAssignmentInput,
  UpdateAssignmentInput,
  BulkCreateAssignmentsInput,
} from '../validators/assignment.validator';

export interface AssignmentResponse {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  sessionId: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  class?: {
    id: string;
    name: string;
    code: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
    coefficient: number;
  };
  session?: {
    id: string;
    name: string;
  };
}

type AssignmentWithRelations = Assignment & {
  teacher?: { id: string; firstName: string; lastName: string; email: string } | null;
  class?: { id: string; name: string; code: string } | null;
  subject?: { id: string; name: string; code: string; coefficient: number } | null;
  session?: { id: string; name: string } | null;
};

function toAssignmentResponse(a: AssignmentWithRelations): AssignmentResponse {
  return {
    id: a.id,
    teacherId: a.teacherId,
    classId: a.classId,
    subjectId: a.subjectId,
    sessionId: a.sessionId,
    ...(a.teacher && {
      teacher: {
        id: a.teacher.id,
        firstName: a.teacher.firstName,
        lastName: a.teacher.lastName,
        email: a.teacher.email,
      },
    }),
    ...(a.class && {
      class: { id: a.class.id, name: a.class.name, code: a.class.code },
    }),
    ...(a.subject && {
      subject: {
        id: a.subject.id,
        name: a.subject.name,
        code: a.subject.code,
        coefficient: a.subject.coefficient,
      },
    }),
    ...(a.session && {
      session: { id: a.session.id, name: a.session.name },
    }),
  };
}

const relationInclude = {
  teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
  class: { select: { id: true, name: true, code: true } },
  subject: { select: { id: true, name: true, code: true, coefficient: true } },
  session: { select: { id: true, name: true } },
} as const;

export const assignmentService = {
  /**
   * List assignments with optional filters by teacher, class, subject, or
   * session. Returns the related entities inline so the UI can render
   * names without extra lookups.
   */
  async getAssignments(filters: {
    teacherId?: string;
    classId?: string;
    subjectId?: string;
    sessionId?: string;
  }): Promise<AssignmentResponse[]> {
    const where: Prisma.AssignmentWhereInput = {};
    if (filters.teacherId) where.teacherId = filters.teacherId;
    if (filters.classId) where.classId = filters.classId;
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.sessionId) where.sessionId = filters.sessionId;

    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: [
        { sessionId: 'asc' },
        { teacherId: 'asc' },
        { classId: 'asc' },
        { subjectId: 'asc' },
      ],
      include: relationInclude,
    });
    return assignments.map(toAssignmentResponse);
  },

  /**
   * Get a single assignment by ID.
   */
  async getAssignmentById(id: string): Promise<AssignmentResponse> {
    const a = await prisma.assignment.findUnique({
      where: { id },
      include: relationInclude,
    });
    if (!a) {
      throw new ApiErrorClass(404, 'Assignment not found', 'AssignmentNotFound');
    }
    return toAssignmentResponse(a);
  },

  /**
   * Convenience: assignments for a single teacher (any session). Used by
   * the teacher dashboard and the "my assignments" view.
   */
  async getAssignmentsByTeacher(teacherId: string): Promise<AssignmentResponse[]> {
    return this.getAssignments({ teacherId });
  },

  /**
   * Convenience: assignments for a single class.
   */
  async getAssignmentsByClass(classId: string): Promise<AssignmentResponse[]> {
    return this.getAssignments({ classId });
  },

  /**
   * Convenience: assignments for a single session.
   */
  async getAssignmentsBySession(sessionId: string): Promise<AssignmentResponse[]> {
    return this.getAssignments({ sessionId });
  },

  /**
   * Convenience: assignments for a teacher in a specific session. The
   * "my classes / my subjects" view in the teacher dashboard uses this.
   */
  async getAssignmentsByTeacherAndSession(
    teacherId: string,
    sessionId: string
  ): Promise<AssignmentResponse[]> {
    return this.getAssignments({ teacherId, sessionId });
  },

  /**
   * Create a single assignment. Validates that the teacher, class,
   * subject, and session all exist, and the subject is offered in the
   * class. Returns 409 on the unique (teacher, class, subject, session)
   * constraint.
   */
  async createAssignment(input: CreateAssignmentInput): Promise<AssignmentResponse> {
    await this.validateAssignmentTargets(
      input.teacherId,
      input.classId,
      input.subjectId,
      input.sessionId
    );

    try {
      const created = await prisma.assignment.create({
        data: {
          teacherId: input.teacherId,
          classId: input.classId,
          subjectId: input.subjectId,
          sessionId: input.sessionId,
        },
        include: relationInclude,
      });
      return toAssignmentResponse(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApiErrorClass(
          409,
          'This teacher is already assigned to this class and subject for the selected academic year',
          'AssignmentDuplicate'
        );
      }
      throw error;
    }
  },

  /**
   * Bulk create. Skips any rows that would violate the unique constraint
   * (against the DB or within the input array). Returns counts so the UI
   * can report a partial-success.
   */
  async bulkCreateAssignments(
    input: BulkCreateAssignmentsInput
  ): Promise<{ created: number; skipped: number; createdIds: string[] }> {
    // Validate every distinct target up-front to fail fast with clear
    // errors. We only validate each foreign key once.
    const teacherIds = new Set(input.assignments.map((a) => a.teacherId));
    const classIds = new Set(input.assignments.map((a) => a.classId));
    const subjectIds = new Set(input.assignments.map((a) => a.subjectId));
    const sessionIds = new Set(input.assignments.map((a) => a.sessionId));

    const [teachers, classes, subjects, sessions] = await Promise.all([
      prisma.teacher.findMany({ where: { id: { in: [...teacherIds] } } }),
      prisma.class.findMany({ where: { id: { in: [...classIds] } } }),
      prisma.subject.findMany({ where: { id: { in: [...subjectIds] } } }),
      prisma.academicSession.findMany({ where: { id: { in: [...sessionIds] } } }),
    ]);
    if (teachers.length !== teacherIds.size) {
      throw new ApiErrorClass(404, 'One or more teachers do not exist', 'TeacherNotFound');
    }
    if (classes.length !== classIds.size) {
      throw new ApiErrorClass(404, 'One or more classes do not exist', 'ClassNotFound');
    }
    if (subjects.length !== subjectIds.size) {
      throw new ApiErrorClass(404, 'One or more subjects do not exist', 'SubjectNotFound');
    }
    if (sessions.length !== sessionIds.size) {
      throw new ApiErrorClass(404, 'One or more sessions do not exist', 'SessionNotFound');
    }

    // Verify every subject is offered in every class it appears with
    const classSubjectPairs = new Set(
      input.assignments.map((a) => `${a.classId}::${a.subjectId}`)
    );
    const links = await prisma.subjectClass.findMany({
      where: {
        OR: [...classSubjectPairs].map((p) => {
          const [classId, subjectId] = p.split('::');
          return { classId, subjectId };
        }),
      },
      select: { classId: true, subjectId: true },
    });
    const validPairs = new Set(links.map((l) => `${l.classId}::${l.subjectId}`));
    const missing = [...classSubjectPairs].filter((p) => !validPairs.has(p));
    if (missing.length > 0) {
      throw new ApiErrorClass(
        400,
        'One or more subjects are not offered in the selected class(es)',
        'SubjectNotInClass'
      );
    }

    // Deduplicate within the input
    const seen = new Set<string>();
    const unique = input.assignments.filter((a) => {
      const k = `${a.teacherId}::${a.classId}::${a.subjectId}::${a.sessionId}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    let created = 0;
    let skipped = 0;
    const createdIds: string[] = [];

    // Loop rather than createMany so P2002 (duplicate against existing DB
    // rows) can be caught per-row and treated as a skip.
    for (const a of unique) {
      try {
        const row = await prisma.assignment.create({
          data: {
            teacherId: a.teacherId,
            classId: a.classId,
            subjectId: a.subjectId,
            sessionId: a.sessionId,
          },
        });
        created++;
        createdIds.push(row.id);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          skipped++;
        } else {
          throw error;
        }
      }
    }

    return { created, skipped, createdIds };
  },

  /**
   * Update an assignment. The new combination (if changed) must still
   * satisfy the unique constraint.
   */
  async updateAssignment(id: string, input: UpdateAssignmentInput): Promise<AssignmentResponse> {
    const existing = await prisma.assignment.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Assignment not found', 'AssignmentNotFound');
    }

    // If anything changed, validate the new combined targets.
    const newTeacherId = input.teacherId ?? existing.teacherId;
    const newClassId = input.classId ?? existing.classId;
    const newSubjectId = input.subjectId ?? existing.subjectId;
    const newSessionId = input.sessionId ?? existing.sessionId;

    if (
      input.teacherId !== undefined ||
      input.classId !== undefined ||
      input.subjectId !== undefined ||
      input.sessionId !== undefined
    ) {
      await this.validateAssignmentTargets(
        newTeacherId,
        newClassId,
        newSubjectId,
        newSessionId
      );
    }

    const data: Prisma.AssignmentUpdateInput = {};
    if (input.teacherId !== undefined) data.teacher = { connect: { id: input.teacherId } };
    if (input.classId !== undefined) data.class = { connect: { id: input.classId } };
    if (input.subjectId !== undefined) data.subject = { connect: { id: input.subjectId } };
    if (input.sessionId !== undefined) data.session = { connect: { id: input.sessionId } };

    try {
      const updated = await prisma.assignment.update({
        where: { id },
        data,
        include: relationInclude,
      });
      return toAssignmentResponse(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApiErrorClass(
          409,
          'This teacher is already assigned to this class and subject for the selected academic year',
          'AssignmentDuplicate'
        );
      }
      throw error;
    }
  },

  /**
   * Delete an assignment. Refuses if it has any results linked to it
   * (results would be silently lost). Use a soft-disable via the
   * Teacher.isActive = false or by reassigning instead.
   */
  async deleteAssignment(id: string): Promise<void> {
    const existing = await prisma.assignment.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Assignment not found', 'AssignmentNotFound');
    }
    await prisma.assignment.delete({ where: { id } });
  },

  /**
   * Validate that the four referenced rows exist and that the subject is
   * offered in the class. Throws ApiErrorClass(404) on missing rows and
   * 400 if the subject is not in the class.
   */
  async validateAssignmentTargets(
    teacherId: string,
    classId: string,
    subjectId: string,
    sessionId: string
  ): Promise<void> {
    const [teacher, cls, subject, session, link] = await Promise.all([
      prisma.teacher.findUnique({ where: { id: teacherId } }),
      prisma.class.findUnique({ where: { id: classId } }),
      prisma.subject.findUnique({ where: { id: subjectId } }),
      prisma.academicSession.findUnique({ where: { id: sessionId } }),
      prisma.subjectClass.findUnique({
        where: { subjectId_classId: { subjectId, classId } },
      }),
    ]);

    if (!teacher) throw new ApiErrorClass(404, 'Teacher not found', 'TeacherNotFound');
    if (!cls) throw new ApiErrorClass(404, 'Class not found', 'ClassNotFound');
    if (!subject) throw new ApiErrorClass(404, 'Subject not found', 'SubjectNotFound');
    if (!session) throw new ApiErrorClass(404, 'Academic session not found', 'SessionNotFound');
    if (!link) {
      throw new ApiErrorClass(
        400,
        'This subject is not offered in the selected class. Add the subject to the class first.',
        'SubjectNotInClass'
      );
    }
  },
};
