import { Result, Prisma, ResultStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiErrorClass } from '../utils/response';
import type {
  UpsertResultInput,
  UpdateResultInput,
  BulkSaveDraftInput,
  BulkSubmitInput,
} from '../validators/result.validator';

export interface ResultResponse {
  id: string;
  studentId: string;
  subjectId: string;
  sequenceId: string;
  enrollmentId: string;
  sessionId: string;
  score: number | null;
  total: number;
  status: ResultStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    studentNumber: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
    coefficient: number;
  };
  sequence?: {
    id: string;
    name: string;
    number: number;
  };
  enrollment?: {
    id: string;
    classId: string;
  };
}

type ResultWithRelations = Result & {
  student?: { id: string; firstName: string; lastName: string; studentNumber: string } | null;
  subject?: { id: string; name: string; code: string; coefficient: number } | null;
  sequence?: { id: string; name: string; number: number } | null;
  enrollment?: { id: string; classId: string } | null;
};

function toResultResponse(r: ResultWithRelations): ResultResponse {
  return {
    id: r.id,
    studentId: r.studentId,
    subjectId: r.subjectId,
    sequenceId: r.sequenceId,
    enrollmentId: r.enrollmentId,
    sessionId: r.sessionId,
    score: r.score,
    total: r.total,
    status: r.status,
    submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    ...(r.student && {
      student: {
        id: r.student.id,
        firstName: r.student.firstName,
        lastName: r.student.lastName,
        studentNumber: r.student.studentNumber,
      },
    }),
    ...(r.subject && {
      subject: {
        id: r.subject.id,
        name: r.subject.name,
        code: r.subject.code,
        coefficient: r.subject.coefficient,
      },
    }),
    ...(r.sequence && {
      sequence: { id: r.sequence.id, name: r.sequence.name, number: r.sequence.number },
    }),
    ...(r.enrollment && {
      enrollment: { id: r.enrollment.id, classId: r.enrollment.classId },
    }),
  };
}

const relationInclude = {
  student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
  subject: { select: { id: true, name: true, code: true, coefficient: true } },
  sequence: { select: { id: true, name: true, number: true } },
  enrollment: { select: { id: true, classId: true } },
} as const;

/**
 * Look up (or fail) the active enrollment for a student in a given
 * session. Used when the caller does not supply an explicit enrollmentId.
 */
