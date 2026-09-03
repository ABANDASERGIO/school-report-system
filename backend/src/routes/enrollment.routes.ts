import { Router } from 'express';
import { enrollmentController } from '../controllers/enrollment.controller';
import { authenticate, requireProprietor } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  enrollmentIdParamSchema,
} from '../validators/enrollment.validator';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/enrollments
 * List enrollments. Supports ?sessionId, ?classId, ?studentId, ?status.
 */
router.get('/', enrollmentController.list);

/**
 * DELETE /api/v1/enrollments/by-student-session?studentId=&sessionId=
 * Convenience: withdraw a student from an entire academic year.
 * Must come BEFORE /:id routes.
 */
router.delete('/by-student-session', requireProprietor, enrollmentController.removeStudentFromSession);

/**
 * GET /api/v1/enrollments/:id
 * Get a single enrollment.
 */
router.get(
  '/:id',
  validateParams(enrollmentIdParamSchema),
  enrollmentController.getById
);

/**
 * POST /api/v1/enrollments
 * Create a new enrollment. Proprietor only.
 */
router.post(
  '/',
  requireProprietor,
  validateBody(createEnrollmentSchema),
  enrollmentController.create
);

/**
 * PATCH /api/v1/enrollments/:id
 * Update an enrollment. Proprietor only.
 */
router.patch(
  '/:id',
  requireProprietor,
  validateParams(enrollmentIdParamSchema),
  validateBody(updateEnrollmentSchema),
  enrollmentController.update
);

/**
 * POST /api/v1/enrollments/:id/withdraw
 * Mark an enrollment as WITHDRAWN. Proprietor only.
 */
router.post(
  '/:id/withdraw',
  requireProprietor,
  validateParams(enrollmentIdParamSchema),
  enrollmentController.withdraw
);

/**
 * DELETE /api/v1/enrollments/:id
 * Hard delete an enrollment. Proprietor only.
 */
router.delete(
  '/:id',
  requireProprietor,
  validateParams(enrollmentIdParamSchema),
  enrollmentController.delete
);

export default router;
