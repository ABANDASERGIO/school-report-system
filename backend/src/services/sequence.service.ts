import { Sequence, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiErrorClass } from '../utils/response';
import type { CreateSequenceInput, UpdateSequenceInput } from '../validators/sequence.validator';

export interface SequenceResponse {
  id: string;
  termId: string;
  sessionId: string;
  name: string;
  number: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  term?: {
    id: string;
    name: string;
  };
}

function toSequenceResponse(
  seq: Sequence,
  term?: { id: string; name: string } | null
): SequenceResponse {
  return {
    id: seq.id,
    termId: seq.termId,
    sessionId: seq.sessionId,
    name: seq.name,
    number: seq.number,
    startDate: seq.startDate.toISOString().split('T')[0],
    endDate: seq.endDate.toISOString().split('T')[0],
    isActive: seq.isActive,
    createdAt: seq.createdAt.toISOString(),
    updatedAt: seq.updatedAt.toISOString(),
    ...(term && { term }),
  };
}

export const sequenceService = {
  /**
   * List all sequences, optionally filtered by termId.
   */
  async getSequences(termId?: string): Promise<SequenceResponse[]> {
    const sequences = await prisma.sequence.findMany({
      where: termId ? { termId } : undefined,
      orderBy: [{ sessionId: 'asc' }, { termId: 'asc' }, { number: 'asc' }],
      include: { term: { select: { id: true, name: true } } },
    });
    return sequences.map((s) => toSequenceResponse(s, s.term));
  },

  /**
   * Get a single sequence by ID.
   */
  async getSequenceById(id: string): Promise<SequenceResponse> {
    const seq = await prisma.sequence.findUnique({
      where: { id },
      include: { term: { select: { id: true, name: true } } },
    });
    if (!seq) {
      throw new ApiErrorClass(404, 'Sequence not found', 'SequenceNotFound');
    }
    return toSequenceResponse(seq, seq.term);
  },

  /**
   * Get the active sequence. Returns null if none is active.
   */
  async getActiveSequence(): Promise<SequenceResponse | null> {
    const seq = await prisma.sequence.findFirst({
      where: { isActive: true },
      include: { term: { select: { id: true, name: true } } },
    });
    return seq ? toSequenceResponse(seq, seq.term) : null;
  },

  /**
   * Create a new sequence.
   */
  async createSequence(input: CreateSequenceInput): Promise<SequenceResponse> {
    const term = await prisma.term.findUnique({ where: { id: input.termId } });
    if (!term) {
      throw new ApiErrorClass(404, 'Term not found', 'TermNotFound');
    }

    // Check unique constraint (termId, number)
    const existing = await prisma.sequence.findUnique({
      where: { termId_number: { termId: input.termId, number: input.number } },
    });
    if (existing) {
      throw new ApiErrorClass(
        409,
        'A sequence with this number already exists in this term',
        'SequenceNumberTaken'
      );
    }

    const newSeq = await prisma.$transaction(async (tx) => {
      // If marking as active, deactivate others in the same session
      if (input.isActive) {
        await tx.sequence.updateMany({
          where: { sessionId: term.sessionId, isActive: true },
          data: { isActive: false },
        });
      }

      return tx.sequence.create({
        data: {
          termId: input.termId,
          sessionId: term.sessionId,
          name: input.name,
          number: input.number,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          isActive: input.isActive,
        },
      });
    });

    return toSequenceResponse(newSeq);
  },

  /**
   * Update a sequence.
   */
  async updateSequence(id: string, input: UpdateSequenceInput): Promise<SequenceResponse> {
    const existing = await prisma.sequence.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Sequence not found', 'SequenceNotFound');
    }

    const result = await prisma.$transaction(async (tx) => {
      if (input.isActive === true) {
        await tx.sequence.updateMany({
          where: { sessionId: existing.sessionId, isActive: true, NOT: { id } },
          data: { isActive: false },
        });
      }

      const data: Prisma.SequenceUpdateInput = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.number !== undefined) data.number = input.number;
      if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
      if (input.endDate !== undefined) data.endDate = new Date(input.endDate);
      if (input.isActive !== undefined) data.isActive = input.isActive;

      return tx.sequence.update({ where: { id }, data });
    });

    return toSequenceResponse(result);
  },

  /**
   * Set a sequence as the active one (deactivates others in same session).
   */
  async setActiveSequence(id: string): Promise<SequenceResponse> {
    const existing = await prisma.sequence.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Sequence not found', 'SequenceNotFound');
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.sequence.updateMany({
        where: { sessionId: existing.sessionId, isActive: true, NOT: { id } },
        data: { isActive: false },
      });
      return tx.sequence.update({
        where: { id },
        data: { isActive: true },
      });
    });

    return toSequenceResponse(result);
  },
};
