import { Term, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiErrorClass } from '../utils/response';
import type { CreateTermInput, UpdateTermInput } from '../validators/term.validator';

export interface TermResponse {
  id: string;
  sessionId: string;
  name: string;
  sequenceCount: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
  session?: {
    id: string;
    name: string;
  };
  sequences?: Array<{
    id: string;
    termId: string;
    name: string;
    number: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>;
}

function toTermResponse(
  term: Term,
  session?: { id: string; name: string } | null,
  sequences?: Array<{
    id: string;
    name: string;
    number: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }>
): TermResponse {
  return {
    id: term.id,
    sessionId: term.sessionId,
    name: term.name,
    sequenceCount: term.sequenceCount,
    startDate: term.startDate.toISOString().split('T')[0],
    endDate: term.endDate.toISOString().split('T')[0],
    isCurrent: term.isCurrent,
    createdAt: term.createdAt.toISOString(),
    updatedAt: term.updatedAt.toISOString(),
    ...(session && { session }),
    ...(sequences && {
      sequences: sequences.map((s) => ({
        id: s.id,
        termId: s.termId,
        name: s.name,
        number: s.number,
        startDate: s.startDate.toISOString().split('T')[0],
        endDate: s.endDate.toISOString().split('T')[0],
        isActive: s.isActive,
      })),
    }),
  };
}

export const termService = {
  /**
   * List all terms, optionally filtered by sessionId.
   */
  async getTerms(sessionId?: string): Promise<TermResponse[]> {
    const terms = await prisma.term.findMany({
      where: sessionId ? { sessionId } : undefined,
      orderBy: [{ sessionId: 'asc' }, { startDate: 'asc' }],
      include: {
        session: { select: { id: true, name: true } },
        sequences: { orderBy: { number: 'asc' } },
      },
    });
    return terms.map((t) => toTermResponse(t, t.session, t.sequences));
  },

  /**
   * Get a single term by ID with its sequences.
   */
  async getTermById(id: string): Promise<TermResponse> {
    const term = await prisma.term.findUnique({
      where: { id },
      include: {
        session: { select: { id: true, name: true } },
        sequences: {
          orderBy: { number: 'asc' },
          select: {
            id: true,
            name: true,
            number: true,
            startDate: true,
            endDate: true,
            isActive: true,
          },
        },
      },
    });
    if (!term) {
      throw new ApiErrorClass(404, 'Term not found', 'TermNotFound');
    }
    return toTermResponse(term, term.session, term.sequences);
  },

  /**
   * Create a new term. Optionally auto-creates the configured number of sequences.
   */
  async createTerm(input: CreateTermInput, autoCreateSequences = true): Promise<TermResponse> {
    // Verify session exists
    const session = await prisma.academicSession.findUnique({
      where: { id: input.sessionId },
    });
    if (!session) {
      throw new ApiErrorClass(404, 'Academic session not found', 'SessionNotFound');
    }

    const result = await prisma.$transaction(async (tx) => {
      const newTerm = await tx.term.create({
        data: {
          sessionId: input.sessionId,
          name: input.name,
          sequenceCount: input.sequenceCount,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
        },
      });

      // Auto-create sequences if requested
      if (autoCreateSequences && input.sequenceCount > 0) {
        const termStart = new Date(input.startDate).getTime();
        const termEnd = new Date(input.endDate).getTime();
        const slotDuration = (termEnd - termStart) / input.sequenceCount;
        const sequenceNames = [
          'Sequence One', 'Sequence Two', 'Sequence Three', 'Sequence Four',
          'Sequence Five', 'Sequence Six',
        ];

        for (let i = 0; i < input.sequenceCount; i++) {
          const seqStart = new Date(termStart + i * slotDuration);
          const seqEnd = new Date(termStart + (i + 1) * slotDuration);
          await tx.sequence.create({
            data: {
              termId: newTerm.id,
              sessionId: input.sessionId,
              name: sequenceNames[i] || `Sequence ${i + 1}`,
              number: i + 1,
              startDate: seqStart,
              endDate: seqEnd,
              isActive: i === 0, // First sequence is active by default
            },
          });
        }
      }

      return newTerm;
    });

    // Re-fetch with relations
    return this.getTermById(result.id);
  },

  /**
   * Update a term.
   */
  async updateTerm(id: string, input: UpdateTermInput): Promise<TermResponse> {
    const existing = await prisma.term.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Term not found', 'TermNotFound');
    }

    const data: Prisma.TermUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.sequenceCount !== undefined) data.sequenceCount = input.sequenceCount;
    if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) data.endDate = new Date(input.endDate);

    await prisma.term.update({ where: { id }, data });
    return this.getTermById(id);
  },

  /**
   * Set a term as the current one for its session. Unsets all other terms
   * in the same session.
   */
  async setCurrentTerm(termId: string, sessionId: string): Promise<TermResponse> {
    const term = await prisma.term.findUnique({ where: { id: termId } });
    if (!term || term.sessionId !== sessionId) {
      throw new ApiErrorClass(404, 'Term not found', 'TermNotFound');
    }

    await prisma.$transaction(async (tx) => {
      await tx.term.updateMany({
        where: { sessionId, isCurrent: true, NOT: { id: termId } },
        data: { isCurrent: false },
      });
      await tx.term.update({
        where: { id: termId },
        data: { isCurrent: true },
      });
    });

    return this.getTermById(termId);
  },
};
