import { Request, Response, NextFunction } from 'express';
import { auditLogService } from '../services/audit-log.service';
import { successResponse } from '../utils/response';
import { ApiErrorClass } from '../utils/response';

export const auditLogController = {
  /**
   * GET /api/v1/audit-logs?userId=&entityType=&entityId=&action=&limit=
   * List audit log entries. Proprietor only.
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'PROPRIETOR') {
        throw new ApiErrorClass(
          403,
          'Only the proprietor can view audit logs',
          'Forbidden'
        );
      }
      const filters: {
        userId?: string;
        entityType?: string;
        entityId?: string;
        action?: string;
        limit?: number;
      } = {};
      if (req.query.userId) filters.userId = String(req.query.userId);
      if (req.query.entityType) filters.entityType = String(req.query.entityType);
      if (req.query.entityId) filters.entityId = String(req.query.entityId);
      if (req.query.action) filters.action = String(req.query.action);
      if (req.query.limit) {
        const n = parseInt(String(req.query.limit), 10);
        if (!isNaN(n)) filters.limit = n;
      }

      const entries = await auditLogService.list(filters);
      res.status(200).json(successResponse(entries));
    } catch (error) {
      next(error);
    }
  },
};
