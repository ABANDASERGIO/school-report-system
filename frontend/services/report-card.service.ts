import type {
  ReportCardData,
  ReportCardType,
  SubjectResult,
} from '@/types';
import { apiClient } from '@/lib/api-client';

function buildQuery(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export const reportCardService = {
  /**
   * Generate a report card for a single student. `classId` is optional
   * and accepted for API symmetry; the backend uses the student's active
   * enrollment to determine the class.
   */
  async generateReportCard(
    type: ReportCardType,
    studentId: string,
    classId?: string,
    sessionId?: string
  ): Promise<ReportCardData> {
    if (!studentId) {
      throw new Error('studentId is required');
    }
    if (!sessionId) {
      throw new Error('sessionId is required');
    }
    return apiClient.get<ReportCardData>(
      `/report-cards${buildQuery({ studentId, classId, sessionId, type })}`
    );
  },

  /**
   * Generate report cards for all students in a class+session. Returns
   * an array of report cards (one per active student).
   */
  async generateBulkReportCards(
    type: ReportCardType,
    classId: string,
    sessionId: string
  ): Promise<ReportCardData[]> {
    return apiClient.get<ReportCardData[]>(
      `/report-cards/bulk${buildQuery({ classId, sessionId, type })}`
    );
  },

  /**
   * Get the per-sequence breakdown for one subject for a student. The
   * frontend uses this when the user clicks a subject row in a
   * detailed view.
   */
  async getSubjectReport(
    studentId: string,
    subjectId: string,
    sessionId: string
  ): Promise<SubjectResult | null> {
    try {
      return await apiClient.get<SubjectResult>(
        `/report-cards/subject${buildQuery({ studentId, subjectId, sessionId })}`
      );
    } catch {
      return null;
    }
  },

  /**
   * Local grade helper (mirrors the backend's grading scale). Used by
   * the UI for instant feedback.
   */
  getGradeInfo(score: number): { grade: string; remark: string } {
    if (score >= 16) return { grade: 'A', remark: 'Excellent' };
    if (score >= 14) return { grade: 'B', remark: 'Very Good' };
    if (score >= 12) return { grade: 'C', remark: 'Good' };
    if (score >= 10) return { grade: 'D', remark: 'Fair' };
    if (score >= 8) return { grade: 'E', remark: 'Weak' };
    return { grade: 'F', remark: 'Poor' };
  },
};