async function findActiveEnrollment(
  studentId: string,
  sessionId: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<string> {
  const enrollment = await tx.enrollment.findFirst({
    where: { studentId, sessionId, status: 'ACTIVE' },
    select: { id: true },
  });
  if (!enrollment) {
    throw new ApiErrorClass(
      400,
      'No active enrollment found for this student in the sequence\'s session',
      'NoActiveEnrollment'
    );
  }
  return enrollment.id;
}

export const resultService = {
  /**
   * List results with optional filters.
   */
  async getResults(filters: {
    studentId?: string;
    subjectId?: string;
    sequenceId?: string;
    sessionId?: string;
    classId?: string;
    status?: ResultStatus;
  }): Promise<ResultResponse[]> {
    const where: Prisma.ResultWhereInput = {};
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.sequenceId) where.sequenceId = filters.sequenceId;
    if (filters.sessionId) where.sessionId = filters.sessionId;
    if (filters.status) where.status = filters.status;

    // For classId, we need to go through Enrollment.classId
    if (filters.classId) {
      where.enrollment = { classId: filters.classId };
    }

    const results = await prisma.result.findMany({
      where,
      orderBy: [
        { sessionId: 'asc' },
        { sequenceId: 'asc' },
        { subjectId: 'asc' },
        { studentId: 'asc' },
      ],
      include: relationInclude,
    });
    return results.map(toResultResponse);
  },

  /**
   * Get a single result by ID.
   */
  async getResultById(id: string): Promise<ResultResponse> {
    const r = await prisma.result.findUnique({
      where: { id },
      include: relationInclude,
    });
    if (!r) {
      throw new ApiErrorClass(404, 'Result not found', 'ResultNotFound');
    }
    return toResultResponse(r);
  },

  /**
   * Upsert a single result. Creates the row if it doesn't exist
   * (matching the unique (studentId, subjectId, sequenceId, sessionId)
   * tuple), updates the score/total/status otherwise. Refuses to
   * transition away from LOCKED.
   *
   * If `idempotencyKey` is provided, the call is idempotent: the backend
   * first checks whether a result with that key already exists. If it does,
   * the existing row is returned unchanged. This lets the offline frontend
   * retry POSTs safely without creating duplicates.
   */
  async upsertResult(input: UpsertResultInput & { idempotencyKey?: string | null }): Promise<ResultResponse> {
    // Idempotency short-circuit: if the client sent a key and we've already
    // processed it, return the existing row without touching anything.
    if (input.idempotencyKey) {
      const byKey = await prisma.result.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: relationInclude,
      });
      if (byKey) {
        return toResultResponse(byKey);
      }
    }

    // Validate sequence and resolve sessionId
    const sequence = await prisma.sequence.findUnique({ where: { id: input.sequenceId } });
    if (!sequence) {
      throw new ApiErrorClass(404, 'Sequence not found', 'SequenceNotFound');
    }
    const sessionId = sequence.sessionId;

    // Validate student + subject
    const [student, subject] = await Promise.all([
      prisma.student.findUnique({ where: { id: input.studentId } }),
      prisma.subject.findUnique({ where: { id: input.subjectId } }),
    ]);
    if (!student) {
      throw new ApiErrorClass(404, 'Student not found', 'StudentNotFound');
    }
    if (!subject) {
      throw new ApiErrorClass(404, 'Subject not found', 'SubjectNotFound');
    }

    // Resolve enrollmentId (either explicit or auto)
    let enrollmentId = input.enrollmentId;
    if (!enrollmentId) {
      enrollmentId = await findActiveEnrollment(input.studentId, sessionId);
    } else {
      const existing = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
      if (!existing) {
        throw new ApiErrorClass(404, 'Enrollment not found', 'EnrollmentNotFound');
      }
    }

    // If result is already LOCKED, refuse any change
    const existing = await prisma.result.findUnique({
      where: {
        studentId_subjectId_sequenceId_sessionId: {
          studentId: input.studentId,
          subjectId: input.subjectId,
          sequenceId: input.sequenceId,
          sessionId,
        },
      },
    });
    if (existing && existing.status === 'LOCKED') {
      throw new ApiErrorClass(
        400,
        'This result is locked and cannot be modified',
        'ResultLocked'
      );
    }

    const status: ResultStatus = input.status ?? 'DRAFT';
    const submittedAt =
      status === 'SUBMITTED' || status === 'LOCKED'
        ? existing?.submittedAt ?? new Date()
        : null;

    const result = await prisma.result.upsert({
      where: {
        studentId_subjectId_sequenceId_sessionId: {
          studentId: input.studentId,
          subjectId: input.subjectId,
          sequenceId: input.sequenceId,
          sessionId,
        },
      },
      create: {
        studentId: input.studentId,
        subjectId: input.subjectId,
        sequenceId: input.sequenceId,
        enrollmentId: enrollmentId,
        sessionId,
        score: input.score,
        total: input.total,
        status,
        submittedAt,
        idempotencyKey: input.idempotencyKey ?? undefined,
      },
      update: {
        enrollmentId,
        score: input.score,
        total: input.total,
        status,
        submittedAt,
      },
      include: relationInclude,
    });
    return toResultResponse(result);
  },

  /**
   * Update an existing result by ID.
   */
  async updateResult(id: string, input: UpdateResultInput): Promise<ResultResponse> {
    const existing = await prisma.result.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Result not found', 'ResultNotFound');
    }
    if (existing.status === 'LOCKED') {
      throw new ApiErrorClass(
        400,
        'This result is locked and cannot be modified',
        'ResultLocked'
      );
    }

    const data: Prisma.ResultUpdateInput = {};
    if (input.score !== undefined) data.score = input.score;
    if (input.total !== undefined) data.total = input.total;
    if (input.status !== undefined) {
      data.status = input.status;
      data.submittedAt =
        input.status === 'SUBMITTED' || input.status === 'LOCKED'
          ? existing.submittedAt ?? new Date()
          : null;
    }

    const updated = await prisma.result.update({
      where: { id },
      data,
      include: relationInclude,
    });
    return toResultResponse(updated);
  },

  /**
   * Save a draft (creates or updates each result with status=DRAFT).
   * Used by the "Save Draft" button in the marks entry form.
   */
  async bulkSaveDraft(input: BulkSaveDraftInput): Promise<{
    saved: number;
    skipped: number;
  }> {
    let saved = 0;
    let skipped = 0;
    for (const r of input.results) {
      try {
        await this.upsertResult({ ...r, status: 'DRAFT' });
        saved++;
      } catch (error) {
        if (
          error instanceof ApiErrorClass &&
          (error.error === 'ResultLocked' || error.error === 'NoActiveEnrollment')
        ) {
          skipped++;
        } else {
          throw error;
        }
      }
    }
    return { saved, skipped };
  },

  /**
   * Submit a sequence's results: upsert every row with status=SUBMITTED.
   * Skips locked rows and rows where the student has no active enrollment.
   */
  async bulkSubmit(input: BulkSubmitInput): Promise<{
    submitted: number;
    skipped: number;
  }> {
    let submitted = 0;
    let skipped = 0;
    for (const r of input.results) {
      try {
        await this.upsertResult({
          studentId: r.studentId,
          subjectId: r.subjectId,
          sequenceId: input.sequenceId,
          enrollmentId: r.enrollmentId,
          score: r.score,
          total: r.total,
          status: 'SUBMITTED',
          idempotencyKey: r.idempotencyKey ?? undefined,
        });
        submitted++;
      } catch (error) {
        if (
          error instanceof ApiErrorClass &&
          (error.error === 'ResultLocked' || error.error === 'NoActiveEnrollment')
        ) {
          skipped++;
        } else {
          throw error;
        }
      }
    }
    return { submitted, skipped };
  },

  /**
   * Lock all submitted results for a sequence. Refuses if any row is in
   * DRAFT (proprietor must wait for submission). Returns counts.
   */
  async lockSequence(sequenceId: string): Promise<{ locked: number }> {
    const sequence = await prisma.sequence.findUnique({ where: { id: sequenceId } });
    if (!sequence) {
      throw new ApiErrorClass(404, 'Sequence not found', 'SequenceNotFound');
    }
    const drafts = await prisma.result.count({
      where: { sequenceId, status: 'DRAFT' },
    });
    if (drafts > 0) {
      throw new ApiErrorClass(
        400,
        `Cannot lock: ${drafts} result(s) are still in DRAFT status. Submit them first.`,
        'DraftsRemaining'
      );
    }
    const updated = await prisma.result.updateMany({
      where: { sequenceId, status: 'SUBMITTED' },
      data: { status: 'LOCKED' },
    });
    return { locked: updated.count };
  },

  /**
   * Unlock all locked results for a sequence.
   */
  async unlockSequence(sequenceId: string): Promise<{ unlocked: number }> {
    const sequence = await prisma.sequence.findUnique({ where: { id: sequenceId } });
    if (!sequence) {
      throw new ApiErrorClass(404, 'Sequence not found', 'SequenceNotFound');
    }
    const updated = await prisma.result.updateMany({
      where: { sequenceId, status: 'LOCKED' },
      data: { status: 'SUBMITTED' },
    });
    return { unlocked: updated.count };
  },

  /**
   * Counts of results by status, optionally filtered by session.
   */
  async getStatusCounts(sessionId?: string): Promise<{
    draft: number;
    submitted: number;
    locked: number;
  }> {
    const where: Prisma.ResultWhereInput = {};
    if (sessionId) where.sessionId = sessionId;
    const [draft, submitted, locked] = await Promise.all([
      prisma.result.count({ where: { ...where, status: 'DRAFT' } }),
      prisma.result.count({ where: { ...where, status: 'SUBMITTED' } }),
      prisma.result.count({ where: { ...where, status: 'LOCKED' } }),
    ]);
    return { draft, submitted, locked };
  },

  /**
   * Per-sequence status counts. Used by the results page to show how many
   * students have marks entered/submitted/locked.
   */
  async getSequenceStatusCounts(sequenceId: string): Promise<{
    total: number;
    drafted: number;
    submitted: number;
    locked: number;
  }> {
    const [total, drafted, submitted, locked] = await Promise.all([
      prisma.result.count({ where: { sequenceId } }),
      prisma.result.count({ where: { sequenceId, status: 'DRAFT' } }),
      prisma.result.count({ where: { sequenceId, status: 'SUBMITTED' } }),
      prisma.result.count({ where: { sequenceId, status: 'LOCKED' } }),
    ]);
    return { total, drafted, submitted, locked };
  },
};
