import type { Term, CreateTermRequest } from "@/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockTerms: Term[] = [
  {
    id: "trm-001",
    sessionId: "ses-003",
    name: "First Term",
    sequenceCount: 2,
    startDate: "2026-09-01",
    endDate: "2026-12-20",
  },
  {
    id: "trm-002",
    sessionId: "ses-003",
    name: "Second Term",
    sequenceCount: 2,
    startDate: "2027-01-05",
    endDate: "2027-04-10",
  },
  {
    id: "trm-003",
    sessionId: "ses-003",
    name: "Third Term",
    sequenceCount: 2,
    startDate: "2027-04-20",
    endDate: "2027-07-31",
  },
  {
    id: "trm-004",
    sessionId: "ses-002",
    name: "First Term",
    sequenceCount: 2,
    startDate: "2025-09-01",
    endDate: "2025-12-20",
  },
];

export const termService = {
  async getTerms(sessionId?: string): Promise<Term[]> {
    await delay(500);
    if (sessionId) {
      return mockTerms.filter((t) => t.sessionId === sessionId);
    }
    return [...mockTerms];
  },

  async getTermById(id: string): Promise<Term | undefined> {
    await delay(300);
    return mockTerms.find((t) => t.id === id);
  },

  async createTerm(data: CreateTermRequest): Promise<Term> {
    await delay(700);
    const newTerm: Term = {
      id: `trm-${String(mockTerms.length + 1).padStart(3, "0")}`,
      sessionId: data.sessionId,
      name: data.name,
      sequenceCount: data.sequenceCount,
      startDate: data.startDate,
      endDate: data.endDate,
    };
    mockTerms.push(newTerm);
    return newTerm;
  },

  async updateTerm(id: string, data: Partial<Term>): Promise<Term> {
    await delay(500);
    const index = mockTerms.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Term not found");
    mockTerms[index] = { ...mockTerms[index], ...data };
    return mockTerms[index];
  },
};

