import type { Assignment, CreateAssignmentRequest } from "@/types";
import { sessionService } from "./session.service";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockAssignments: Assignment[] = [
  { id: "asg-001", teacherId: "tch-001", classId: "cls-001", subjectId: "sub-001", sessionId: "ses-003" },
  { id: "asg-002", teacherId: "tch-001", classId: "cls-002", subjectId: "sub-001", sessionId: "ses-003" },
  { id: "asg-003", teacherId: "tch-001", classId: "cls-003", subjectId: "sub-001", sessionId: "ses-003" },
  { id: "asg-004", teacherId: "tch-002", classId: "cls-001", subjectId: "sub-002", sessionId: "ses-003" },
  { id: "asg-005", teacherId: "tch-002", classId: "cls-002", subjectId: "sub-002", sessionId: "ses-003" },
  { id: "asg-006", teacherId: "tch-002", classId: "cls-003", subjectId: "sub-002", sessionId: "ses-003" },
  { id: "asg-007", teacherId: "tch-003", classId: "cls-005", subjectId: "sub-004", sessionId: "ses-003" },
  { id: "asg-008", teacherId: "tch-003", classId: "cls-007", subjectId: "sub-004", sessionId: "ses-003" },
  { id: "asg-009", teacherId: "tch-003", classId: "cls-009", subjectId: "sub-004", sessionId: "ses-003" },
  { id: "asg-010", teacherId: "tch-005", classId: "cls-001", subjectId: "sub-007", sessionId: "ses-003" },
  { id: "asg-011", teacherId: "tch-005", classId: "cls-002", subjectId: "sub-007", sessionId: "ses-003" },
  { id: "asg-012", teacherId: "tch-005", classId: "cls-006", subjectId: "sub-007", sessionId: "ses-003" },
];

export const assignmentService = {
  async getAssignments(): Promise<Assignment[]> {
    await delay(600);
    return [...mockAssignments];
  },

  async getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]> {
    await delay(400);
    return mockAssignments.filter((a) => a.teacherId === teacherId);
  },

  async getAssignmentsByClass(classId: string): Promise<Assignment[]> {
    await delay(400);
    return mockAssignments.filter((a) => a.classId === classId);
  },

  async createAssignment(data: CreateAssignmentRequest): Promise<Assignment> {
    await delay(600);
    const exists = mockAssignments.some(
      (a) => a.teacherId === data.teacherId && a.classId === data.classId && a.subjectId === data.subjectId && a.sessionId === data.sessionId
    );
    if (exists) {
      throw new Error("This teacher is already assigned to this class and subject for the selected academic year.");
    }
    const newAssignment: Assignment = {
      id: `asg-${String(mockAssignments.length + 1).padStart(3, "0")}`,
      teacherId: data.teacherId,
      classId: data.classId,
      subjectId: data.subjectId,
      sessionId: data.sessionId,
    };
    mockAssignments.push(newAssignment);
    return newAssignment;
  },

  async updateAssignment(id: string, data: Partial<Pick<Assignment, "teacherId" | "classId" | "subjectId" | "sessionId">>): Promise<Assignment> {
    await delay(600);
    const index = mockAssignments.findIndex((a) => a.id === id);
    if (index === -1) throw new Error("Assignment not found");
    const updated = { ...mockAssignments[index], ...data };
    const duplicate = mockAssignments.some(
      (a) => a.id !== id && a.teacherId === updated.teacherId && a.classId === updated.classId && a.subjectId === updated.subjectId && a.sessionId === updated.sessionId
    );
    if (duplicate) {
      throw new Error("This teacher is already assigned to this class and subject for the selected academic year.");
    }
    mockAssignments[index] = updated;
    return mockAssignments[index];
  },

  async removeAssignment(id: string): Promise<void> {
    await delay(400);
    const index = mockAssignments.findIndex((a) => a.id === id);
    if (index !== -1) {
      mockAssignments.splice(index, 1);
    }
  },

  async getAssignmentsBySession(sessionId: string): Promise<Assignment[]> {
    await delay(400);
    return mockAssignments.filter((a) => a.sessionId === sessionId);
  },

  async carryForwardAssignments(fromSessionId: string, toSessionId: string): Promise<Assignment[]> {
    await delay(600);
    const source = mockAssignments.filter((a) => a.sessionId === fromSessionId);
    const created: Assignment[] = [];
    for (const assignment of source) {
      const newAssignment: Assignment = {
        id: `asg-${String(mockAssignments.length + 1).padStart(3, "0")}`,
        teacherId: assignment.teacherId,
        classId: assignment.classId,
        subjectId: assignment.subjectId,
        sessionId: toSessionId,
      };
      mockAssignments.push(newAssignment);
      created.push(newAssignment);
    }
    return created;
  },
};

