import { Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/session.service';
import { successResponse } from '../utils/response';
import type { CreateSessionInput, UpdateSessionInput } from '../validators/session.validator';

export const sessionController = {
  /**
   * GET /api/v1/sessions
   * List all academic sessions.
   */
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await sessionService.getSessions();
      res.status(200).json(successResponse(sessions));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/sessions/current
   * Get the current active session. Must come before /:id routes.
   */
  async getCurrent(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await sessionService.getCurrentSession();
      res.status(200).json(successResponse(session));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/sessions/has-sessions
   * Check if any session exists. Used for first-time setup.
   */
  async hasSessions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exists = await sessionService.hasSessions();
      res.status(200).json(successResponse({ exists }));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/sessions/:id
   * Get a single session.
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await sessionService.getSessionById(String(req.params.id));
      res.status(200).json(successResponse(session));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/sessions
   * Create a new academic session. Proprietor only.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateSessionInput;
      const session = await sessionService.createSession(input);
      res.status(201).json(successResponse(session, 'Academic session created'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/sessions/:id
   * Update a session. Proprietor only.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateSessionInput;
      const session = await sessionService.updateSession(String(req.params.id), input);
      res.status(200).json(successResponse(session, 'Session updated'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/sessions/:id/set-current
   * Mark a session as the current one. Proprietor only.
   */
  async setCurrent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await sessionService.setCurrentSession(String(req.params.id));
      res.status(200).json(successResponse(session, 'Current session updated'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/sessions/:id/carry-forward
   * Carry forward assignments from this session to another. Proprietor only.
   */
  async carryForward(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetSessionId } = req.body || {};
      if (!targetSessionId) {
        res.status(400).json({ success: false, error: 'ValidationError', message: 'targetSessionId is required', statusCode: 400 });
        return;
      }
      const result = await sessionService.carryForwardAssignments(
        String(req.params.id),
        String(targetSessionId)
      );
      res.status(200).json(successResponse(result, `Carried forward ${result.carried} assignments (${result.skipped} skipped)`));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/sessions/:id/archive
   * Archive a session (soft delete). Proprietor only.
   */
  async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await sessionService.archiveSession(String(req.params.id));
      res.status(200).json(successResponse(session, 'Session archived'));
    } catch (error) {
      next(error);
    }
  },
};
