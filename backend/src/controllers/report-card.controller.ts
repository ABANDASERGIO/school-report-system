import { Request, Response, NextFunction } from 'express';
import { reportCardService } from '../services/report-card.service';
import { successResponse } from '../utils/response';

const VALID_TYPES = ['first-term', 'second-term', 'final'] as const;
type ReportCardType = (typeof VALID_TYPES)[number];

function pickType(value: unknown): ReportCardType {
  if (typeof value === 'string' && (VALID_TYPES as readonly string[]).includes(value)) {
    return value as ReportCardType;
  }
  return 'first-term';
}

export const reportCardController = {
  /**
   * GET /api/v1/report-cards?studentId=&sessionId=&type=
   * Build a single report card. studentId and sessionId are required.
   * Optional `classId` is accepted for compatibility but unused (the
   * active enrollment determines the class).
   */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = String(req.query.studentId || '');
      const sessionId = String(req.query.sessionId || '');
      const classId = req.query.classId ? String(req.query.classId) : undefined;
      const type = pickType(req.query.type);

      if (!studentId || !sessionId) {
        res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'studentId and sessionId are required',
          statusCode: 400,
        });
        return;
      }

      const report = await reportCardService.generateReportCard(
        type,
        studentId,
        classId,
        sessionId
      );
      res.status(200).json(successResponse(report));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/report-cards/bulk?classId=&sessionId=&type=
   * Build report cards for every active student in a class+session.
   */
  async getBulk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = String(req.query.classId || '');
      const sessionId = String(req.query.sessionId || '');
      const type = pickType(req.query.type);

      if (!classId || !sessionId) {
        res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'classId and sessionId are required',
          statusCode: 400,
        });
        return;
      }

      const reports = await reportCardService.generateBulkReportCards(
        type,
        classId,
        sessionId
      );
      res.status(200).json(successResponse(reports));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/report-cards/subject?studentId=&subjectId=&sessionId=
   * Single subject's per-sequence breakdown for the annual view.
   */
  async getSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = String(req.query.studentId || '');
      const subjectId = String(req.query.subjectId || '');
      const sessionId = String(req.query.sessionId || '');

      if (!studentId || !subjectId || !sessionId) {
        res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'studentId, subjectId, and sessionId are required',
          statusCode: 400,
        });
        return;
      }

      const subject = await reportCardService.getSubjectReport(
        studentId,
        subjectId,
        sessionId
      );
      if (!subject) {
        res.status(404).json({
          success: false,
          error: 'NotFound',
          message: 'No report data for this subject',
          statusCode: 404,
        });
        return;
      }
      res.status(200).json(successResponse(subject));
    } catch (error) {
      next(error);
    }
  },
};
