import type { Result, MarkEntryRequest, SubmitResultsRequest } from '@/types';
import { ResultStatus } from '@/types/enums';
import { apiClient } from '@/lib/api-client';
import { isOnline } from '@/lib/sync/connectivity';
import { enqueueAndDrain, drainNow } from '@/lib/sync/sync-engine';
import { putResult, getResultByCell, getResultsBySequence, getDirtyResults } from '@/lib/db/repos/results.repo';
import type { DBResult } from '@/lib/db/schema';

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

export const resultService = {
  /**
   * List results. Optional filters.
   * If online: fetch from API and refresh IDB.
   * If offline: read from IDB.
   */
  async getResults(sequenceId?: string): Promise<Result[]> {
    if (isOnline()) {
      try {
        const data = await apiClient.get<ResultWithRelations[]>(
          `/results${sequenceId ? `?sequenceId=${encodeURIComponent(sequenceId)}` : ''}`
        );
        // refresh IDB in background
        for (const r of data) {
          await putResult(toDbResult(r));
        }
        return data;
      } catch {
        // fallback to IDB on network error
      }
    }
    const all = await getResultsBySequence(sequenceId || '');
    return all.map(toApiResult);
  },

  async getResultsByStudent(studentId: string): Promise<Result[]> {
    if (isOnline()) {
      try {
        const data = await apiClient.get<ResultWithRelations[]>(`/results?studentId=${studentId}`);
        for (const r of data) await putResult(toDbResult(r));
        return data;
      } catch {
        // fallback
      }
    }
    const all = await (await import('@/lib/db/repos/results.repo')).getAllResults();
    return all.filter((r) => r.studentId === studentId).map(toApiResult);
  },

  async getResultsBySubjectAndSequence(
    subjectId: string,
    sequenceId: string
  ): Promise<Result[]> {
    if (isOnline()) {
      try {
        const data = await apiClient.get<ResultWithRelations[]>(
          `/results?subjectId=${subjectId}&sequenceId=${sequenceId}`
        );
        for (const r of data) await putResult(toDbResult(r));
        return data;
      } catch {
        // fallback
      }
    }
    const all = await getResultsBySequence(sequenceId);
    return all.filter((r) => r.subjectId === subjectId).map(toApiResult);
  },

  async getResultsByClassAndSession(
    classId: string,
    sessionId: string
  ): Promise<Result[]> {
    if (isOnline()) {
      try {
        const data = await apiClient.get<ResultWithRelations[]>(
          `/results?classId=${classId}&sessionId=${sessionId}`
        );
        for (const r of data) await putResult(toDbResult(r));
        return data;
      } catch {
        // fallback
      }
    }
    const all = await (await import('@/lib/db/repos/results.repo')).getAllResults();
    return all.filter((r) => r.sessionId === sessionId).map(toApiResult);
  },

  async getResultById(id: string): Promise<Result | undefined> {
    if (isOnline()) {
      try {
        const data = await apiClient.get<ResultWithRelations>(`/results/${id}`);
        await putResult(toDbResult(data));
        return data;
      } catch {
        // fallback
      }
    }
    const r = await (await import('@/lib/db/indexeddb')).idbGet<DBResult>('results', id);
    return r ? toApiResult(r) : undefined;
  },

  /**
   * Save a single mark as a DRAFT.
   * If online: POST to backend + write-through to IDB.
   * If offline: write to IDB + enqueue for later sync.
   */
  async saveDraft(data: MarkEntryRequest & { idempotencyKey?: string | null }): Promise<Result> {
    if (isOnline()) {
      try {
        const r = await apiClient.post<Result>('/results', { ...data, status: ResultStatus.DRAFT });
        await putResult(toDbResult(r));
        return r;
      } catch (err) {
        // network failed — fall through to offline path
      }
    }

    const clientOpId = data.idempotencyKey || crypto.randomUUID();
    const existing = await getResultByCell(data.studentId, data.subjectId, data.sequenceId, data.sessionId);
    const dbRow: DBResult = {
      id: existing?.id || crypto.randomUUID(),
      studentId: data.studentId,
      subjectId: data.subjectId,
      sequenceId: data.sequenceId,
      enrollmentId: data.enrollmentId,
      sessionId: data.sessionId,
      score: data.score ?? null,
      total: data.total,
      status: ResultStatus.DRAFT,
      submittedAt: null,
      dirty: 1,
      pendingOpId: clientOpId,
      syncedAt: new Date().toISOString(),
      studentName: existing?.studentName,
      studentNumber: existing?.studentNumber,
    };
    await putResult(dbRow);
    await enqueueAndDrain({
      op: 'saveDraft',
      endpoint: '/results',
      method: 'POST',
      body: { ...data, status: ResultStatus.DRAFT, idempotencyKey: clientOpId },
      idempotencyKey: clientOpId,
    });
    return toApiResult(dbRow);
  },

  /**
   * Submit a whole sequence of marks at once.
   * If online: POST to backend.
   * If offline: write each as SUBMITTED in IDB + enqueue N individual
   * sync items (we can't atomically retry a bulk request safely).
   */
  async submitResults(data: SubmitResultsRequest & { results?: (MarkEntryRequest & { idempotencyKey?: string | null })[] }): Promise<{ submitted: number; skipped: number }> {
    if (isOnline()) {
      try {
        const r = await apiClient.post<{ submitted: number; skipped: number }>('/results/bulk-submit', {
          sequenceId: data.sequenceId,
          results: data.results.map((r) => ({
            studentId: r.studentId,
            subjectId: r.subjectId,
            sequenceId: r.sequenceId,
            enrollmentId: r.enrollmentId,
            score: r.score,
            total: r.total,
          })),
        });
        // refresh IDB
        const refreshed = await apiClient.get<ResultWithRelations[]>(
          `/results?sequenceId=${data.sequenceId}`
        );
        for (const row of refreshed) await putResult(toDbResult(row));
        return r;
      } catch {
        // fall through to offline path
      }
    }

    let submitted = 0;
    for (const r of (data.results || [])) {
      const clientOpId = r.idempotencyKey || crypto.randomUUID();
      const existing = await getResultByCell(r.studentId, r.subjectId, r.sequenceId, r.sessionId);
      const dbRow: DBResult = {
        id: existing?.id || crypto.randomUUID(),
        studentId: r.studentId,
        subjectId: r.subjectId,
        sequenceId: r.sequenceId,
        enrollmentId: r.enrollmentId,
        sessionId: r.sessionId,
        score: r.score ?? null,
        total: r.total,
        status: ResultStatus.SUBMITTED,
        submittedAt: new Date().toISOString(),
        dirty: 1,
        pendingOpId: clientOpId,
        syncedAt: new Date().toISOString(),
        studentName: existing?.studentName,
        studentNumber: existing?.studentNumber,
      };
      await putResult(dbRow);
      await enqueueAndDrain({
        op: 'submitResult',
        endpoint: '/results',
        method: 'POST',
        body: {
          studentId: r.studentId,
          subjectId: r.subjectId,
          sequenceId: r.sequenceId,
          enrollmentId: r.enrollmentId,
          score: r.score,
          total: r.total,
          status: ResultStatus.SUBMITTED,
          idempotencyKey: clientOpId,
        },
        idempotencyKey: clientOpId,
      });
      submitted++;
    }
    return { submitted, skipped: 0 };
  },

  /**
   * Bulk save drafts. Mirrors `submitResults` but with status=DRAFT.
   */
  async bulkSaveDraft(
    results: (MarkEntryRequest & { idempotencyKey?: string | null })[]
  ): Promise<{ saved: number; skipped: number }> {
    if (isOnline()) {
      try {
        const r = await apiClient.post<{ saved: number; skipped: number }>('/results/bulk-draft', {
          results: results.map((r) => ({
            studentId: r.studentId,
            subjectId: r.subjectId,
            sequenceId: r.sequenceId,
            enrollmentId: r.enrollmentId,
            score: r.score,
            total: r.total,
            idempotencyKey: r.idempotencyKey,
          })),
        });
        return r;
      } catch {
        // fall through
      }
    }

    let saved = 0;
    for (const r of results) {
      const clientOpId = r.idempotencyKey || crypto.randomUUID();
      const existing = await getResultByCell(r.studentId, r.subjectId, r.sequenceId, r.sessionId);
      const dbRow: DBResult = {
        id: existing?.id || crypto.randomUUID(),
        studentId: r.studentId,
        subjectId: r.subjectId,
        sequenceId: r.sequenceId,
        enrollmentId: r.enrollmentId,
        sessionId: r.sessionId,
        score: r.score ?? null,
        total: r.total,
        status: ResultStatus.DRAFT,
        submittedAt: null,
        dirty: 1,
        pendingOpId: clientOpId,
        syncedAt: new Date().toISOString(),
        studentName: existing?.studentName,
        studentNumber: existing?.studentNumber,
      };
      await putResult(dbRow);
      await enqueueAndDrain({
        op: 'saveDraft',
        endpoint: '/results',
        method: 'POST',
        body: { ...r, status: ResultStatus.DRAFT, idempotencyKey: clientOpId },
        idempotencyKey: clientOpId,
      });
      saved++;
    }
    return { saved, skipped: 0 };
  },

  async lockResults(sequenceId: string): Promise<{ locked: number }> {
    if (!isOnline()) throw new Error('Cannot lock results while offline');
    return apiClient.post<{ locked: number }>(`/results/sequence/${sequenceId}/lock`);
  },

  async unlockResults(sequenceId: string): Promise<{ unlocked: number }> {
    if (!isOnline()) throw new Error('Cannot unlock results while offline');
    return apiClient.post<{ unlocked: number }>(`/results/sequence/${sequenceId}/unlock`);
  },

  async getPendingResultsCount(sessionId?: string): Promise<number> {
    if (isOnline()) {
      try {
        const data = await apiClient.get<{ draft: number; submitted: number; locked: number }>(
          `/results/status-counts${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`
        );
        return data.draft;
      } catch {
        // fallback
      }
    }
    const all = await (await import('@/lib/db/repos/results.repo')).getAllResults();
    return all.filter((r) => r.status === 'DRAFT').length;
  },

  async getSubmittedResultsCount(sessionId?: string): Promise<number> {
    if (isOnline()) {
      try {
        const data = await apiClient.get<{ draft: number; submitted: number; locked: number }>(
          `/results/status-counts${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`
        );
        return data.submitted;
      } catch {
        // fallback
      }
    }
    const all = await (await import('@/lib/db/repos/results.repo')).getAllResults();
    return all.filter((r) => r.status === 'SUBMITTED').length;
  },

  async getSequenceResultsStatus(sequenceId: string): Promise<SequenceStatusCounts> {
    if (isOnline()) {
      try {
        return apiClient.get<SequenceStatusCounts>(`/results/sequence/${sequenceId}/status`);
      } catch {
        // fallback
      }
    }
    const all = await getResultsBySequence(sequenceId);
    return {
      total: all.length,
      drafted: all.filter((r) => r.status === 'DRAFT').length,
      submitted: all.filter((r) => r.status === 'SUBMITTED').length,
      locked: all.filter((r) => r.status === 'LOCKED').length,
    };
  },
};

function toDbResult(r: Result): DBResult {
  return {
    id: r.id,
    studentId: r.studentId,
    subjectId: r.subjectId,
    sequenceId: r.sequenceId,
    enrollmentId: r.enrollmentId,
    sessionId: r.sessionId,
    score: r.score ?? null,
    total: r.total,
    status: r.status,
    submittedAt: r.submittedAt ?? null,
    dirty: 0,
    pendingOpId: undefined,
    syncedAt: new Date().toISOString(),
  };
}

function toApiResult(r: DBResult): Result {
  return {
    id: r.id,
    studentId: r.studentId,
    subjectId: r.subjectId,
    sequenceId: r.sequenceId,
    enrollmentId: r.enrollmentId,
    sessionId: r.sessionId,
    score: r.score,
    total: r.total,
    status: r.status as ResultStatus,
    submittedAt: r.submittedAt || null,
    createdAt: '',
    updatedAt: '',
  };
}
