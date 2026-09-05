import { Request, Response, NextFunction } from 'express';
import { termService } from '../services/term.service';
import { successResponse } from '../utils/response';
import type { CreateTermInput, UpdateTermInput } from '../validators/term.validator';

export const termController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.query.sessionId as string | undefined;
      const terms = await termService.getTerms(sessionId);
      res.status(200).json(successResponse(terms));
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const term = await termService.getTermById(String(req.params.id));
      res.status(200).json(successResponse(term));
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateTermInput;
      const term = await termService.createTerm(input);
      res.status(201).json(successResponse(term, 'Term created'));
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateTermInput;
      const term = await termService.updateTerm(String(req.params.id), input);
      res.status(200).json(successResponse(term, 'Term updated'));
    } catch (error) {
      next(error);
    }
  },

  async setCurrent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.query.sessionId as string | undefined;
      if (!sessionId) {
        res.status(400).json({ success: false, error: 'ValidationError', message: 'sessionId query parameter is required', statusCode: 400 });
        return;
      }
      const term = await termService.setCurrentTerm(String(req.params.id), sessionId);
      res.status(200).json(successResponse(term, 'Current term updated'));
    } catch (error) {
      next(error);
    }
  },
};
