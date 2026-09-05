import type { Term, CreateTermRequest } from '@/types';
import { apiClient } from '@/lib/api-client';

export const termService = {
  async getTerms(sessionId?: string): Promise<Term[]> {
    const qs = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
    return apiClient.get<Term[]>(`/terms${qs}`);
  },

  async getTermById(id: string): Promise<Term | undefined> {
    try {
      return await apiClient.get<Term>(`/terms/${id}`);
    } catch {
      return undefined;
    }
  },

  async createTerm(data: CreateTermRequest): Promise<Term> {
    return apiClient.post<Term>('/terms', data);
  },

  async updateTerm(id: string, data: Partial<Term>): Promise<Term> {
    return apiClient.patch<Term>(`/terms/${id}`, data);
  },

  async setCurrentTerm(id: string, sessionId: string): Promise<Term> {
    return apiClient.post<Term>(`/terms/${id}/set-current?sessionId=${encodeURIComponent(sessionId)}`);
  },
};
