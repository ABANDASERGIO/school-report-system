import type { Enrollment, CreateEnrollmentRequest } from '@/types';
import { EnrollmentStatus } from '@/types/enums';
import { apiClient } from '@/lib/api-client';

export type EnrollmentWithRelations = Enrollment & {
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    studentNumber: string;
  };
  class?: {
    id: string;
    name: string;
    code: string;
  };
  session?: {
    id: string;
    name: string;
  };
};

function buildQuery(filters: {
  sessionId?: string;
  classId?: string;
  studentId?: string;
  status?: EnrollmentStatus;
}): string {
  const params = new URLSearchParams();
  if (filters.sessionId) params.set('sessionId', filters.sessionId);
  if (filters.classId) params.set('classId', filters.classId);
  if (filters.studentId) params.set('studentId', filters.studentId);
  if (filters.status) params.set('status', filters.status);
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const enrollmentService = {
  /**
   * List enrollments. Optional filters: sessionId, classId, studentId, status.
   */
  async getEnrollments(sessionId?: string): Promise<Enrollment[]> {
    return apiClient.get<EnrollmentWithRelations[]>(`/enrollments${buildQuery({ sessionId })}`);
  },

  /**
   * List enrollments for a class, optionally narrowed to a session.
   */
  async getEnrollmentsByClass(
    classId: string,
    sessionId?: string
  ): Promise<Enrollment[]> {
    return apiClient.get<EnrollmentWithRelations[]>(
      `/enrollments${buildQuery({ classId, sessionId })}`
    );
  },

  /**
   * List all enrollments for a single student (across sessions).
   */
  async getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    return apiClient.get<EnrollmentWithRelations[]>(
      `/enrollments${buildQuery({ studentId })}`
    );
  },

  /**
   * List active enrollments for a class, optionally narrowed to a session.
   */
  async getActiveEnrollmentsByClass(
    classId: string,
    sessionId?: string
  ): Promise<Enrollment[]> {
    const all = await apiClient.get<EnrollmentWithRelations[]>(
      `/enrollments${buildQuery({ classId, sessionId, status: EnrollmentStatus.ACTIVE })}`
    );
    return all;
  },

  /**
   * Get a single enrollment by ID.
   */
  async getEnrollmentById(id: string): Promise<Enrollment | undefined> {
    try {
      return await apiClient.get<EnrollmentWithRelations>(`/enrollments/${id}`);
    } catch {
      return undefined;
    }
  },

  /**
   * Create a new enrollment. Status defaults to ACTIVE on the backend.
   */
  async createEnrollment(data: CreateEnrollmentRequest): Promise<Enrollment> {
    return apiClient.post<Enrollment>('/enrollments', data);
  },

  /**
   * Update an enrollment (classId, status, enrollmentDate).
   */
  async updateEnrollment(
    id: string,
    data: { classId?: string; status?: EnrollmentStatus; enrollmentDate?: string }
  ): Promise<Enrollment> {
    return apiClient.patch<Enrollment>(`/enrollments/${id}`, data);
  },

  /**
   * Convenience: mark an enrollment as WITHDRAWN.
   */
  async withdrawEnrollment(id: string): Promise<Enrollment> {
    return apiClient.post<Enrollment>(`/enrollments/${id}/withdraw`);
  },

  /**
   * Soft-remove a student from a session. Used by the Students list
   * ("Remove from academic year") and the Student detail page.
   */
  async removeEnrollment(studentId: string, sessionId: string): Promise<void> {
    await apiClient.delete(
      `/enrollments/by-student-session?studentId=${encodeURIComponent(studentId)}&sessionId=${encodeURIComponent(sessionId)}`
    );
  },
};
