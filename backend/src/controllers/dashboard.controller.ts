import { Request, Response, NextFunction } from 'express';
import {
  buildProprietorDashboard,
  buildTeacherDashboard,
} from '../services/dashboard.service';
import { ApiErrorClass } from '../utils/response';
import { successResponse } from '../utils/response';

export const dashboardController = {
  /**
   * GET /api/v1/dashboard/proprietor
   * Returns the proprietor KPI summary. Requires an authenticated user
   * with role=PROPRIETOR.
   */
  async proprietor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiErrorClass(401, 'Authentication required', 'Unauthorized');
      }
      if (req.user.role !== 'PROPRIETOR') {
        throw new ApiErrorClass(
          403,
          'Only the proprietor can access this dashboard',
          'Forbidden'
        );
      }
      const data = await buildProprietorDashboard();
      res.status(200).json(successResponse(data));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/dashboard/teacher
   * Returns the KPI summary for the currently authenticated teacher.
   */
  async teacher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiErrorClass(401, 'Authentication required', 'Unauthorized');
      }
      if (req.user.role !== 'TEACHER') {
        throw new ApiErrorClass(
          403,
          'Only a teacher can access this dashboard',
          'Forbidden'
        );
      }
      const data = await buildTeacherDashboard(req.user.userId);
      res.status(200).json(successResponse(data));
    } catch (error) {
      next(error);
    }
  },
};
