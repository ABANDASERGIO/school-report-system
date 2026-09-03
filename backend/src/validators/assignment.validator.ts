import { z } from 'zod';

const uuid = z.string().uuid('Invalid ID');

const assignmentBodySchema = z.object({
  teacherId: uuid,
  classId: uuid,
  subjectId: uuid,
  sessionId: uuid,
});

export const createAssignmentSchema = assignmentBodySchema;

export const updateAssignmentSchema = z.object({
  teacherId: uuid.optional(),
  classId: uuid.optional(),
  subjectId: uuid.optional(),
  sessionId: uuid.optional(),
});

export const assignmentIdParamSchema = z.object({
  id: uuid,
});

export const assignmentQuerySchema = z.object({
  teacherId: uuid.optional(),
  classId: uuid.optional(),
  subjectId: uuid.optional(),
  sessionId: uuid.optional(),
});

/**
 * Bulk create: an array of (teacher, class, subject, session) tuples to
 * insert in one shot. Duplicates within the array, and duplicates against
 * the existing DB, are skipped (P2002) so this is idempotent for the
 * "assign a teacher to N classes" workflow.
 */
export const bulkCreateAssignmentsSchema = z.object({
  assignments: z.array(assignmentBodySchema).min(1).max(500),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type BulkCreateAssignmentsInput = z.infer<typeof bulkCreateAssignmentsSchema>;
