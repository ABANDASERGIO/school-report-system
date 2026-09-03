import { Router } from 'express';
import { z } from 'zod';
import { resultController } from '../controllers/result.controller';
import { authenticate, requireProprietor } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import {
  upsertResultSchema,
  updateResultSchema,
  resultIdParamSchema,
  resultQuerySchema,
  bulkSaveDraftSchema,
  bulkSubmitSchema,
} from '../validators/result.validator';

const sequenceIdParamSchema = z.object({
  sequenceId: z.string().uuid('Invalid sequence ID'),
});

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/results/status-counts?sessionId=
 * Global status counts. Must come before /:id.
 */
router.get('/status-counts', resultController.getStatusCounts);

/**
 * GET /api/v1/results/sequence/:sequenceId/status
 * Per-sequence counts. Must come before /:id.
 */
router.get(
  '/sequence/:sequenceId/status',
  validateParams(sequenceIdParamSchema),
  resultController.getSequenceStatus
);

/**
 * POST /api/v1/results/sequence/:sequenceId/lock
 * Lock a sequence. Proprietor only. Must come before /:id.
 */
router.post(
  '/sequence/:sequenceId/lock',
  requireProprietor,
  validateParams(sequenceIdParamSchema),
  resultController.lockSequence
);

/**
 * POST /api/v1/results/sequence/:sequenceId/unlock
 * Unlock a sequence. Proprietor only. Must come before /:id.
 */
router.post(
  '/sequence/:sequenceId/unlock',
  requireProprietor,
  validateParams(sequenceIdParamSchema),
  resultController.unlockSequence
);

/**
 * POST /api/v1/results/bulk-draft
 * Bulk save drafts. Must come before /:id.
 */
router.post(
  '/bulk-draft',
  validateBody(bulkSaveDraftSchema),
  resultController.bulkDraft
);

/**
 * POST /api/v1/results/bulk-submit
 * Bulk submit. Must come before /:id.
 */
router.post(
  '/bulk-submit',
  validateBody(bulkSubmitSchema),
  resultController.bulkSubmit
);

/**
 * GET /api/v1/results
 * List results with optional filters.
 */
router.get(
  '/',
  validateQuery(resultQuerySchema),
  resultController.list
);

/**
 * GET /api/v1/results/:id
 * Get a single result.
 */
router.get(
  '/:id',
  validateParams(resultIdParamSchema),
  resultController.getById
);

/**
 * POST /api/v1/results
 * Create or update a single result.
 */
router.post(
  '/',
  validateBody(upsertResultSchema),
  resultController.upsert
);

/**
 * PATCH /api/v1/results/:id
 * Update a result. Refuses if LOCKED.
 */
router.patch(
  '/:id',
  validateParams(resultIdParamSchema),
  validateBody(updateResultSchema),
  resultController.update
);

export default router;
