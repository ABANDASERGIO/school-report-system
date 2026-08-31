import type { Subject, CreateSubjectRequest } from "@/types";
import { subjectClassService } from "./subject-class.service";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockSubjects: Subject[] = [
  { id: "sub-001", name: "Mathematics", code: "MATH", description: "Algebra, Geometry, Trigonometry", coefficient: 5, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "sub-002", name: "English Language", code: "ENG", description: "Grammar, Composition, Literature", coefficient: 4, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "sub-003", name: "French", code: "FREN", description: "French language and literature", coefficient: 3, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "sub-004", name: "Physics", code: "PHY", description: "Mechanics, Electricity, Optics", coefficient: 4, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "sub-005", name: "Chemistry", code: "CHEM", description: "Organic & Inorganic Chemistry", coefficient: 3, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "sub-006", name: "Biology", code: "BIO", description: "Human Biology, Ecology", coefficient: 3, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "sub-007", name: "History", code: "HIST", description: "World & African History", coefficient: 2, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "sub-008", name: "Geography", code: "GEOG", description: "Physical & Human Geography", coefficient: 2, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "sub-009", name: "ICT", code: "ICT", description: "Information & Communication Technology", coefficient: 2, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "sub-010", name: "Physical Education", code: "PE", description: "Sports and physical fitness", coefficient: 1, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "sub-011", name: "Civic Education", code: "CIV", description: "Citizenship and moral education", coefficient: 1, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "sub-012", name: "Literature in English", code: "LIT", description: "English literary works and analysis", coefficient: 3, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
];

export const subjectService = {
  async getSubjects(): Promise<Subject[]> {
    await delay(500);
    return [...mockSubjects];
  },

  async getSubjectById(id: string): Promise<Subject | undefined> {
    await delay(300);
    return mockSubjects.find((s) => s.id === id);
  },

  async createSubject(data: CreateSubjectRequest): Promise<Subject> {
    await delay(700);
    const newSubject: Subject = {
      id: `sub-${String(mockSubjects.length + 1).padStart(3, "0")}`,
      name: data.name,
      code: data.code,
      description: data.description,
      coefficient: data.coefficient,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockSubjects.push(newSubject);
    return newSubject;
  },

  async updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
    await delay(500);
    const index = mockSubjects.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Subject not found");
    mockSubjects[index] = { ...mockSubjects[index], ...data, updatedAt: new Date().toISOString() };
    return mockSubjects[index];
  },

  async searchSubjects(query: string): Promise<Subject[]> {
    await delay(300);
    const q = query.toLowerCase();
    return mockSubjects.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  },

  async deleteSubject(id: string): Promise<void> {
    await delay(500);
    const index = mockSubjects.findIndex((s) => s.id === id);
    if (index !== -1) mockSubjects.splice(index, 1);
    await subjectClassService.setSubjectClasses(id, []);
  },

  async getSubjectsByClass(classId: string): Promise<Subject[]> {
    await delay(400);
    const subjectIds = await subjectClassService.getSubjectsForClass(classId);
    return mockSubjects.filter((s) => subjectIds.includes(s.id));
  },

  async getClassIdsForSubject(subjectId: string): Promise<string[]> {
    await delay(300);
    return subjectClassService.getClassesForSubject(subjectId);
  },
};

