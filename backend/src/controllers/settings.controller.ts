import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service';
import { successResponse } from '../utils/response';
import type {
  UpdateSettingInput,
  UpdateSettingsBulkInput,
  CreateOrUpdateSettingInput,
} from '../validators/settings.validator';

export const settingsController = {
  /**
   * GET /api/v1/settings
   * List all settings. Authenticated users.
   */
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.getAllSettings();
      res.status(200).json(successResponse(settings));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/settings/:key
   * Get a single setting.
   */
  async getByKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const setting = await settingsService.getSetting(String(req.params.key));
      res.status(200).json(successResponse(setting));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/settings/:key
   * Update a single setting. Proprietor only.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateSettingInput;
      const setting = await settingsService.updateSetting(String(req.params.key), input);
      res.status(200).json(successResponse(setting, 'Setting updated'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/settings
   * Update multiple settings at once. Proprietor only.
   */
  async updateBulk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateSettingsBulkInput;
      const settings = await settingsService.updateSettingsBulk(input);
      res.status(200).json(successResponse(settings, 'Settings updated'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/v1/settings
   * Create or update a single setting. Proprietor only.
   */
  async upsert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateOrUpdateSettingInput;
      const setting = await settingsService.upsertSetting(input);
      res.status(200).json(successResponse(setting, 'Setting saved'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/settings/school-name
   * Convenience: get school name only.
   */
  async getSchoolName(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const name = await settingsService.getSchoolName();
      res.status(200).json(successResponse({ name }));
    } catch (error) {
      next(error);
    }
  },
};
