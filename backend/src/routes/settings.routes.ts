import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { authenticate, requireProprietor } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import {
  updateSettingSchema,
  updateSettingsBulkSchema,
  createOrUpdateSettingSchema,
  settingKeyParamSchema,
} from '../validators/settings.validator';

const router = Router();

// All settings routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/settings/school-name
 * Convenience endpoint - must come BEFORE /:key
 */
router.get('/school-name', settingsController.getSchoolName);

/**
 * GET /api/v1/settings
 * List all settings.
 */
router.get('/', settingsController.list);

/**
 * GET /api/v1/settings/:key
 * Get a single setting.
 */
router.get(
  '/:key',
  validateParams(settingKeyParamSchema),
  settingsController.getByKey
);

/**
 * PATCH /api/v1/settings
 * Bulk update multiple settings. Proprietor only.
 */
router.patch(
  '/',
  requireProprietor,
  validateBody(updateSettingsBulkSchema),
  settingsController.updateBulk
);

/**
 * PUT /api/v1/settings
 * Create or update a single setting. Proprietor only.
 */
router.put(
  '/',
  requireProprietor,
  validateBody(createOrUpdateSettingSchema),
  settingsController.upsert
);

/**
 * PATCH /api/v1/settings/:key
 * Update a single setting. Proprietor only.
 */
router.patch(
  '/:key',
  requireProprietor,
  validateParams(settingKeyParamSchema),
  validateBody(updateSettingSchema),
  settingsController.update
);

export default router;
