import { z } from 'zod';

const genderSchema = z.enum(['MALE', 'FEMALE']);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((d) => !isNaN(Date.parse(d)), 'Invalid date');

const uuid = z.string().uuid('Invalid ID');

export const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  dateOfBirth: isoDate.optional().or(z.literal('')),
  placeOfBirth: z.string().max(100).optional().or(z.literal('')),
  gender: genderSchema,
  address: z.string().max(200).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  parentName: z.string().max(100).optional().or(z.literal('')),
  parentPhone: z.string().max(30).optional().or(z.literal('')),
  photoUrl: z.string().url('Invalid photo URL').optional().or(z.literal('')),
  photoPublicId: z.string().max(200).optional().or(z.literal('')),
  // Optional: enroll the new student in a class+session in the same call.
  // Mirrors the "Register Student" UI flow.
  enrollment: z
    .object({
      classId: uuid,
      sessionId: uuid,
    })
    .optional(),
});

export const updateStudentSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  dateOfBirth: isoDate.optional().or(z.literal('')),
  placeOfBirth: z.string().max(100).optional().or(z.literal('')),
  gender: genderSchema.optional(),
  address: z.string().max(200).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  parentName: z.string().max(100).optional().or(z.literal('')),
  parentPhone: z.string().max(30).optional().or(z.literal('')),
  photoUrl: z.string().url().optional().or(z.literal('')),
  photoPublicId: z.string().max(200).optional().or(z.literal('')),
});

export const studentIdParamSchema = z.object({
  id: uuid,
});

export const studentQuerySchema = z.object({
  q: z.string().max(100).optional(),
  sessionId: uuid.optional(),
  classId: uuid.optional(),
  status: z.enum(['ACTIVE', 'WITHDRAWN', 'TRANSFERRED', 'GRADUATED', 'REPEATER']).optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
