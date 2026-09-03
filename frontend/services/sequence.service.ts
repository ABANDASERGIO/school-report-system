import type { Sequence, CreateSequenceRequest } from '@/types';
import { apiClient } from '@/lib/api-client';

export const sequenceService = {
  async getSequences(termId?: string): Promise<Sequence[]> {
    const qs = termId ? `?termId=${encodeURIComponent(termId)}` : '';
    return apiClient.get<Sequence[]>(`/sequences${qs}`);
  },

  async getSequenceById(id: string): Promise<Sequence | undefined> {
    try {
      return await apiClient.get<Sequence>(`/sequences/${id}`);
    } catch {
      return undefined;
    }
  },

  async getActiveSequence(): Promise<Sequence | null> {
    try {
      return await apiClient.get<Sequence | null>('/sequences/active');
    } catch {
      return null;
    }
  },

  async createSequence(data: CreateSequenceRequest): Promise<Sequence> {
    return apiClient.post<Sequence>('/sequences', data);
  },

  async updateSequence(id: string, data: Partial<Sequence>): Promise<Sequence> {
    return apiClient.patch<Sequence>(`/sequences/${id}`, data);
  },

  async setActiveSequence(id: string): Promise<Sequence> {
    return apiClient.post<Sequence>(`/sequences/${id}/set-active`);
  },
};
