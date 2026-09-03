import { z } from 'zod';

const objectIdSchema = z.string().uuid('Invalid ID format');

export const createTeacherSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address').max(100),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  photoUrl: z.string().url('Invalid photo URL').optional().or(z.literal('')),
  photoPublicId: z.string().max(200).optional().or(z.literal('')),
});

export const updateTeacherSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().max(100).optional(),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  photoUrl: z.string().url().optional().or(z.literal('')),
  photoPublicId: z.string().max(200).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export const teacherIdParamSchema = z.object({
  id: objectIdSchema,
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
});

export const resetPasswordBodySchema = z.object({
  newPassword: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100)
    .optional(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
