import { SchoolSetting, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiErrorClass } from '../utils/response';
import { DEFAULT_SETTINGS } from '../config/constants';
import { cloudinaryService } from './cloudinary.service';
import type {
  UpdateSettingInput,
  UpdateSettingsBulkInput,
  CreateOrUpdateSettingInput,
} from '../validators/settings.validator';

// Shape returned to the frontend.
export interface SettingResponse {
  id: string;
  key: string;
  value: string;
  description: string;
  updatedAt: string;
}

function toSettingResponse(setting: SchoolSetting): SettingResponse {
  return {
    id: setting.id,
    key: setting.key,
    value: setting.value,
    description: setting.description ?? '',
    updatedAt: setting.updatedAt.toISOString(),
  };
}

export const settingsService = {
  /**
   * Ensure all default settings exist. Called on app boot.
   * Idempotent — uses upsert so existing settings are preserved.
   */
  async seedDefaults(): Promise<void> {
    for (const def of DEFAULT_SETTINGS) {
      await prisma.schoolSetting.upsert({
        where: { key: def.key },
        create: {
          key: def.key,
          value: def.value,
          description: def.description,
        },
        update: {}, // never overwrite existing values
      });
    }
  },

  /**
   * Get all settings.
   */
  async getAllSettings(): Promise<SettingResponse[]> {
    const settings = await prisma.schoolSetting.findMany({
      orderBy: { key: 'asc' },
    });
    return settings.map(toSettingResponse);
  },

  /**
   * Get a single setting by key. Returns null if not found.
   */
  async getSetting(key: string): Promise<SettingResponse | null> {
    const setting = await prisma.schoolSetting.findUnique({ where: { key } });
    return setting ? toSettingResponse(setting) : null;
  },

  /**
   * Get multiple settings by their keys in one call.
   * Returns a map of key -> value (empty string if not found).
   */
  async getSettingsByKeys(keys: string[]): Promise<Record<string, string>> {
    const settings = await prisma.schoolSetting.findMany({
      where: { key: { in: keys } },
    });
    const result: Record<string, string> = {};
    for (const key of keys) {
      const found = settings.find((s) => s.key === key);
      result[key] = found?.value ?? '';
    }
    return result;
  },

  /**
   * Update a single setting by key. Creates the setting if it doesn't exist.
   * For `school_logo`, the previous Cloudinary asset (if any) is deleted when
   * the value changes, so the CDN does not accumulate stale logos.
   */
  async updateSetting(key: string, input: UpdateSettingInput): Promise<SettingResponse> {
    const existing = await prisma.schoolSetting.findUnique({ where: { key } });
    if (
      key === 'school_logo' &&
      existing &&
      existing.value &&
      existing.value !== input.value &&
      /^https?:\/\/res\.cloudinary\.com\//.test(existing.value)
    ) {
      const oldPublicId = await this.extractCloudinaryPublicId(existing.value);
      if (oldPublicId) {
        try {
          await cloudinaryService.deleteImage(oldPublicId);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[settings.updateSetting] Failed to delete old logo:', err);
        }
      }
    }

    const setting = await prisma.schoolSetting.upsert({
      where: { key },
      create: {
        key,
        value: input.value,
      },
      update: { value: input.value },
    });
    return toSettingResponse(setting);
  },

  /**
   * Extract a Cloudinary public_id from a secure URL. Returns null if the
   * URL does not appear to be a Cloudinary asset. We keep this here (instead
   * of in cloudinary.service) because it depends on the URL shape and is
   * only used by settings right now.
   */
  async extractCloudinaryPublicId(url: string): Promise<string | null> {
    try {
      // Example: https://res.cloudinary.com/<cloud>/image/upload/v123/edugrade/school/logo.png
      // public_id = edugrade/school/logo (no extension).
      const marker = '/image/upload/';
      const idx = url.indexOf(marker);
      if (idx === -1) return null;
      let after = url.substring(idx + marker.length);
      // strip version segment like v1234567890/
      after = after.replace(/^v\d+\//, '');
      // strip query string
      after = after.split('?')[0];
      // strip extension
      const lastDot = after.lastIndexOf('.');
      if (lastDot !== -1) after = after.substring(0, lastDot);
      return after || null;
    } catch {
      return null;
    }
  },

  /**
   * Update multiple settings at once.
   */
  async updateSettingsBulk(input: UpdateSettingsBulkInput): Promise<SettingResponse[]> {
    const operations = input.settings.map((s) =>
      prisma.schoolSetting.upsert({
        where: { key: s.key },
        create: { key: s.key, value: s.value },
        update: { value: s.value },
      })
    );
    const updated = await prisma.$transaction(operations);
    return updated.map(toSettingResponse);
  },

  /**
   * Create or update a setting with description. Used for seeding.
   */
  async upsertSetting(input: CreateOrUpdateSettingInput): Promise<SettingResponse> {
    const setting = await prisma.schoolSetting.upsert({
      where: { key: input.key },
      create: {
        key: input.key,
        value: input.value,
        description: input.description,
      },
      update: {
        value: input.value,
        ...(input.description !== undefined && { description: input.description }),
      },
    });
    return toSettingResponse(setting);
  },

  /**
   * Convenience: get school name.
   */
  async getSchoolName(): Promise<string> {
    const setting = await prisma.schoolSetting.findUnique({ where: { key: 'school_name' } });
    return setting?.value || 'EduGrade School';
  },

  /**
   * Convenience: get max score (defaults to 20).
   */
  async getMaxScore(): Promise<number> {
    const setting = await prisma.schoolSetting.findUnique({ where: { key: 'max_score' } });
    const parsed = parseInt(setting?.value || '20', 10);
    return isNaN(parsed) ? 20 : parsed;
  },

  /**
   * Convenience: get marks entry open status.
   */
  async isMarksEntryOpen(): Promise<boolean> {
    const setting = await prisma.schoolSetting.findUnique({ where: { key: 'marks_entry_open' } });
    return setting?.value === 'true';
  },
};
