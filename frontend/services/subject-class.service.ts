import type { Subject, Class as ClassType } from "@/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface SubjectClass {
  subjectId: string;
  classId: string;
}

const mockSubjectClasses: SubjectClass[] = [
  { subjectId: "sub-001", classId: "cls-001" },
  { subjectId: "sub-001", classId: "cls-002" },
  { subjectId: "sub-001", classId: "cls-003" },
  { subjectId: "sub-001", classId: "cls-004" },
  { subjectId: "sub-001", classId: "cls-005" },
  { subjectId: "sub-001", classId: "cls-006" },
  { subjectId: "sub-001", classId: "cls-007" },
  { subjectId: "sub-001", classId: "cls-008" },
  { subjectId: "sub-001", classId: "cls-009" },
  { subjectId: "sub-001", classId: "cls-010" },
  { subjectId: "sub-002", classId: "cls-001" },
  { subjectId: "sub-002", classId: "cls-002" },
  { subjectId: "sub-002", classId: "cls-003" },
  { subjectId: "sub-002", classId: "cls-004" },
  { subjectId: "sub-002", classId: "cls-005" },
  { subjectId: "sub-002", classId: "cls-006" },
  { subjectId: "sub-002", classId: "cls-007" },
  { subjectId: "sub-002", classId: "cls-008" },
  { subjectId: "sub-002", classId: "cls-009" },
  { subjectId: "sub-002", classId: "cls-010" },
  { subjectId: "sub-003", classId: "cls-001" },
  { subjectId: "sub-003", classId: "cls-002" },
  { subjectId: "sub-003", classId: "cls-003" },
  { subjectId: "sub-003", classId: "cls-004" },
  { subjectId: "sub-003", classId: "cls-005" },
  { subjectId: "sub-003", classId: "cls-006" },
  { subjectId: "sub-003", classId: "cls-007" },
  { subjectId: "sub-003", classId: "cls-008" },
  { subjectId: "sub-003", classId: "cls-009" },
  { subjectId: "sub-003", classId: "cls-010" },
  { subjectId: "sub-004", classId: "cls-004" },
  { subjectId: "sub-004", classId: "cls-005" },
  { subjectId: "sub-004", classId: "cls-007" },
  { subjectId: "sub-004", classId: "cls-009" },
  { subjectId: "sub-005", classId: "cls-004" },
  { subjectId: "sub-005", classId: "cls-005" },
  { subjectId: "sub-005", classId: "cls-007" },
  { subjectId: "sub-005", classId: "cls-009" },
  { subjectId: "sub-006", classId: "cls-004" },
  { subjectId: "sub-006", classId: "cls-005" },
  { subjectId: "sub-006", classId: "cls-007" },
  { subjectId: "sub-006", classId: "cls-009" },
  { subjectId: "sub-007", classId: "cls-001" },
  { subjectId: "sub-007", classId: "cls-002" },
  { subjectId: "sub-007", classId: "cls-003" },
  { subjectId: "sub-007", classId: "cls-006" },
  { subjectId: "sub-007", classId: "cls-008" },
  { subjectId: "sub-007", classId: "cls-010" },
  { subjectId: "sub-008", classId: "cls-001" },
  { subjectId: "sub-008", classId: "cls-002" },
  { subjectId: "sub-008", classId: "cls-003" },
  { subjectId: "sub-008", classId: "cls-006" },
  { subjectId: "sub-008", classId: "cls-008" },
  { subjectId: "sub-008", classId: "cls-010" },
  { subjectId: "sub-009", classId: "cls-001" },
  { subjectId: "sub-009", classId: "cls-002" },
  { subjectId: "sub-009", classId: "cls-003" },
  { subjectId: "sub-009", classId: "cls-004" },
  { subjectId: "sub-009", classId: "cls-005" },
  { subjectId: "sub-009", classId: "cls-006" },
  { subjectId: "sub-009", classId: "cls-007" },
  { subjectId: "sub-009", classId: "cls-008" },
  { subjectId: "sub-009", classId: "cls-009" },
  { subjectId: "sub-009", classId: "cls-010" },
  { subjectId: "sub-010", classId: "cls-001" },
  { subjectId: "sub-010", classId: "cls-002" },
  { subjectId: "sub-010", classId: "cls-003" },
  { subjectId: "sub-010", classId: "cls-004" },
  { subjectId: "sub-010", classId: "cls-005" },
  { subjectId: "sub-010", classId: "cls-006" },
  { subjectId: "sub-010", classId: "cls-007" },
  { subjectId: "sub-010", classId: "cls-008" },
  { subjectId: "sub-010", classId: "cls-009" },
  { subjectId: "sub-010", classId: "cls-010" },
  { subjectId: "sub-011", classId: "cls-001" },
  { subjectId: "sub-011", classId: "cls-002" },
  { subjectId: "sub-011", classId: "cls-003" },
  { subjectId: "sub-011", classId: "cls-006" },
  { subjectId: "sub-011", classId: "cls-008" },
  { subjectId: "sub-011", classId: "cls-010" },
  { subjectId: "sub-012", classId: "cls-006" },
  { subjectId: "sub-012", classId: "cls-008" },
  { subjectId: "sub-012", classId: "cls-010" },
];

export const subjectClassService = {
  async getClassesForSubject(subjectId: string): Promise<string[]> {
    await delay(300);
    return mockSubjectClasses
      .filter((sc) => sc.subjectId === subjectId)
      .map((sc) => sc.classId);
  },

  async getSubjectsForClass(classId: string): Promise<string[]> {
    await delay(300);
    return mockSubjectClasses
      .filter((sc) => sc.classId === classId)
      .map((sc) => sc.subjectId);
  },

  async setSubjectClasses(subjectId: string, classIds: string[]): Promise<void> {
    await delay(400);
    for (let i = mockSubjectClasses.length - 1; i >= 0; i--) {
      if (mockSubjectClasses[i].subjectId === subjectId) {
        mockSubjectClasses.splice(i, 1);
      }
    }
    for (const classId of classIds) {
      mockSubjectClasses.push({ subjectId, classId });
    }
  },

  async getAllSubjectClasses(): Promise<SubjectClass[]> {
    await delay(300);
    return [...mockSubjectClasses];
  },
};
