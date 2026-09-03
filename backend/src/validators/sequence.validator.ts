import { z } from 'zod';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((d) => !isNaN(Date.parse(d)), 'Invalid date');

const uuid = z.string().uuid('Invalid ID');

export const createSequenceSchema = z
  .object({
    termId: uuid,
    name: z.string().min(1, 'Sequence name is required').max(50),
    number: z.number().int().min(1).max(20),
    startDate: isoDate,
    endDate: isoDate,
    isActive: z.boolean().default(false),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const updateSequenceSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  number: z.number().int().min(1).max(20).optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  isActive: z.boolean().optional(),
});

export const sequenceIdParamSchema = z.object({
  id: uuid,
});

export const sequenceQuerySchema = z.object({
  termId: uuid.optional(),
});

export type CreateSequenceInput = z.infer<typeof createSequenceSchema>;
export type UpdateSequenceInput = z.infer<typeof updateSequenceSchema>;
