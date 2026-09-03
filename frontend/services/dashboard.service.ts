import type {
  ProprietorDashboardData,
  TeacherDashboardData,
} from '@/types';
import { apiClient } from '@/lib/api-client';

// Enriched shapes returned by the backend. The base types in
// `types/models.ts` are a strict subset, so the extra fields are
// additive (caller can read them via casting).
export type ProprietorDashboard = ProprietorDashboardData & {
  lockedResults?: number;
  totalAssignments?: number;
};

export type TeacherDashboardAssignment = {
  id: string;
  teacherId: string;
  classId: string;
  className: string;
  classCode: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectCoefficient: number;
  sessionId: string;
  sessionName: string;
};

export type TeacherDashboard = Omit<TeacherDashboardData, 'assignments'> & {
  assignments: TeacherDashboardAssignment[];
  totalClasses?: number;
  totalSubjects?: number;
  lockedResults?: number;
};

export const dashboardService = {
  /**
   * Proprietor dashboard. Backend enforces role=PROPRIETOR.
   */
  async getProprietorDashboard(): Promise<ProprietorDashboard> {
    return apiClient.get<ProprietorDashboard>('/dashboard/proprietor');
  },

  /**
   * Teacher dashboard for the currently authenticated user. The
   * `teacherId` argument is ignored — the backend uses req.user.userId.
   * Kept as an optional argument for API symmetry.
   */
  async getTeacherDashboard(_teacherId?: string): Promise<TeacherDashboard> {
    return apiClient.get<TeacherDashboard>('/dashboard/teacher');
  },
};
