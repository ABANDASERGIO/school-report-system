import { z } from 'zod';

const uuid = z.string().uuid('Invalid ID');

export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(50),
  code: z.string().min(1, 'Class code is required').max(20),
  description: z.string().max(500).optional().or(z.literal('')),
});

export const updateClassSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  code: z.string().min(1).max(20).optional(),
  description: z.string().max(500).optional().or(z.literal('')),
});

export const classIdParamSchema = z.object({
  id: uuid,
});

export const classQuerySchema = z.object({
  q: z.string().max(100).optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
