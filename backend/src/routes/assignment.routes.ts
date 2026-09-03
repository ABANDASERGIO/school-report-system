import { Router } from 'express';
import { z } from 'zod';
import { assignmentController } from '../controllers/assignment.controller';
import { authenticate, requireProprietor } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  assignmentIdParamSchema,
  assignmentQuerySchema,
  bulkCreateAssignmentsSchema,
} from '../validators/assignment.validator';

const teacherIdParamSchema = z.object({
  teacherId: z.string().uuid('Invalid teacher ID'),
});

const classIdParamSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
});

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/assignments/bulk
 * NOT a real route - bulk creation uses POST. Placeholder so route
 * ordering is explicit. (No-op; declared for documentation.)
 */

/**
 * GET /api/v1/assignments
 * List assignments with optional filters.
 */
router.get(
  '/',
  validateQuery(assignmentQuerySchema),
  assignmentController.list
);

/**
 * GET /api/v1/assignments/teacher/:teacherId?sessionId=
 * Assignments for a teacher, optionally filtered to a session.
 * Must come BEFORE /:id.
 */
router.get(
  '/teacher/:teacherId',
  validateParams(teacherIdParamSchema),
  assignmentController.getByTeacher
);

/**
 * GET /api/v1/assignments/class/:classId
 * Assignments for a class. Must come BEFORE /:id.
 */
router.get(
  '/class/:classId',
  validateParams(classIdParamSchema),
  assignmentController.getByClass
);

/**
 * GET /api/v1/assignments/:id
 * Get a single assignment.
 */
router.get(
  '/:id',
  validateParams(assignmentIdParamSchema),
  assignmentController.getById
);

/**
 * POST /api/v1/assignments/bulk
 * Bulk create. Must come BEFORE POST /.
 */
router.post(
  '/bulk',
  requireProprietor,
  validateBody(bulkCreateAssignmentsSchema),
  assignmentController.bulkCreate
);

/**
 * POST /api/v1/assignments
 * Create a single assignment. Proprietor only.
 */
router.post(
  '/',
  requireProprietor,
  validateBody(createAssignmentSchema),
  assignmentController.create
);

/**
 * PATCH /api/v1/assignments/:id
 * Update an assignment. Proprietor only.
 */
router.patch(
  '/:id',
  requireProprietor,
  validateParams(assignmentIdParamSchema),
  validateBody(updateAssignmentSchema),
  assignmentController.update
);

/**
 * DELETE /api/v1/assignments/:id
 * Delete an assignment. Proprietor only.
 */
router.delete(
  '/:id',
  requireProprietor,
  validateParams(assignmentIdParamSchema),
  assignmentController.delete
);

export default router;
