import { Router } from 'express';
import { z } from 'zod';
import { subjectController } from '../controllers/subject.controller';
import { authenticate, requireProprietor } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import {
  createSubjectSchema,
  updateSubjectSchema,
  subjectIdParamSchema,
  subjectQuerySchema,
  assignSubjectsToClassSchema,
} from '../validators/subject.validator';

const classIdParamSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
});

const router = Router();

// All subject routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/subjects/search?q=...
 * Search subjects. Must come BEFORE /:id routes.
 */
router.get(
  '/search',
  validateQuery(subjectQuerySchema),
  subjectController.search
);

/**
 * GET /api/v1/subjects/class/:classId
 * Get the subject IDs assigned to a class. Must come BEFORE /:id routes.
 */
router.get(
  '/class/:classId',
  validateParams(classIdParamSchema),
  subjectController.getSubjectsForClass
);

/**
 * PUT /api/v1/subjects/class/:classId
 * Replace subjects for a class. Proprietor only.
 */
router.put(
  '/class/:classId',
  requireProprietor,
  validateParams(classIdParamSchema),
  validateBody(assignSubjectsToClassSchema),
  subjectController.setSubjectsForClass
);

/**
 * GET /api/v1/subjects
 * List all subjects.
 */
router.get('/', subjectController.list);

/**
 * GET /api/v1/subjects/:id
 * Get a single subject.
 */
router.get(
  '/:id',
  validateParams(subjectIdParamSchema),
  subjectController.getById
);

/**
 * GET /api/v1/subjects/:id/classes
 * Get the class IDs a subject is assigned to.
 */
router.get(
  '/:id/classes',
  validateParams(subjectIdParamSchema),
  subjectController.getClassesForSubject
);

/**
 * POST /api/v1/subjects
 * Create a new subject. Proprietor only.
 */
router.post(
  '/',
  requireProprietor,
  validateBody(createSubjectSchema),
  subjectController.create
);

/**
 * PATCH /api/v1/subjects/:id
 * Update a subject. Proprietor only.
 */
router.patch(
  '/:id',
  requireProprietor,
  validateParams(subjectIdParamSchema),
  validateBody(updateSubjectSchema),
  subjectController.update
);

/**
 * DELETE /api/v1/subjects/:id
 * Delete a subject. Proprietor only.
 */
router.delete(
  '/:id',
  requireProprietor,
  validateParams(subjectIdParamSchema),
  subjectController.delete
);

export default router;
