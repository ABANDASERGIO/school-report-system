import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';
import { authenticate, requireProprietor } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import {
  createSessionSchema,
  updateSessionSchema,
  sessionIdParamSchema,
} from '../validators/session.validator';

const router = Router();

// All session routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/sessions/current
 * Get the current active session. Public to all authenticated users.
 * Must come BEFORE /:id routes.
 */
router.get('/current', sessionController.getCurrent);

/**
 * GET /api/v1/sessions/has-sessions
 * Check if any session exists. Used by first-time setup.
 * Public to all authenticated users.
 */
router.get('/has-sessions', sessionController.hasSessions);

/**
 * GET /api/v1/sessions
 * List all academic sessions.
 */
router.get('/', sessionController.list);

/**
 * GET /api/v1/sessions/:id
 * Get a single session.
 */
router.get(
  '/:id',
  validateParams(sessionIdParamSchema),
  sessionController.getById
);

/**
 * POST /api/v1/sessions
 * Create a new academic session. Proprietor only.
 */
router.post(
  '/',
  requireProprietor,
  validateBody(createSessionSchema),
  sessionController.create
);

/**
 * PATCH /api/v1/sessions/:id
 * Update a session. Proprietor only.
 */
router.patch(
  '/:id',
  requireProprietor,
  validateParams(sessionIdParamSchema),
  validateBody(updateSessionSchema),
  sessionController.update
);

/**
 * POST /api/v1/sessions/:id/set-current
 * Mark a session as the current one. Proprietor only.
 */
router.post(
  '/:id/set-current',
  requireProprietor,
  validateParams(sessionIdParamSchema),
  sessionController.setCurrent
);

/**
 * POST /api/v1/sessions/:id/carry-forward
 * Carry forward assignments to another session. Proprietor only.
 */
router.post(
  '/:id/carry-forward',
  requireProprietor,
  validateParams(sessionIdParamSchema),
  sessionController.carryForward
);

export default router;
