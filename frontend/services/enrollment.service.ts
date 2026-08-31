import type { Enrollment, CreateEnrollmentRequest } from "@/types";
import { EnrollmentStatus } from "@/types/enums";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockEnrollments: Enrollment[] = [
  { id: "enr-001", studentId: "stu-001", classId: "cls-001", sessionId: "ses-003", status: EnrollmentStatus.ACTIVE, enrollmentDate: "2026-09-01" },
  { id: "enr-002", studentId: "stu-002", classId: "cls-001", sessionId: "ses-003", status: EnrollmentStatus.ACTIVE, enrollmentDate: "2026-09-01" },
  { id: "enr-003", studentId: "stu-003", classId: "cls-001", sessionId: "ses-003", status: EnrollmentStatus.ACTIVE, enrollmentDate: "2026-09-01" },
  { id: "enr-004", studentId: "stu-004", classId: "cls-002", sessionId: "ses-003", status: EnrollmentStatus.ACTIVE, enrollmentDate: "2026-09-01" },
  { id: "enr-005", studentId: "stu-005", classId: "cls-002", sessionId: "ses-003", status: EnrollmentStatus.ACTIVE, enrollmentDate: "2026-09-01" },
  { id: "enr-006", studentId: "stu-006", classId: "cls-002", sessionId: "ses-003", status: EnrollmentStatus.ACTIVE, enrollmentDate: "2026-09-01" },
  { id: "enr-007", studentId: "stu-007", classId: "cls-003", sessionId: "ses-003", status: EnrollmentStatus.ACTIVE, enrollmentDate: "2026-09-01" },
  { id: "enr-008", studentId: "stu-008", classId: "cls-003", sessionId: "ses-003", status: EnrollmentStatus.ACTIVE, enrollmentDate: "2026-09-01" },
  { id: "enr-009", studentId: "stu-001", classId: "cls-001", sessionId: "ses-002", status: EnrollmentStatus.GRADUATED, enrollmentDate: "2025-09-01" },
  { id: "enr-010", studentId: "stu-002", classId: "cls-001", sessionId: "ses-002", status: EnrollmentStatus.GRADUATED, enrollmentDate: "2025-09-01" },
  { id: "enr-011", studentId: "stu-003", classId: "cls-001", sessionId: "ses-002", status: EnrollmentStatus.GRADUATED, enrollmentDate: "2025-09-01" },
  { id: "enr-012", studentId: "stu-004", classId: "cls-002", sessionId: "ses-001", status: EnrollmentStatus.GRADUATED, enrollmentDate: "2024-09-01" },
];

export const enrollmentService = {
  async getEnrollments(sessionId?: string): Promise<Enrollment[]> {
    await delay(500);
    if (sessionId) {
      return mockEnrollments.filter((e) => e.sessionId === sessionId);
    }
    return [...mockEnrollments];
  },

  async getEnrollmentsByClass(classId: string, sessionId?: string): Promise<Enrollment[]> {
    await delay(400);
    return mockEnrollments.filter((e) => e.classId === classId && (sessionId ? e.sessionId === sessionId : true));
  },

  async getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    await delay(300);
    return mockEnrollments.filter((e) => e.studentId === studentId);
  },

  async createEnrollment(data: CreateEnrollmentRequest): Promise<Enrollment> {
    await delay(600);
    const newEnrollment: Enrollment = {
      id: `enr-${String(mockEnrollments.length + 1).padStart(3, "0")}`,
      studentId: data.studentId,
      classId: data.classId,
      sessionId: data.sessionId,
      status: EnrollmentStatus.ACTIVE,
      enrollmentDate: new Date().toISOString().split("T")[0],
    };
    mockEnrollments.push(newEnrollment);
    return newEnrollment;
  },

  async updateEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<void> {
    await delay(400);
    const enrollment = mockEnrollments.find((e) => e.id === id);
    if (enrollment) {
      enrollment.status = status;
    }
  },

  async getActiveEnrollmentsByClass(classId: string, sessionId?: string): Promise<Enrollment[]> {
    await delay(400);
    return mockEnrollments.filter(
      (e) => e.classId === classId && e.status === EnrollmentStatus.ACTIVE && (sessionId ? e.sessionId === sessionId : true)
    );
  },

  async removeEnrollment(studentId: string, sessionId: string): Promise<void> {
    await delay(400);
    const index = mockEnrollments.findIndex((e) => e.studentId === studentId && e.sessionId === sessionId);
    if (index !== -1) {
      mockEnrollments.splice(index, 1);
    }
  },
};

