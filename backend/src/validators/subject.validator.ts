import { z } from 'zod';

const uuid = z.string().uuid('Invalid ID');

export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(50),
  code: z.string().min(1, 'Subject code is required').max(20),
  description: z.string().max(500).optional().or(z.literal('')),
  coefficient: z.number().int().min(1).max(10).default(1),
});

export const updateSubjectSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  code: z.string().min(1).max(20).optional(),
  description: z.string().max(500).optional().or(z.literal('')),
  coefficient: z.number().int().min(1).max(10).optional(),
});

export const subjectIdParamSchema = z.object({
  id: uuid,
});

export const subjectQuerySchema = z.object({
  q: z.string().max(100).optional(),
});

export const assignSubjectsToClassSchema = z.object({
  subjectIds: z.array(uuid).default([]),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type AssignSubjectsToClassInput = z.infer<typeof assignSubjectsToClassSchema>;
