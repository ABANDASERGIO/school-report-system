import { Request, Response, NextFunction } from 'express';
import { classService } from '../services/class.service';
import { successResponse } from '../utils/response';
import type { CreateClassInput, UpdateClassInput } from '../validators/class.validator';

export const classController = {
  /**
   * GET /api/v1/classes
   * List all classes. Authenticated users.
   */
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classes = await classService.getClasses();
      res.status(200).json(successResponse(classes));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/classes/search?q=...
   * Search classes by name or code. Must come before /:id.
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q =
        (req.query.q as string) ||
        ((res.locals as Record<string, unknown>).query as { q?: string })?.q ||
        '';
      const classes = await classService.searchClasses(q);
      res.status(200).json(successResponse(classes));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/classes/:id
   * Get a single class.
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cls = await classService.getClassById(String(req.params.id));
      res.status(200).json(successResponse(cls));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/classes
   * Create a new class. Proprietor only.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateClassInput;
      const cls = await classService.createClass(input);
      res.status(201).json(successResponse(cls, 'Class created successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/classes/:id
   * Update a class. Proprietor only.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateClassInput;
      const cls = await classService.updateClass(String(req.params.id), input);
      res.status(200).json(successResponse(cls, 'Class updated successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/classes/:id
   * Delete a class. Proprietor only. Refuses if in use.
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await classService.deleteClass(String(req.params.id));
      res.status(200).json(successResponse(null, 'Class deleted successfully'));
    } catch (error) {
      next(error);
    }
  },
};
