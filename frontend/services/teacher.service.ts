import type { Teacher, CreateTeacherRequest } from '@/types';
import { apiClient } from '@/lib/api-client';
import { uploadService, type UploadResult } from './upload.service';

export async function uploadTeacherPhoto(
  file: File,
  entityId?: string
): Promise<UploadResult> {
  return uploadService.uploadImage(file, 'teacher', entityId);
}

export async function deleteTeacherPhoto(publicId: string): Promise<void> {
  // Best-effort; the backend always responds 200 unless Cloudinary is down.
  // We still swallow errors so the UI can clear local state regardless.
  try {
    await apiClient.delete(`/uploads/${encodeURIComponent(publicId)}`);
  } catch {
    // ignore
  }
}

export const teacherService = {
  async getTeachers(): Promise<Teacher[]> {
    return apiClient.get<Teacher[]>('/teachers');
  },

  async getTeacherById(id: string): Promise<Teacher | undefined> {
    try {
      return await apiClient.get<Teacher>(`/teachers/${id}`);
    } catch {
      return undefined;
    }
  },

  async getMyTeacherProfile(): Promise<Teacher | null> {
    try {
      return await apiClient.get<Teacher | null>('/teachers/me');
    } catch {
      return null;
    }
  },

  async createTeacher(data: CreateTeacherRequest): Promise<Teacher> {
    return apiClient.post<Teacher>('/teachers', data);
  },

  async updateTeacher(id: string, data: Partial<Teacher>): Promise<Teacher> {
    return apiClient.patch<Teacher>(`/teachers/${id}`, data);
  },

  async suspendTeacher(id: string): Promise<Teacher> {
    return apiClient.patch<Teacher>(`/teachers/${id}/suspend`);
  },

  async activateTeacher(id: string): Promise<Teacher> {
    return apiClient.patch<Teacher>(`/teachers/${id}/activate`);
  },

  async resetPassword(id: string, newPassword?: string): Promise<{ newPassword: string }> {
    return apiClient.post<{ newPassword: string }>(`/teachers/${id}/reset-password`, { newPassword });
  },

  async deleteTeacher(id: string): Promise<void> {
    // Soft-delete via suspend on the backend
    await apiClient.delete(`/teachers/${id}`);
  },

  async searchTeachers(query: string): Promise<Teacher[]> {
    return apiClient.get<Teacher[]>(`/teachers/search?q=${encodeURIComponent(query)}`);
  },
};
