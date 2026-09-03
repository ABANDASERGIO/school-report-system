import { z } from 'zod';

const uuid = z.string().uuid('Invalid ID');

const resultStatusSchema = z.enum(['DRAFT', 'SUBMITTED', 'LOCKED']);

const singleMarkSchema = z.object({
  studentId: uuid,
  subjectId: uuid,
  sequenceId: uuid,
  // enrollmentId is optional. If omitted, the service will look up the
  // student's active enrollment in the sequence's session.
  enrollmentId: uuid.optional(),
  score: z.number().min(0).max(1000).nullable(),
  total: z.number().min(0).max(1000).default(20),
  status: resultStatusSchema.optional(),
});

export const upsertResultSchema = singleMarkSchema;

export const updateResultSchema = z.object({
  score: z.number().min(0).max(1000).nullable().optional(),
  total: z.number().min(0).max(1000).optional(),
  status: resultStatusSchema.optional(),
});

export const bulkSaveDraftSchema = z.object({
  results: z.array(singleMarkSchema).min(1).max(500),
});

export const bulkSubmitSchema = z.object({
  sequenceId: uuid,
  results: z
    .array(
      z.object({
        studentId: uuid,
        subjectId: uuid,
        sequenceId: uuid.optional(),
        enrollmentId: uuid.optional(),
        score: z.number().min(0).max(1000).nullable(),
        total: z.number().min(0).max(1000).default(20),
      })
    )
    .min(1)
    .max(500),
});

export const resultIdParamSchema = z.object({
  id: uuid,
});

export const resultQuerySchema = z.object({
  studentId: uuid.optional(),
  subjectId: uuid.optional(),
  sequenceId: uuid.optional(),
  sessionId: uuid.optional(),
  classId: uuid.optional(),
  status: resultStatusSchema.optional(),
});

export type UpsertResultInput = z.infer<typeof upsertResultSchema>;
export type UpdateResultInput = z.infer<typeof updateResultSchema>;
export type BulkSaveDraftInput = z.infer<typeof bulkSaveDraftSchema>;
export type BulkSubmitInput = z.infer<typeof bulkSubmitSchema>;
