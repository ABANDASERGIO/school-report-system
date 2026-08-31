import type { Sequence, CreateSequenceRequest } from "@/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockSequences: Sequence[] = [
  { id: "seq-001", termId: "trm-001", name: "Sequence One", number: 1, startDate: "2026-09-01", endDate: "2026-10-25", isActive: true },
  { id: "seq-002", termId: "trm-001", name: "Sequence Two", number: 2, startDate: "2026-10-26", endDate: "2026-12-20", isActive: false },
  { id: "seq-003", termId: "trm-002", name: "Sequence Three", number: 1, startDate: "2027-01-05", endDate: "2027-02-20", isActive: false },
  { id: "seq-004", termId: "trm-002", name: "Sequence Four", number: 2, startDate: "2027-02-21", endDate: "2027-04-10", isActive: false },
  { id: "seq-005", termId: "trm-003", name: "Sequence Five", number: 1, startDate: "2027-04-20", endDate: "2027-06-05", isActive: false },
  { id: "seq-006", termId: "trm-003", name: "Sequence Six", number: 2, startDate: "2027-06-06", endDate: "2027-07-31", isActive: false },
];

export const sequenceService = {
  async getSequences(termId?: string): Promise<Sequence[]> {
    await delay(400);
    if (termId) {
      return mockSequences.filter((s) => s.termId === termId);
    }
    return [...mockSequences];
  },

  async getSequenceById(id: string): Promise<Sequence | undefined> {
    await delay(300);
    return mockSequences.find((s) => s.id === id);
  },

  async getActiveSequence(): Promise<Sequence | null> {
    await delay(300);
    return mockSequences.find((s) => s.isActive) || null;
  },

  async createSequence(data: CreateSequenceRequest): Promise<Sequence> {
    await delay(600);
    const newSequence: Sequence = {
      id: `seq-${String(mockSequences.length + 1).padStart(3, "0")}`,
      termId: data.termId,
      name: data.name,
      number: data.number,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive,
    };
    if (data.isActive) {
      mockSequences.forEach((s) => (s.isActive = false));
    }
    mockSequences.push(newSequence);
    return newSequence;
  },

  async setActiveSequence(id: string): Promise<void> {
    await delay(400);
    mockSequences.forEach((s) => (s.isActive = s.id === id));
  },

  async updateSequence(id: string, data: Partial<Sequence>): Promise<Sequence> {
    await delay(500);
    const index = mockSequences.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Sequence not found");
    if (data.isActive) {
      mockSequences.forEach((s) => (s.isActive = false));
    }
    mockSequences[index] = { ...mockSequences[index], ...data };
    return mockSequences[index];
  },
};

