import { Request, Response, NextFunction } from 'express';
import { ResultStatus } from '@prisma/client';
import { resultService } from '../services/result.service';
import { auditLogService } from '../services/audit-log.service';
import { notificationService } from '../services/notification.service';
import { prisma } from '../config/database';
import { successResponse } from '../utils/response';
import type {
  UpsertResultInput,
  UpdateResultInput,
  BulkSaveDraftInput,
  BulkSubmitInput,
} from '../validators/result.validator';

const VALID_STATUS: ResultStatus[] = ['DRAFT', 'SUBMITTED', 'LOCKED'];

function pickFilters(req: Request) {
  const filters: {
    studentId?: string;
    subjectId?: string;
    sequenceId?: string;
    sessionId?: string;
    classId?: string;
    status?: ResultStatus;
  } = {};
  if (req.query.studentId) filters.studentId = String(req.query.studentId);
  if (req.query.subjectId) filters.subjectId = String(req.query.subjectId);
  if (req.query.sequenceId) filters.sequenceId = String(req.query.sequenceId);
  if (req.query.sessionId) filters.sessionId = String(req.query.sessionId);
  if (req.query.classId) filters.classId = String(req.query.classId);
  if (req.query.status) {
    const s = String(req.query.status) as ResultStatus;
    if (!VALID_STATUS.includes(s)) {
      return { error: `Invalid status. Allowed: ${VALID_STATUS.join(', ')}` };
    }
    filters.status = s;
  }
  return { filters };
}

export const resultController = {
  /**
   * GET /api/v1/results?studentId=&subjectId=&sequenceId=&sessionId=&classId=&status=
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = pickFilters(req);
      if ('error' in result) {
        res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: result.error,
          statusCode: 400,
        });
        return;
      }
      const results = await resultService.getResults(result.filters);
      res.status(200).json(successResponse(results));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/results/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const r = await resultService.getResultById(String(req.params.id));
      res.status(200).json(successResponse(r));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/results
   * Create or update a single result.
   */
  async upsert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpsertResultInput;
      const r = await resultService.upsertResult(input);
      res.status(200).json(successResponse(r, 'Result saved'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/results/:id
   * Update an existing result. Refuses if LOCKED.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateResultInput;
      const r = await resultService.updateResult(String(req.params.id), input);
      res.status(200).json(successResponse(r, 'Result updated'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/results/bulk-draft
   * Body: { results: [{ studentId, subjectId, sequenceId, score, total }] }
   * Saves each as a DRAFT.
   */
  async bulkDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as BulkSaveDraftInput;
      const result = await resultService.bulkSaveDraft(input);
      const message =
        result.skipped > 0
          ? `Saved ${result.saved} draft(s), ${result.skipped} skipped (locked or no enrollment)`
          : `Saved ${result.saved} draft(s)`;
      res.status(200).json(successResponse(result, message));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/results/bulk-submit
   * Body: { sequenceId, results: [{ studentId, subjectId, score, total, enrollmentId? }] }
   * Saves each as SUBMITTED. Pushes a notification to the proprietor.
   */
  async bulkSubmit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as BulkSubmitInput;
      const result = await resultService.bulkSubmit(input);
      const message =
        result.skipped > 0
          ? `Submitted ${result.submitted} result(s), ${result.skipped} skipped`
          : `Submitted ${result.submitted} result(s)`;
      res.status(200).json(successResponse(result, message));

      // Audit + notification (fire-and-forget; do not block the response)
      if (req.user && result.submitted > 0) {
        auditLogService.log({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'RESULT_BULK_SUBMIT',
          entityType: 'Sequence',
          entityId: input.sequenceId,
          payload: {
            submitted: result.submitted,
            skipped: result.skipped,
            studentCount: input.results.length,
          },
          ip: req.ip,
          userAgent: req.get('user-agent') ?? undefined,
        }).catch(() => {});

        // Push a notification to every proprietor user so they see the
        // "results ready for review" event on the bell.
        notifyAllProprietors(
          'Results submitted',
          `${req.user.email} submitted ${result.submitted} result(s) for review`,
          `/results?sequenceId=${input.sequenceId}`
        ).catch(() => {});
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/results/sequence/:sequenceId/lock
   * Lock all submitted results in a sequence. Proprietor only. Logs
   * the action and notifies the teacher who submitted them.
   */
  async lockSequence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await resultService.lockSequence(String(req.params.sequenceId));
      res.status(200).json(successResponse(result, `Locked ${result.locked} result(s)`));

      if (req.user) {
        auditLogService.log({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'RESULT_SEQUENCE_LOCK',
          entityType: 'Sequence',
          entityId: String(req.params.sequenceId),
          payload: { locked: result.locked },
          ip: req.ip,
          userAgent: req.get('user-agent') ?? undefined,
        }).catch(() => {});
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/results/sequence/:sequenceId/unlock
   * Unlock all locked results in a sequence. Proprietor only.
   */
  async unlockSequence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await resultService.unlockSequence(String(req.params.sequenceId));
      res.status(200).json(successResponse(result, `Unlocked ${result.unlocked} result(s)`));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/results/status-counts?sessionId=
   * Global counts by status. Useful for dashboards.
   */
  async getStatusCounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.query.sessionId ? String(req.query.sessionId) : undefined;
      const counts = await resultService.getStatusCounts(sessionId);
      res.status(200).json(successResponse(counts));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/results/sequence/:sequenceId/status
   * Per-sequence status counts.
   */
  async getSequenceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const counts = await resultService.getSequenceStatusCounts(
        String(req.params.sequenceId)
      );
      res.status(200).json(successResponse(counts));
    } catch (error) {
      next(error);
    }
  },
};

/**
 * Helper: push the same notification to every user with role=PROPRIETOR.
 * Best-effort; swallows errors so it never breaks the caller.
 */
async function notifyAllProprietors(
  title: string,
  body: string,
  link?: string
): Promise<void> {
  const proprietors = await prisma.user.findMany({
    where: { role: 'PROPRIETOR' },
    select: { id: true },
  });
  await Promise.all(
    proprietors.map((u: { id: string }) =>
      notificationService.push({ userId: u.id, title, body, link })
    )
  );
}
