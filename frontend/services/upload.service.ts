import { apiClient } from '@/lib/api-client';

export type UploadKind = 'student' | 'teacher' | 'school-logo';

export interface UploadResult {
  url: string;
  publicId: string;
}

export const uploadService = {
  /**
   * Upload a single image to Cloudinary via the backend. The returned
   * `url` and `publicId` should be persisted on the entity (student,
   * teacher, or school_logo setting).
   */
  async uploadImage(
    file: File,
    kind: UploadKind,
    entityId?: string
  ): Promise<UploadResult> {
    const form = new FormData();
    form.append('file', file);
    const qs = entityId ? `?entityId=${encodeURIComponent(entityId)}` : '';
    return apiClient.postFormData<UploadResult>(`/uploads/${kind}${qs}`, form);
  },

  /**
   * Upload the school logo and persist the resulting URL to the school_logo
   * setting in a single call. Proprietor only.
   */
  async uploadSchoolLogo(file: File): Promise<UploadResult> {
    const form = new FormData();
    form.append('file', file);
    return apiClient.postFormData<UploadResult>('/uploads/school-logo', form);
  },

  /**
   * Move an existing upload to a new public_id (rebind). Used after
   * entity creation to re-key a pre-creation upload from a temp id to the
   * canonical entity id. Returns the new public_id (and url when the
   * rename actually happened on Cloudinary).
   *
   * Errors are swallowed: a missing source asset is fine (it just means
   * the user uploaded-and-discarded), and the entity record can still be
   * saved with the expected public_id.
   */
  async rebindPhoto(
    kind: UploadKind,
    fromPublicId: string,
    entityId: string
  ): Promise<{ publicId: string; url: string; renamed: boolean } | null> {
    if (!fromPublicId) return null;
    try {
      return await apiClient.post<{ publicId: string; url: string; renamed: boolean }>(
        `/uploads/${kind}/rebind`,
        { fromPublicId, entityId }
      );
    } catch {
      return null;
    }
  },
};
