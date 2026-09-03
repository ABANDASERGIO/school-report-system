import { Request, Response, NextFunction } from 'express';
import { assignmentService } from '../services/assignment.service';
import { successResponse } from '../utils/response';
import type {
  CreateAssignmentInput,
  UpdateAssignmentInput,
  BulkCreateAssignmentsInput,
} from '../validators/assignment.validator';

export const assignmentController = {
  /**
   * GET /api/v1/assignments?teacherId=&classId=&subjectId=&sessionId=
   * List assignments with optional filters. Authenticated users.
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: {
        teacherId?: string;
        classId?: string;
        subjectId?: string;
        sessionId?: string;
      } = {};
      if (req.query.teacherId) filters.teacherId = String(req.query.teacherId);
      if (req.query.classId) filters.classId = String(req.query.classId);
      if (req.query.subjectId) filters.subjectId = String(req.query.subjectId);
      if (req.query.sessionId) filters.sessionId = String(req.query.sessionId);

      const assignments = await assignmentService.getAssignments(filters);
      res.status(200).json(successResponse(assignments));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/assignments/:id
   * Get a single assignment.
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const a = await assignmentService.getAssignmentById(String(req.params.id));
      res.status(200).json(successResponse(a));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/assignments/teacher/:teacherId
   * All assignments for a teacher (across sessions). Must come before /:id.
   */
  async getByTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = String(req.params.teacherId);
      const sessionId = req.query.sessionId ? String(req.query.sessionId) : undefined;
      const assignments = sessionId
        ? await assignmentService.getAssignmentsByTeacherAndSession(teacherId, sessionId)
        : await assignmentService.getAssignmentsByTeacher(teacherId);
      res.status(200).json(successResponse(assignments));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/assignments/class/:classId
   * All assignments for a class. Must come before /:id.
   */
  async getByClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assignments = await assignmentService.getAssignmentsByClass(
        String(req.params.classId)
      );
      res.status(200).json(successResponse(assignments));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/assignments
   * Create a single assignment. Proprietor only.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateAssignmentInput;
      const a = await assignmentService.createAssignment(input);
      res.status(201).json(successResponse(a, 'Assignment created successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/assignments/bulk
   * Bulk create. Body: { assignments: [{ teacherId, classId, subjectId, sessionId }, ...] }
   * Returns { created, skipped, createdIds }. Proprietor only.
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as BulkCreateAssignmentsInput;
      const result = await assignmentService.bulkCreateAssignments(input);
      const message =
        result.skipped > 0
          ? `Created ${result.created} assignment(s), ${result.skipped} skipped (already existed)`
          : `Created ${result.created} assignment(s)`;
      res.status(201).json(successResponse(result, message));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/assignments/:id
   * Update an assignment. Proprietor only.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateAssignmentInput;
      const a = await assignmentService.updateAssignment(String(req.params.id), input);
      res.status(200).json(successResponse(a, 'Assignment updated successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/assignments/:id
   * Delete an assignment. Proprietor only.
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await assignmentService.deleteAssignment(String(req.params.id));
      res.status(200).json(successResponse(null, 'Assignment removed'));
    } catch (error) {
      next(error);
    }
  },
};
