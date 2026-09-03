import { Request, Response, NextFunction } from 'express';
import { sequenceService } from '../services/sequence.service';
import { successResponse } from '../utils/response';
import type { CreateSequenceInput, UpdateSequenceInput } from '../validators/sequence.validator';

export const sequenceController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const termId = req.query.termId as string | undefined;
      const sequences = await sequenceService.getSequences(termId);
      res.status(200).json(successResponse(sequences));
    } catch (error) {
      next(error);
    }
  },

  async getActive(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seq = await sequenceService.getActiveSequence();
      res.status(200).json(successResponse(seq));
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seq = await sequenceService.getSequenceById(String(req.params.id));
      res.status(200).json(successResponse(seq));
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateSequenceInput;
      const seq = await sequenceService.createSequence(input);
      res.status(201).json(successResponse(seq, 'Sequence created'));
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateSequenceInput;
      const seq = await sequenceService.updateSequence(String(req.params.id), input);
      res.status(200).json(successResponse(seq, 'Sequence updated'));
    } catch (error) {
      next(error);
    }
  },

  async setActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seq = await sequenceService.setActiveSequence(String(req.params.id));
      res.status(200).json(successResponse(seq, 'Active sequence updated'));
    } catch (error) {
      next(error);
    }
  },
};
