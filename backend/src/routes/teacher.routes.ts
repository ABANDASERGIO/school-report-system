import { Router } from 'express';
import { teacherController } from '../controllers/teacher.controller';
import { authenticate, requireProprietor } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import {
  createTeacherSchema,
  updateTeacherSchema,
  teacherIdParamSchema,
  searchQuerySchema,
  resetPasswordBodySchema,
} from '../validators/teacher.validator';

const router = Router();

// All teacher routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/teachers/me
 * Get the teacher record for the currently logged-in user.
 * Must come BEFORE /:id routes to avoid "me" being parsed as an id.
 */
router.get('/me', teacherController.me);

/**
 * GET /api/v1/teachers/search?q=:query
 * Search teachers. Proprietor only.
 */
router.get(
  '/search',
  requireProprietor,
  validateQuery(searchQuerySchema),
  teacherController.search
);

/**
 * GET /api/v1/teachers
 * List all teachers. Proprietor only.
 */
router.get('/', requireProprietor, teacherController.list);

/**
 * GET /api/v1/teachers/:id
 * Get a single teacher. Proprietor or the teacher themselves.
 */
router.get(
  '/:id',
  validateParams(teacherIdParamSchema),
  teacherController.getById
);

/**
 * POST /api/v1/teachers
 * Create a new teacher. Proprietor only.
 */
router.post(
  '/',
  requireProprietor,
  validateBody(createTeacherSchema),
  teacherController.create
);

/**
 * PATCH /api/v1/teachers/:id
 * Update a teacher. Proprietor or the teacher themselves.
 */
router.patch(
  '/:id',
  validateParams(teacherIdParamSchema),
  validateBody(updateTeacherSchema),
  teacherController.update
);

/**
 * PATCH /api/v1/teachers/:id/suspend
 * Suspend a teacher. Proprietor only.
 */
router.patch(
  '/:id/suspend',
  requireProprietor,
  validateParams(teacherIdParamSchema),
  teacherController.suspend
);

/**
 * PATCH /api/v1/teachers/:id/activate
 * Reactivate a teacher. Proprietor only.
 */
router.patch(
  '/:id/activate',
  requireProprietor,
  validateParams(teacherIdParamSchema),
  teacherController.activate
);

/**
 * DELETE /api/v1/teachers/:id
 * Soft-delete (suspend) a teacher. Proprietor only.
 */
router.delete(
  '/:id',
  requireProprietor,
  validateParams(teacherIdParamSchema),
  teacherController.delete
);

/**
 * POST /api/v1/teachers/:id/reset-password
 * Reset a teacher's password. Proprietor only.
 */
router.post(
  '/:id/reset-password',
  requireProprietor,
  validateParams(teacherIdParamSchema),
  validateBody(resetPasswordBodySchema),
  teacherController.resetPassword
);

export default router;
