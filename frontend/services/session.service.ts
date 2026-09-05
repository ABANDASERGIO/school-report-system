import type { AcademicSession, CreateSessionRequest } from '@/types';
import { apiClient } from '@/lib/api-client';

export const sessionService = {
  async getSessions(): Promise<AcademicSession[]> {
    return apiClient.get<AcademicSession[]>('/sessions');
  },

  async getSessionById(id: string): Promise<AcademicSession | undefined> {
    try {
      return await apiClient.get<AcademicSession>(`/sessions/${id}`);
    } catch {
      return undefined;
    }
  },

  async getCurrentSession(): Promise<AcademicSession | null> {
    try {
      return await apiClient.get<AcademicSession | null>('/sessions/current');
    } catch {
      return null;
    }
  },

  async hasSessions(): Promise<boolean> {
    try {
      const result = await apiClient.get<{ exists: boolean }>('/sessions/has-sessions');
      return result.exists;
    } catch {
      return false;
    }
  },

  async createSession(data: CreateSessionRequest & { carryForward?: boolean }): Promise<AcademicSession> {
    return apiClient.post<AcademicSession>('/sessions', data);
  },

  async createSessionWithCarryForward(
    data: CreateSessionRequest,
    carryForward: boolean
  ): Promise<AcademicSession> {
    return apiClient.post<AcademicSession>('/sessions', { ...data, carryForward });
  },

  async updateSession(id: string, data: Partial<AcademicSession>): Promise<AcademicSession> {
    return apiClient.patch<AcademicSession>(`/sessions/${id}`, data);
  },

  async setCurrentSession(id: string): Promise<AcademicSession> {
    return apiClient.post<AcademicSession>(`/sessions/${id}/set-current`);
  },

  async carryForwardAssignments(
    fromSessionId: string,
    toSessionId: string
  ): Promise<{ carried: number; skipped: number }> {
    return apiClient.post<{ carried: number; skipped: number }>(
      `/sessions/${fromSessionId}/carry-forward`,
      { targetSessionId: toSessionId }
    );
  },

  async archiveSession(id: string): Promise<AcademicSession> {
    return apiClient.post<AcademicSession>(`/sessions/${id}/archive`);
  },
};
