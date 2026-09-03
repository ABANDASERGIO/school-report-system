import { z } from 'zod';

const uuid = z.string().uuid('Invalid ID');

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((d) => !isNaN(Date.parse(d)), 'Invalid date')
  .optional();

export const enrollmentStatusSchema = z.enum([
  'ACTIVE',
  'WITHDRAWN',
  'TRANSFERRED',
  'GRADUATED',
  'REPEATER',
]);

export const createEnrollmentSchema = z.object({
  studentId: uuid,
  classId: uuid,
  sessionId: uuid,
  status: enrollmentStatusSchema.default('ACTIVE'),
  enrollmentDate: isoDate,
});

export const updateEnrollmentSchema = z.object({
  classId: uuid.optional(),
  status: enrollmentStatusSchema.optional(),
  enrollmentDate: isoDate,
});

export const enrollmentIdParamSchema = z.object({
  id: uuid,
});

export const enrollmentQuerySchema = z.object({
  sessionId: uuid.optional(),
  classId: uuid.optional(),
  studentId: uuid.optional(),
  status: enrollmentStatusSchema.optional(),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
