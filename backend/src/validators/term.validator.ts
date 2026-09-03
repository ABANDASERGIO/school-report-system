import { z } from 'zod';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((d) => !isNaN(Date.parse(d)), 'Invalid date');

const uuid = z.string().uuid('Invalid ID');

export const createTermSchema = z
  .object({
    sessionId: uuid,
    name: z.string().min(1, 'Term name is required').max(50),
    sequenceCount: z.number().int().min(1).max(10).default(2),
    startDate: isoDate,
    endDate: isoDate,
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const updateTermSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  sequenceCount: z.number().int().min(1).max(10).optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
});

export const termIdParamSchema = z.object({
  id: uuid,
});

export const termQuerySchema = z.object({
  sessionId: uuid.optional(),
});

export type CreateTermInput = z.infer<typeof createTermSchema>;
export type UpdateTermInput = z.infer<typeof updateTermSchema>;
