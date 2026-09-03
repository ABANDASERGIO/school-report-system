import { Router } from 'express';
import { classController } from '../controllers/class.controller';
import { authenticate, requireProprietor } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import {
  createClassSchema,
  updateClassSchema,
  classIdParamSchema,
  classQuerySchema,
} from '../validators/class.validator';

const router = Router();

// All class routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/classes/search?q=...
 * Search classes. Must come BEFORE /:id routes.
 */
router.get(
  '/search',
  validateQuery(classQuerySchema),
  classController.search
);

/**
 * GET /api/v1/classes
 * List all classes.
 */
router.get('/', classController.list);

/**
 * GET /api/v1/classes/:id
 * Get a single class.
 */
router.get(
  '/:id',
  validateParams(classIdParamSchema),
  classController.getById
);

/**
 * POST /api/v1/classes
 * Create a new class. Proprietor only.
 */
router.post(
  '/',
  requireProprietor,
  validateBody(createClassSchema),
  classController.create
);

/**
 * PATCH /api/v1/classes/:id
 * Update a class. Proprietor only.
 */
router.patch(
  '/:id',
  requireProprietor,
  validateParams(classIdParamSchema),
  validateBody(updateClassSchema),
  classController.update
);

/**
 * DELETE /api/v1/classes/:id
 * Delete a class. Proprietor only.
 */
router.delete(
  '/:id',
  requireProprietor,
  validateParams(classIdParamSchema),
  classController.delete
);

export default router;
