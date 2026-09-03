import type { Student, CreateStudentRequest } from '@/types';
import { Gender } from '@/types/enums';
import { apiClient } from '@/lib/api-client';
import { uploadService, type UploadResult } from './upload.service';

export async function uploadStudentPhoto(
  file: File,
  entityId?: string
): Promise<UploadResult> {
  return uploadService.uploadImage(file, 'student', entityId);
}

export async function deleteStudentPhoto(publicId: string): Promise<void> {
  try {
    await apiClient.delete(`/uploads/${encodeURIComponent(publicId)}`);
  } catch {
    // ignore
  }
}

export interface CreateStudentWithEnrollment extends CreateStudentRequest {
  enrollment?: {
    classId: string;
    sessionId: string;
  };
}

export const studentService = {
  /**
   * List all students.
   */
  async getStudents(): Promise<Student[]> {
    return apiClient.get<Student[]>('/students');
  },

  /**
   * Get a single student by ID.
   */
  async getStudentById(id: string): Promise<Student | undefined> {
    try {
      return await apiClient.get<Student>(`/students/${id}`);
    } catch {
      return undefined;
    }
  },

  /**
   * Register a new student. If `enrollment` is provided, also creates an
   * ACTIVE enrollment in the same call.
   */
  async createStudent(data: CreateStudentWithEnrollment): Promise<Student> {
    // Map empty strings to undefined so backend doesn't store ""
    const payload: Record<string, unknown> = {
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
    };
    if (data.dateOfBirth) payload.dateOfBirth = data.dateOfBirth;
    if (data.placeOfBirth) payload.placeOfBirth = data.placeOfBirth;
    if (data.address) payload.address = data.address;
    if (data.phone) payload.phone = data.phone;
    if (data.parentName) payload.parentName = data.parentName;
    if (data.parentPhone) payload.parentPhone = data.parentPhone;
    if (data.photoUrl) payload.photoUrl = data.photoUrl;
    if (data.photoPublicId) payload.photoPublicId = data.photoPublicId;
    if (data.enrollment) payload.enrollment = data.enrollment;

    return apiClient.post<Student>('/students', payload);
  },

  /**
   * Update a student's profile.
   */
  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    return apiClient.patch<Student>(`/students/${id}`, data);
  },

  /**
   * Soft-delete a student (withdraws all active enrollments).
   */
  async deleteStudent(id: string): Promise<void> {
    await apiClient.delete(`/students/${id}`);
  },

  /**
   * Search students by name, student number, parent name, or parent phone.
   */
  async searchStudents(query: string): Promise<Student[]> {
    return apiClient.get<Student[]>(`/students/search?q=${encodeURIComponent(query)}`);
  },

  /**
   * Returns students in a given class+session by joining enrollments.
   */
  async getStudentsByClassAndSession(
    classId: string,
    sessionId: string
  ): Promise<Student[]> {
    const { enrollmentService } = await import('./enrollment.service');
    const [enrollments, allStudents] = await Promise.all([
      enrollmentService.getActiveEnrollmentsByClass(classId, sessionId),
      this.getStudents(),
    ]);
    const studentIds = new Set(enrollments.map((e) => e.studentId));
    return allStudents.filter((s) => studentIds.has(s.id));
  },
};

export { Gender };
