import { Request, Response, NextFunction } from 'express';
import { subjectService } from '../services/subject.service';
import { successResponse } from '../utils/response';
import type {
  CreateSubjectInput,
  UpdateSubjectInput,
  AssignSubjectsToClassInput,
} from '../validators/subject.validator';

export const subjectController = {
  /**
   * GET /api/v1/subjects
   * List all subjects. Authenticated users.
   */
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjects = await subjectService.getSubjects();
      res.status(200).json(successResponse(subjects));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/subjects/search?q=...
   * Search subjects by name or code. Must come before /:id.
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q =
        (req.query.q as string) ||
        ((res.locals as Record<string, unknown>).query as { q?: string })?.q ||
        '';
      const subjects = await subjectService.searchSubjects(q);
      res.status(200).json(successResponse(subjects));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/subjects/:id
   * Get a single subject.
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subject = await subjectService.getSubjectById(String(req.params.id));
      res.status(200).json(successResponse(subject));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/subjects
   * Create a new subject. Proprietor only.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateSubjectInput;
      const subject = await subjectService.createSubject(input);
      res.status(201).json(successResponse(subject, 'Subject created successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/subjects/:id
   * Update a subject. Proprietor only.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateSubjectInput;
      const subject = await subjectService.updateSubject(String(req.params.id), input);
      res.status(200).json(successResponse(subject, 'Subject updated successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/subjects/:id
   * Delete a subject. Proprietor only. Refuses if in use.
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await subjectService.deleteSubject(String(req.params.id));
      res.status(200).json(successResponse(null, 'Subject deleted successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/subjects/class/:classId
   * Get the list of subject IDs assigned to a class.
   */
  async getSubjectsForClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ids = await subjectService.getSubjectIdsForClass(String(req.params.classId));
      res.status(200).json(successResponse(ids));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/subjects/:id/classes
   * Get the list of class IDs a subject is assigned to.
   */
  async getClassesForSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ids = await subjectService.getClassIdsForSubject(String(req.params.id));
      res.status(200).json(successResponse(ids));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/v1/subjects/class/:classId
   * Replace the set of subjects assigned to a class. Proprietor only.
   * Body: { subjectIds: string[] }
   */
  async setSubjectsForClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = (req.body || { subjectIds: [] }) as AssignSubjectsToClassInput;
      const ids = await subjectService.setSubjectsForClass(
        String(req.params.classId),
        input.subjectIds
      );
      res
        .status(200)
        .json(successResponse({ subjectIds: ids }, `Assigned ${ids.length} subject(s) to class`));
    } catch (error) {
      next(error);
    }
  },
};
