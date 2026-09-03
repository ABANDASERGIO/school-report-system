import { Request, Response, NextFunction } from 'express';
import { Prisma, EnrollmentStatus } from '@prisma/client';
import { enrollmentService } from '../services/enrollment.service';
import { successResponse } from '../utils/response';
import type {
  CreateEnrollmentInput,
  UpdateEnrollmentInput,
} from '../validators/enrollment.validator';

export const enrollmentController = {
  /**
   * GET /api/v1/enrollments?sessionId=&classId=&studentId=&status=
   * List enrollments with optional filters. Authenticated users.
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: {
        sessionId?: string;
        classId?: string;
        studentId?: string;
        status?: EnrollmentStatus;
      } = {};
      if (req.query.sessionId) filters.sessionId = String(req.query.sessionId);
      if (req.query.classId) filters.classId = String(req.query.classId);
      if (req.query.studentId) filters.studentId = String(req.query.studentId);
      if (req.query.status) {
        const s = String(req.query.status);
        const allowed: EnrollmentStatus[] = [
          'ACTIVE',
          'WITHDRAWN',
          'TRANSFERRED',
          'GRADUATED',
          'REPEATER',
        ];
        if (!allowed.includes(s as EnrollmentStatus)) {
          res.status(400).json({
            success: false,
            error: 'ValidationError',
            message: `Invalid status. Allowed: ${allowed.join(', ')}`,
            statusCode: 400,
          });
          return;
        }
        filters.status = s as EnrollmentStatus;
      }
      const enrollments = await enrollmentService.getEnrollments(filters);
      res.status(200).json(successResponse(enrollments));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/enrollments/:id
   * Get a single enrollment.
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enrollment = await enrollmentService.getEnrollmentById(String(req.params.id));
      res.status(200).json(successResponse(enrollment));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/enrollments
   * Create a new enrollment. Proprietor only.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateEnrollmentInput;
      const enrollment = await enrollmentService.createEnrollment(input);
      res.status(201).json(successResponse(enrollment, 'Enrollment created successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/enrollments/:id
   * Update an enrollment (class change, status change, or date).
   * Proprietor only.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateEnrollmentInput;
      const enrollment = await enrollmentService.updateEnrollment(
        String(req.params.id),
        input
      );
      res.status(200).json(successResponse(enrollment, 'Enrollment updated successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/enrollments/:id/withdraw
   * Convenience: mark an enrollment as WITHDRAWN. Proprietor only.
   */
  async withdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enrollment = await enrollmentService.withdrawEnrollment(String(req.params.id));
      res.status(200).json(successResponse(enrollment, 'Enrollment withdrawn'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/enrollments/:id
   * Hard-delete an enrollment. Refuses if results exist. Proprietor only.
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await enrollmentService.deleteEnrollment(String(req.params.id));
      res.status(200).json(successResponse(null, 'Enrollment deleted'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/enrollments/by-student-session?studentId=...&sessionId=...
   * Convenience: withdraw all of a student's enrollments in a session.
   * Proprietor only.
   */
  async removeStudentFromSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = String(req.query.studentId || '');
      const sessionId = String(req.query.sessionId || '');
      if (!studentId || !sessionId) {
        res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'studentId and sessionId are required',
          statusCode: 400,
        });
        return;
      }
      const result = await enrollmentService.removeStudentFromSession(studentId, sessionId);
      res
        .status(200)
        .json(successResponse(result, `Withdrew ${result.withdrawn} enrollment(s)`));
    } catch (error) {
      next(error);
    }
  },
};
