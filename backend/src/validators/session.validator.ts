import { z } from 'zod';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((d) => !isNaN(Date.parse(d)), 'Invalid date');

export const createSessionSchema = z
  .object({
    name: z.string().min(1, 'Session name is required').max(50),
    startDate: isoDate,
    endDate: isoDate,
    isCurrent: z.boolean().default(false),
    carryForward: z.boolean().default(false),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const updateSessionSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  isCurrent: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const sessionIdParamSchema = z.object({
  id: z.string().uuid('Invalid session ID'),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
