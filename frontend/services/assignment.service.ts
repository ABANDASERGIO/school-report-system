import type { Assignment, CreateAssignmentRequest } from '@/types';
import { apiClient } from '@/lib/api-client';

export type AssignmentWithRelations = Assignment & {
  teacher?: { id: string; firstName: string; lastName: string; email: string };
  class?: { id: string; name: string; code: string };
  subject?: { id: string; name: string; code: string; coefficient: number };
  session?: { id: string; name: string };
};

export interface BulkCreateResult {
  created: number;
  skipped: number;
  createdIds: string[];
}

function buildQuery(filters: {
  teacherId?: string;
  classId?: string;
  subjectId?: string;
  sessionId?: string;
}): string {
  const params = new URLSearchParams();
  if (filters.teacherId) params.set('teacherId', filters.teacherId);
  if (filters.classId) params.set('classId', filters.classId);
  if (filters.subjectId) params.set('subjectId', filters.subjectId);
  if (filters.sessionId) params.set('sessionId', filters.sessionId);
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const assignmentService = {
  /**
   * List all assignments (any session). Use the filters for narrower
   * queries.
   */
  async getAssignments(): Promise<Assignment[]> {
    return apiClient.get<AssignmentWithRelations[]>('/assignments');
  },

  /**
   * List assignments for a single teacher.
   */
  async getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]> {
    return apiClient.get<AssignmentWithRelations[]>(`/assignments/teacher/${teacherId}`);
  },

  /**
   * List assignments for a single class.
   */
  async getAssignmentsByClass(classId: string): Promise<Assignment[]> {
    return apiClient.get<AssignmentWithRelations[]>(`/assignments/class/${classId}`);
  },

  /**
   * List assignments for a single academic session.
   */
  async getAssignmentsBySession(sessionId: string): Promise<Assignment[]> {
    return apiClient.get<AssignmentWithRelations[]>(
      `/assignments${buildQuery({ sessionId })}`
    );
  },

  /**
   * Convenience: assignments for a teacher in a specific session.
   */
  async getMyAssignments(teacherId: string, sessionId: string): Promise<Assignment[]> {
    return apiClient.get<AssignmentWithRelations[]>(
      `/assignments/teacher/${teacherId}?sessionId=${encodeURIComponent(sessionId)}`
    );
  },

  /**
   * Get a single assignment by ID.
   */
  async getAssignmentById(id: string): Promise<Assignment | undefined> {
    try {
      return await apiClient.get<AssignmentWithRelations>(`/assignments/${id}`);
    } catch {
      return undefined;
    }
  },

  /**
   * Create a single assignment.
   */
  async createAssignment(data: CreateAssignmentRequest): Promise<Assignment> {
    return apiClient.post<Assignment>('/assignments', data);
  },

  /**
   * Bulk create. The backend will skip duplicates and return counts.
   */
  async bulkCreateAssignments(
    assignments: CreateAssignmentRequest[]
  ): Promise<BulkCreateResult> {
    return apiClient.post<BulkCreateResult>('/assignments/bulk', { assignments });
  },

  /**
   * Update an assignment (teacher, class, subject, or session).
   */
  async updateAssignment(
    id: string,
    data: Partial<Pick<Assignment, 'teacherId' | 'classId' | 'subjectId' | 'sessionId'>>
  ): Promise<Assignment> {
    return apiClient.patch<Assignment>(`/assignments/${id}`, data);
  },

  /**
   * Delete an assignment.
   */
  async removeAssignment(id: string): Promise<void> {
    await apiClient.delete(`/assignments/${id}`);
  },

  /**
   * Carry-forward convenience: copy every assignment in `fromSessionId`
   * to `toSessionId`. Skips duplicates that already exist in the target.
   */
  async carryForwardAssignments(
    fromSessionId: string,
    toSessionId: string
  ): Promise<BulkCreateResult> {
    const source = await this.getAssignmentsBySession(fromSessionId);
    const payload: CreateAssignmentRequest[] = source.map((a) => ({
      teacherId: a.teacherId,
      classId: a.classId,
      subjectId: a.subjectId,
      sessionId: toSessionId,
    }));
    if (payload.length === 0) {
      return { created: 0, skipped: 0, createdIds: [] };
    }
    return this.bulkCreateAssignments(payload);
  },
};
