import type { Class, CreateClassRequest, Student, Subject } from '@/types';
import { apiClient } from '@/lib/api-client';

// Backend Class shape includes subjectCount. Frontend Class is a strict subset,
// so we cast safely.
export type ClassWithCount = Class & { subjectCount?: number };

export const classService = {
  async getClasses(): Promise<Class[]> {
    const data = await apiClient.get<ClassWithCount[]>('/classes');
    return data;
  },

  async getClassById(id: string): Promise<Class | undefined> {
    try {
      return await apiClient.get<ClassWithCount>(`/classes/${id}`);
    } catch {
      return undefined;
    }
  },

  async createClass(data: CreateClassRequest): Promise<Class> {
    return apiClient.post<Class>('/classes', data);
  },

  async updateClass(id: string, data: Partial<Class>): Promise<Class> {
    return apiClient.patch<Class>(`/classes/${id}`, data);
  },

  async deleteClass(id: string): Promise<void> {
    await apiClient.delete(`/classes/${id}`);
  },

  async searchClasses(query: string): Promise<Class[]> {
    return apiClient.get<Class[]>(`/classes/search?q=${encodeURIComponent(query)}`);
  },

  async getStudentCountByClass(classId: string, _sessionId: string): Promise<number> {
    // Backend counts students per class+session via enrollment service (Step 8/9).
    // Until then, return 0 to avoid blocking the UI.
    try {
      const { enrollmentService } = await import('./enrollment.service');
      const enrollments = await enrollmentService.getActiveEnrollmentsByClass(
        classId,
        _sessionId
      );
      return enrollments.length;
    } catch {
      return 0;
    }
  },

  async getStudentsByClass(classId: string, sessionId: string): Promise<Student[]> {
    const { enrollmentService } = await import('./enrollment.service');
    const { studentService } = await import('./student.service');
    const enrollments = await enrollmentService.getActiveEnrollmentsByClass(classId, sessionId);
    const allStudents = await studentService.getStudents();
    const studentIds = new Set(enrollments.map((e) => e.studentId));
    return allStudents.filter((s) => studentIds.has(s.id));
  },

  async getSubjectsByClass(classId: string): Promise<Subject[]> {
    // Fetch the assigned subject IDs and look up full Subject objects
    const subjectIds = await apiClient.get<string[]>(`/subjects/class/${classId}`);
    if (subjectIds.length === 0) return [];
    const all = await apiClient.get<Subject[]>('/subjects');
    return all.filter((s) => subjectIds.includes(s.id));
  },
};
