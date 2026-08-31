import type { AcademicSession, CreateSessionRequest } from "@/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockSessions: AcademicSession[] = [
  {
    id: "ses-001",
    name: "2024/2025",
    startDate: "2024-09-01",
    endDate: "2025-08-31",
    isCurrent: false,
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
  {
    id: "ses-002",
    name: "2025/2026",
    startDate: "2025-09-01",
    endDate: "2026-08-31",
    isCurrent: false,
    createdAt: "2025-06-01T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
  },
  {
    id: "ses-003",
    name: "2026/2027",
    startDate: "2026-09-01",
    endDate: "2027-08-31",
    isCurrent: true,
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
  },
];

export const sessionService = {
  async getSessions(): Promise<AcademicSession[]> {
    await delay(500);
    return [...mockSessions];
  },

  async getSessionById(id: string): Promise<AcademicSession | undefined> {
    await delay(300);
    return mockSessions.find((s) => s.id === id);
  },

  async getCurrentSession(): Promise<AcademicSession | null> {
    await delay(300);
    return mockSessions.find((s) => s.isCurrent) || null;
  },

  async createSession(data: CreateSessionRequest): Promise<AcademicSession> {
    await delay(700);
    const newSession: AcademicSession = {
      id: `ses-${String(mockSessions.length + 1).padStart(3, "0")}`,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      isCurrent: data.isCurrent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (data.isCurrent) {
      mockSessions.forEach((s) => (s.isCurrent = false));
    }
    mockSessions.push(newSession);
    return newSession;
  },

  async createSessionWithCarryForward(data: CreateSessionRequest, carryForward: boolean): Promise<AcademicSession> {
    await delay(800);
    const newSession = await this.createSession(data);
    if (carryForward && mockSessions.length > 1) {
      const previousSession = mockSessions[mockSessions.length - 2];
      if (previousSession) {
        const { assignmentService } = await import("./assignment.service");
        await assignmentService.carryForwardAssignments(previousSession.id, newSession.id);
      }
    }
    return newSession;
  },

  async updateSession(id: string, data: Partial<AcademicSession>): Promise<AcademicSession> {
    await delay(500);
    const index = mockSessions.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Session not found");
    if (data.isCurrent) {
      mockSessions.forEach((s) => (s.isCurrent = false));
    }
    mockSessions[index] = {
      ...mockSessions[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return mockSessions[index];
  },

  async setCurrentSession(id: string): Promise<void> {
    await delay(400);
    mockSessions.forEach((s) => (s.isCurrent = s.id === id));
  },
};

