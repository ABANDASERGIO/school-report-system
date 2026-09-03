import type { Result, MarkEntryRequest, SubmitResultsRequest } from '@/types';
import { ResultStatus } from '@/types/enums';
import { apiClient } from '@/lib/api-client';

export type ResultWithRelations = Result & {
  student?: { id: string; firstName: string; lastName: string; studentNumber: string };
  subject?: { id: string; name: string; code: string; coefficient: number };
  sequence?: { id: string; name: string; number: number };
  enrollment?: { id: string; classId: string };
};

export interface SequenceStatusCounts {
  total: number;
  drafted: number;
  submitted: number;
  locked: number;
}

function buildQuery(filters: {
  studentId?: string;
  subjectId?: string;
  sequenceId?: string;
  sessionId?: string;
  classId?: string;
  status?: ResultStatus;
}): string {
  const params = new URLSearchParams();
  if (filters.studentId) params.set('studentId', filters.studentId);
  if (filters.subjectId) params.set('subjectId', filters.subjectId);
  if (filters.sequenceId) params.set('sequenceId', filters.sequenceId);
  if (filters.sessionId) params.set('sessionId', filters.sessionId);
  if (filters.classId) params.set('classId', filters.classId);
  if (filters.status) params.set('status', filters.status);
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const resultService = {
  /**
   * List results. Optional filters. Used by the Results page (filtered by
   * sequence) and the dashboard (filtered by teacher/class).
   */
  async getResults(sequenceId?: string): Promise<Result[]> {
    return apiClient.get<ResultWithRelations[]>(
      `/results${buildQuery({ sequenceId })}`
    );
  },

  async getResultsByStudent(studentId: string): Promise<Result[]> {
    return apiClient.get<ResultWithRelations[]>(
      `/results${buildQuery({ studentId })}`
    );
  },

  async getResultsBySubjectAndSequence(
    subjectId: string,
    sequenceId: string
  ): Promise<Result[]> {
    return apiClient.get<ResultWithRelations[]>(
      `/results${buildQuery({ subjectId, sequenceId })}`
    );
  },

  async getResultsByClassAndSession(
    classId: string,
    sessionId: string
  ): Promise<Result[]> {
    return apiClient.get<ResultWithRelations[]>(
      `/results${buildQuery({ classId, sessionId })}`
    );
  },

  async getResultById(id: string): Promise<Result | undefined> {
    try {
      return await apiClient.get<ResultWithRelations>(`/results/${id}`);
    } catch {
      return undefined;
    }
  },

  /**
   * Save a single mark as a DRAFT. Uses the upsert endpoint; creates
   * the row if it doesn't exist, updates the score otherwise.
   */
  async saveDraft(data: MarkEntryRequest): Promise<Result> {
    return apiClient.post<Result>('/results', { ...data, status: ResultStatus.DRAFT });
  },

  /**
   * Submit a whole sequence of marks at once. Backend upserts each as
   * SUBMITTED.
   */
  async submitResults(data: SubmitResultsRequest): Promise<{ submitted: number; skipped: number }> {
    return apiClient.post<{ submitted: number; skipped: number }>('/results/bulk-submit', data);
  },

  /**
   * Bulk save drafts. Mirrors `submitResults` but with status=DRAFT.
   */
  async bulkSaveDraft(
    results: MarkEntryRequest[]
  ): Promise<{ saved: number; skipped: number }> {
    return apiClient.post<{ saved: number; skipped: number }>('/results/bulk-draft', {
      results,
    });
  },

  /**
   * Lock all submitted results for a sequence (proprietor only).
   */
  async lockResults(sequenceId: string): Promise<{ locked: number }> {
    return apiClient.post<{ locked: number }>(`/results/sequence/${sequenceId}/lock`);
  },

  /**
   * Unlock a sequence (proprietor only).
   */
  async unlockResults(sequenceId: string): Promise<{ unlocked: number }> {
    return apiClient.post<{ unlocked: number }>(`/results/sequence/${sequenceId}/unlock`);
  },

  /**
   * Count of DRAFT results across the system (or in a session).
   */
  async getPendingResultsCount(sessionId?: string): Promise<number> {
    const counts = await apiClient.get<{ draft: number; submitted: number; locked: number }>(
      `/results/status-counts${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`
    );
    return counts.draft;
  },

  /**
   * Count of SUBMITTED results across the system (or in a session).
   */
  async getSubmittedResultsCount(sessionId?: string): Promise<number> {
    const counts = await apiClient.get<{ draft: number; submitted: number; locked: number }>(
      `/results/status-counts${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`
    );
    return counts.submitted;
  },

  /**
   * Per-sequence status breakdown. Used by the Results page to show
   * "submitted/locked" progress for the selected sequence.
   */
  async getSequenceResultsStatus(sequenceId: string): Promise<SequenceStatusCounts> {
    return apiClient.get<SequenceStatusCounts>(`/results/sequence/${sequenceId}/status`);
  },
};
