import type { Class, CreateClassRequest, Student } from "@/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockClasses: Class[] = [
  {
    id: "cls-001",
    name: "Form 1",
    code: "F1",
    description: "First year of secondary education",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "cls-002",
    name: "Form 2",
    code: "F2",
    description: "Second year of secondary education",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "cls-003",
    name: "Form 3",
    code: "F3",
    description: "Third year of secondary education",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "cls-004",
    name: "Form 4",
    code: "F4",
    description: "Fourth year of secondary education",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "cls-005",
    name: "Form 5 Science",
    code: "F5S",
    description: "Fifth year - Science stream",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "cls-006",
    name: "Form 5 Arts",
    code: "F5A",
    description: "Fifth year - Arts stream",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "cls-007",
    name: "Lower Sixth Science",
    code: "L6S",
    description: "First year of High School - Science",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "cls-008",
    name: "Lower Sixth Arts",
    code: "L6A",
    description: "First year of High School - Arts",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "cls-009",
    name: "Upper Sixth Science",
    code: "U6S",
    description: "Final year of High School - Science",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "cls-010",
    name: "Upper Sixth Arts",
    code: "U6A",
    description: "Final year of High School - Arts",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
];

export const classService = {
  async getClasses(): Promise<Class[]> {
    await delay(500);
    return [...mockClasses];
  },

  async getClassById(id: string): Promise<Class | undefined> {
    await delay(300);
    return mockClasses.find((c) => c.id === id);
  },

  async createClass(data: CreateClassRequest): Promise<Class> {
    await delay(700);
    const newClass: Class = {
      id: `cls-${String(mockClasses.length + 1).padStart(3, "0")}`,
      name: data.name,
      code: data.code,
      description: data.description || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockClasses.push(newClass);
    return newClass;
  },

  async updateClass(id: string, data: Partial<Class>): Promise<Class> {
    await delay(500);
    const index = mockClasses.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Class not found");
    mockClasses[index] = { ...mockClasses[index], ...data, updatedAt: new Date().toISOString() };
    return mockClasses[index];
  },

  async deleteClass(id: string): Promise<void> {
    await delay(500);
    const index = mockClasses.findIndex((c) => c.id === id);
    if (index !== -1) mockClasses.splice(index, 1);
  },

  async searchClasses(query: string): Promise<Class[]> {
    await delay(300);
    const q = query.toLowerCase();
    return mockClasses.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  },

  async getStudentCountByClass(classId: string, sessionId: string): Promise<number> {
    await delay(300);
    const { enrollmentService } = await import("./enrollment.service");
    const enrollments = await enrollmentService.getActiveEnrollmentsByClass(classId, sessionId);
    return enrollments.length;
  },

  async getStudentsByClass(classId: string, sessionId: string): Promise<Student[]> {
    await delay(400);
    const { enrollmentService } = await import("./enrollment.service");
    const { studentService } = await import("./student.service");
    const enrollments = await enrollmentService.getActiveEnrollmentsByClass(classId, sessionId);
    const allStudents = await studentService.getStudents();
    const studentIds = new Set(enrollments.map((e) => e.studentId));
    return allStudents.filter((s) => studentIds.has(s.id));
  },
};

