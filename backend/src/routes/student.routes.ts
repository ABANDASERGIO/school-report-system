import { Router } from 'express';
import { studentController } from '../controllers/student.controller';
import { authenticate, requireProprietor } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import {
  createStudentSchema,
  updateStudentSchema,
  studentIdParamSchema,
  studentQuerySchema,
} from '../validators/student.validator';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/students/search?q=...
 * Search students. Must come BEFORE /:id.
 */
router.get(
  '/search',
  validateQuery(studentQuerySchema),
  studentController.search
);

/**
 * GET /api/v1/students
 * List all students.
 */
router.get('/', studentController.list);

/**
 * GET /api/v1/students/:id
 * Get a single student.
 */
router.get(
  '/:id',
  validateParams(studentIdParamSchema),
  studentController.getById
);

/**
 * POST /api/v1/students
 * Register a new student. Optionally creates an active enrollment in the
 * same call (body.enrollment = { classId, sessionId }). Proprietor only.
 */
router.post(
  '/',
  requireProprietor,
  validateBody(createStudentSchema),
  studentController.create
);

/**
 * PATCH /api/v1/students/:id
 * Update a student. Proprietor only.
 */
router.patch(
  '/:id',
  requireProprietor,
  validateParams(studentIdParamSchema),
  validateBody(updateStudentSchema),
  studentController.update
);

/**
 * DELETE /api/v1/students/:id
 * Soft-delete a student. Proprietor only.
 */
router.delete(
  '/:id',
  requireProprietor,
  validateParams(studentIdParamSchema),
  studentController.delete
);

export default router;
