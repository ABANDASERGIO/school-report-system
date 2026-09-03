import type { Subject, CreateSubjectRequest } from '@/types';
import { apiClient } from '@/lib/api-client';

// Backend Subject includes classCount; frontend Subject is a strict subset.
export type SubjectWithCount = Subject & { classCount?: number };

export const subjectService = {
  async getSubjects(): Promise<Subject[]> {
    return apiClient.get<SubjectWithCount[]>('/subjects');
  },

  async getSubjectById(id: string): Promise<Subject | undefined> {
    try {
      return await apiClient.get<SubjectWithCount>(`/subjects/${id}`);
    } catch {
      return undefined;
    }
  },

  async createSubject(data: CreateSubjectRequest): Promise<Subject> {
    return apiClient.post<Subject>('/subjects', data);
  },

  async updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
    return apiClient.patch<Subject>(`/subjects/${id}`, data);
  },

  async deleteSubject(id: string): Promise<void> {
    await apiClient.delete(`/subjects/${id}`);
  },

  async searchSubjects(query: string): Promise<Subject[]> {
    return apiClient.get<Subject[]>(`/subjects/search?q=${encodeURIComponent(query)}`);
  },

  async getSubjectsByClass(classId: string): Promise<Subject[]> {
    const ids = await apiClient.get<string[]>(`/subjects/class/${classId}`);
    if (ids.length === 0) return [];
    const all = await apiClient.get<SubjectWithCount[]>('/subjects');
    return all.filter((s) => ids.includes(s.id));
  },

  async getClassIdsForSubject(subjectId: string): Promise<string[]> {
    return apiClient.get<string[]>(`/subjects/${subjectId}/classes`);
  },
};
