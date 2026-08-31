import type { Result, MarkEntryRequest, SubmitResultsRequest } from "@/types";
import { ResultStatus } from "@/types/enums";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockResults: Result[] = [
  { id: "res-001", studentId: "stu-001", subjectId: "sub-001", sequenceId: "seq-001", enrollmentId: "enr-001", score: 15, total: 20, status: ResultStatus.SUBMITTED, submittedAt: "2026-10-20T10:30:00Z", createdAt: "2026-10-18T08:00:00Z", updatedAt: "2026-10-20T10:30:00Z" },
  { id: "res-002", studentId: "stu-002", subjectId: "sub-001", sequenceId: "seq-001", enrollmentId: "enr-002", score: 12, total: 20, status: ResultStatus.SUBMITTED, submittedAt: "2026-10-20T10:30:00Z", createdAt: "2026-10-18T08:00:00Z", updatedAt: "2026-10-20T10:30:00Z" },
  { id: "res-003", studentId: "stu-003", subjectId: "sub-001", sequenceId: "seq-001", enrollmentId: "enr-003", score: 17, total: 20, status: ResultStatus.SUBMITTED, submittedAt: "2026-10-20T10:30:00Z", createdAt: "2026-10-18T08:00:00Z", updatedAt: "2026-10-20T10:30:00Z" },
  { id: "res-004", studentId: "stu-001", subjectId: "sub-002", sequenceId: "seq-001", enrollmentId: "enr-001", score: 14, total: 20, status: ResultStatus.SUBMITTED, submittedAt: "2026-10-20T10:30:00Z", createdAt: "2026-10-18T08:00:00Z", updatedAt: "2026-10-20T10:30:00Z" },
  { id: "res-005", studentId: "stu-002", subjectId: "sub-002", sequenceId: "seq-001", enrollmentId: "enr-002", score: 10, total: 20, status: ResultStatus.SUBMITTED, submittedAt: "2026-10-20T10:30:00Z", createdAt: "2026-10-18T08:00:00Z", updatedAt: "2026-10-20T10:30:00Z" },
  { id: "res-006", studentId: "stu-003", subjectId: "sub-002", sequenceId: "seq-001", enrollmentId: "enr-003", score: 16, total: 20, status: ResultStatus.SUBMITTED, submittedAt: "2026-10-20T10:30:00Z", createdAt: "2026-10-18T08:00:00Z", updatedAt: "2026-10-20T10:30:00Z" },
  { id: "res-007", studentId: "stu-001", subjectId: "sub-001", sequenceId: "seq-002", enrollmentId: "enr-001", score: null, total: 20, status: ResultStatus.DRAFT, submittedAt: null, createdAt: "2026-11-01T08:00:00Z", updatedAt: "2026-11-01T08:00:00Z" },
  { id: "res-008", studentId: "stu-002", subjectId: "sub-001", sequenceId: "seq-002", enrollmentId: "enr-002", score: null, total: 20, status: ResultStatus.DRAFT, submittedAt: null, createdAt: "2026-11-01T08:00:00Z", updatedAt: "2026-11-01T08:00:00Z" },
  { id: "res-009", studentId: "stu-003", subjectId: "sub-001", sequenceId: "seq-002", enrollmentId: "enr-003", score: null, total: 20, status: ResultStatus.DRAFT, submittedAt: null, createdAt: "2026-11-01T08:00:00Z", updatedAt: "2026-11-01T08:00:00Z" },
];

export const resultService = {
  async getResults(sequenceId?: string): Promise<Result[]> {
    await delay(500);
    if (sequenceId) {
      return mockResults.filter((r) => r.sequenceId === sequenceId);
    }
    return [...mockResults];
  },

  async getResultsByStudent(studentId: string): Promise<Result[]> {
    await delay(400);
    return mockResults.filter((r) => r.studentId === studentId);
  },

  async getResultsBySubjectAndSequence(subjectId: string, sequenceId: string): Promise<Result[]> {
    await delay(400);
    return mockResults.filter((r) => r.subjectId === subjectId && r.sequenceId === sequenceId);
  },

  async saveDraft(data: MarkEntryRequest): Promise<Result> {
    await delay(300);
    const existing = mockResults.find(
      (r) =>
        r.studentId === data.studentId &&
        r.subjectId === data.subjectId &&
        r.sequenceId === data.sequenceId
    );
    if (existing) {
      existing.score = data.score;
      existing.total = data.total;
      existing.status = ResultStatus.DRAFT;
      existing.updatedAt = new Date().toISOString();
      return existing;
    }
    const newResult: Result = {
      id: `res-${String(mockResults.length + 1).padStart(3, "0")}`,
      studentId: data.studentId,
      subjectId: data.subjectId,
      sequenceId: data.sequenceId,
      enrollmentId: data.enrollmentId,
      score: data.score,
      total: data.total,
      status: ResultStatus.DRAFT,
      submittedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockResults.push(newResult);
    return newResult;
  },

  async submitResults(data: SubmitResultsRequest): Promise<void> {
    await delay(800);
    for (const entry of data.results) {
      const existing = mockResults.find(
        (r) =>
          r.studentId === entry.studentId &&
          r.subjectId === entry.subjectId &&
          r.sequenceId === entry.sequenceId
      );
      if (existing) {
        existing.score = entry.score;
        existing.total = entry.total;
        existing.status = ResultStatus.SUBMITTED;
        existing.submittedAt = new Date().toISOString();
        existing.updatedAt = new Date().toISOString();
      } else {
        mockResults.push({
          id: `res-${String(mockResults.length + 1).padStart(3, "0")}`,
          studentId: entry.studentId,
          subjectId: entry.subjectId,
          sequenceId: entry.sequenceId,
          enrollmentId: entry.enrollmentId,
          score: entry.score,
          total: entry.total,
          status: ResultStatus.SUBMITTED,
          submittedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  },

  async lockResults(sequenceId: string): Promise<void> {
    await delay(500);
    mockResults
      .filter((r) => r.sequenceId === sequenceId && r.status === ResultStatus.SUBMITTED)
      .forEach((r) => {
        r.status = ResultStatus.LOCKED;
        r.updatedAt = new Date().toISOString();
      });
  },

  async unlockResults(sequenceId: string): Promise<void> {
    await delay(500);
    mockResults
      .filter((r) => r.sequenceId === sequenceId && r.status === ResultStatus.LOCKED)
      .forEach((r) => {
        r.status = ResultStatus.SUBMITTED;
        r.updatedAt = new Date().toISOString();
      });
  },

  async getPendingResultsCount(): Promise<number> {
    await delay(300);
    return mockResults.filter((r) => r.status === ResultStatus.DRAFT).length;
  },

  async getSubmittedResultsCount(): Promise<number> {
    await delay(300);
    return mockResults.filter((r) => r.status === ResultStatus.SUBMITTED).length;
  },

  async getSequenceResultsStatus(sequenceId: string): Promise<{
    total: number;
    drafted: number;
    submitted: number;
    locked: number;
  }> {
    await delay(300);
    const seqResults = mockResults.filter((r) => r.sequenceId === sequenceId);
    return {
      total: seqResults.length,
      drafted: seqResults.filter((r) => r.status === ResultStatus.DRAFT).length,
      submitted: seqResults.filter((r) => r.status === ResultStatus.SUBMITTED).length,
      locked: seqResults.filter((r) => r.status === ResultStatus.LOCKED).length,
    };
  },
};

