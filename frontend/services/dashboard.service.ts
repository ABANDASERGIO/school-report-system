import type { ProprietorDashboardData, TeacherDashboardData } from "@/types";
import { delay } from "@/lib/utils";
import { mockTeachers } from "./teacher.service";
import { sessionService } from "./session.service";

export const dashboardService = {
  async getProprietorDashboard(): Promise<ProprietorDashboardData> {
    await delay(600);
    const currentSession = await sessionService.getCurrentSession();
    return {
      totalStudents: 128,
      totalTeachers: 12,
      activeTeachers: 10,
      totalClasses: 10,
      totalSubjects: 12,
      pendingResults: 24,
      submittedResults: 156,
      currentSession,
      recentEnrollments: 8,
    };
  },

  async getTeacherDashboard(teacherId: string): Promise<TeacherDashboardData> {
    await delay(600);
    const currentSession = await sessionService.getCurrentSession();
    return {
      teacher: {
        id: teacherId,
        userId: "usr-002",
        firstName: "John",
        lastName: "Doe",
        email: "john.teacher@edugrade.com",
        phone: "+237 670 123 456",
        address: "Molyko, Buea",
        specialization: "Mathematics",
        isActive: true,
        createdAt: "2025-01-15T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
      },
      assignments: [
        {
          id: "asg-001",
          teacherId,
          classId: "cls-001",
          subjectId: "sub-001",
          sessionId: currentSession?.id || "ses-003",
        },
        {
          id: "asg-002",
          teacherId,
          classId: "cls-002",
          subjectId: "sub-001",
          sessionId: currentSession?.id || "ses-003",
        },
        {
          id: "asg-003",
          teacherId,
          classId: "cls-003",
          subjectId: "sub-001",
          sessionId: currentSession?.id || "ses-003",
        },
      ],
      currentSession,
      totalStudents: 45,
      pendingResults: 12,
      submittedResults: 18,
    };
  },
};

