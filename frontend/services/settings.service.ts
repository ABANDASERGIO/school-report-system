import type { SchoolSetting } from '@/types';
import { apiClient } from '@/lib/api-client';

export const settingsService = {
  async getAllSettings(): Promise<SchoolSetting[]> {
    return apiClient.get<SchoolSetting[]>('/settings');
  },

  async getSetting(key: string): Promise<SchoolSetting | undefined> {
    try {
      return await apiClient.get<SchoolSetting>(`/settings/${key}`);
    } catch {
      return undefined;
    }
  },

  async updateSetting(key: string, value: string): Promise<SchoolSetting> {
    return apiClient.patch<SchoolSetting>(`/settings/${key}`, { value });
  },

  async updateSettings(settings: { key: string; value: string }[]): Promise<SchoolSetting[]> {
    return apiClient.patch<SchoolSetting[]>('/settings', { settings });
  },

  async getSchoolName(): Promise<string> {
    try {
      const result = await apiClient.get<{ name: string }>('/settings/school-name');
      return result.name;
    } catch {
      return 'EduGrade School';
    }
  },
};
