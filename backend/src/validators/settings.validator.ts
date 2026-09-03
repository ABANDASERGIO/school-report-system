import { z } from 'zod';

const settingKeySchema = z
  .string()
  .min(1, 'Setting key is required')
  .max(50)
  .regex(/^[a-z0-9_]+$/, 'Setting key must be lowercase letters, numbers, and underscores only');

export const settingKeyParamSchema = z.object({
  key: settingKeySchema,
});

export const updateSettingSchema = z.object({
  value: z.string().max(5000, 'Value is too long'),
});

export const updateSettingsBulkSchema = z.object({
  settings: z
    .array(
      z.object({
        key: settingKeySchema,
        value: z.string().max(5000),
      })
    )
    .min(1, 'At least one setting is required'),
});

export const createOrUpdateSettingSchema = z.object({
  key: settingKeySchema,
  value: z.string().max(5000),
  description: z.string().max(500).optional(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type UpdateSettingsBulkInput = z.infer<typeof updateSettingsBulkSchema>;
export type CreateOrUpdateSettingInput = z.infer<typeof createOrUpdateSettingSchema>;
