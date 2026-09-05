import { AcademicSession, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiErrorClass } from '../utils/response';
import type { CreateSessionInput, UpdateSessionInput } from '../validators/session.validator';

export interface SessionResponse {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toSessionResponse(session: AcademicSession): SessionResponse {
  return {
    id: session.id,
    name: session.name,
    startDate: session.startDate.toISOString().split('T')[0],
    endDate: session.endDate.toISOString().split('T')[0],
    isCurrent: session.isCurrent,
    isActive: session.isActive,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

export const sessionService = {
  /**
   * List all academic sessions, ordered by start date descending.
   */
  async getSessions(): Promise<SessionResponse[]> {
    const sessions = await prisma.academicSession.findMany({
      orderBy: { startDate: 'desc' },
    });
    return sessions.map(toSessionResponse);
  },

  /**
   * Get a single session by ID.
   */
  async getSessionById(id: string): Promise<SessionResponse> {
    const session = await prisma.academicSession.findUnique({ where: { id } });
    if (!session) {
      throw new ApiErrorClass(404, 'Academic session not found', 'SessionNotFound');
    }
    return toSessionResponse(session);
  },

  /**
   * Get the current active session. Returns null if none is set.
   */
  async getCurrentSession(): Promise<SessionResponse | null> {
    const session = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });
    return session ? toSessionResponse(session) : null;
  },

  /**
   * Check if any session exists. Used to determine if first-time setup is needed.
   */
  async hasSessions(): Promise<boolean> {
    const count = await prisma.academicSession.count();
    return count > 0;
  },

  /**
   * Create a new academic session. If isCurrent is true, all other sessions
   * are marked as not current (only one session can be current at a time).
   * Optionally carries forward assignments from the most recent prior session.
   */
  async createSession(input: CreateSessionInput): Promise<SessionResponse> {
    // Check for duplicate name
    const existing = await prisma.academicSession.findUnique({
      where: { name: input.name },
    });
    if (existing) {
      throw new ApiErrorClass(
        409,
        'An academic session with this name already exists',
        'SessionNameTaken'
      );
    }

    // If this is the first session, force isCurrent = true
    const totalSessions = await prisma.academicSession.count();
    const isCurrent = totalSessions === 0 ? true : input.isCurrent;

    const newSession = await prisma.$transaction(async (tx) => {
      // If marking as current, unmark all others
      if (isCurrent) {
        await tx.academicSession.updateMany({
          where: { isCurrent: true },
          data: { isCurrent: false },
        });
      }

      return tx.academicSession.create({
        data: {
          name: input.name,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          isCurrent,
          isActive: true,
        },
      });
    });

    // Carry forward assignments if requested (after session is created)
    if (input.carryForward && totalSessions > 0) {
      // Find the most recent prior session
      const previousSession = await prisma.academicSession.findFirst({
        where: {
          startDate: { lt: newSession.startDate },
        },
        orderBy: { startDate: 'desc' },
      });
      if (previousSession) {
        await this.carryForwardAssignments(previousSession.id, newSession.id);
      }
    }

    // Auto-create 3 default terms with 2 sequences each
    const existingTerms = await prisma.term.count({ where: { sessionId: newSession.id } });
    if (existingTerms === 0) {
      const sessionStart = newSession.startDate.getTime();
      const sessionEnd = newSession.endDate.getTime();
      const termDuration = (sessionEnd - sessionStart) / 3;
      const termNames = ['First Term', 'Second Term', 'Third Term'];

      for (let i = 0; i < 3; i++) {
        const termStart = new Date(sessionStart + i * termDuration);
        const termEnd = new Date(sessionStart + (i + 1) * termDuration);
        const term = await prisma.term.create({
          data: {
            sessionId: newSession.id,
            name: termNames[i],
            sequenceCount: 2,
            startDate: termStart,
            endDate: termEnd,
            isCurrent: i === 0,
          },
        });

        // Create 2 sequences per term
        const seqDuration = (termEnd.getTime() - termStart.getTime()) / 2;
        const baseSeqNumber = i * 2 + 1;
        for (let j = 0; j < 2; j++) {
          const seqStart = new Date(termStart.getTime() + j * seqDuration);
          const seqEnd = new Date(termStart.getTime() + (j + 1) * seqDuration);
          await prisma.sequence.create({
            data: {
              termId: term.id,
              sessionId: newSession.id,
              name: `Sequence ${baseSeqNumber + j}`,
              number: baseSeqNumber + j,
              startDate: seqStart,
              endDate: seqEnd,
              isActive: false,
            },
          });
        }
      }
    }

    return toSessionResponse(newSession);
  },

  /**
   * Update a session.
   */
  async updateSession(id: string, input: UpdateSessionInput): Promise<SessionResponse> {
    const existing = await prisma.academicSession.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Academic session not found', 'SessionNotFound');
    }

    if (input.name && input.name !== existing.name) {
      const dup = await prisma.academicSession.findUnique({
        where: { name: input.name },
      });
      if (dup) {
        throw new ApiErrorClass(409, 'A session with this name already exists', 'SessionNameTaken');
      }
    }

    const data: Prisma.AcademicSessionUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) data.endDate = new Date(input.endDate);
    if (input.isCurrent !== undefined) data.isCurrent = input.isCurrent;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const result = await prisma.$transaction(async (tx) => {
      if (input.isCurrent === true) {
        await tx.academicSession.updateMany({
          where: { isCurrent: true, NOT: { id } },
          data: { isCurrent: false },
        });
      }
      return tx.academicSession.update({ where: { id }, data });
    });

    return toSessionResponse(result);
  },

  /**
   * Set a session as the current one. Unsets all others.
   */
  async setCurrentSession(id: string): Promise<SessionResponse> {
    const existing = await prisma.academicSession.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Academic session not found', 'SessionNotFound');
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.academicSession.updateMany({
        where: { isCurrent: true, NOT: { id } },
        data: { isCurrent: false },
      });
      return tx.academicSession.update({
        where: { id },
        data: { isCurrent: true, isActive: true },
      });
    });

    return toSessionResponse(result);
  },

  /**
   * Archive a session (soft delete). Sets isActive = false.
   * Cannot archive the currently active session.
   */
  async archiveSession(id: string): Promise<SessionResponse> {
    const existing = await prisma.academicSession.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Academic session not found', 'SessionNotFound');
    }
    if (!existing.isActive) {
      throw new ApiErrorClass(400, 'Session is already archived', 'SessionAlreadyArchived');
    }

    const result = await prisma.academicSession.update({
      where: { id },
      data: { isActive: false },
    });

    return toSessionResponse(result);
  },

  /**
   * Carry forward teacher assignments from one session to another.
   * Existing duplicates in the target session are skipped to preserve
   * the unique constraint.
   */
  async carryForwardAssignments(
    fromSessionId: string,
    toSessionId: string
  ): Promise<{ carried: number; skipped: number }> {
    if (fromSessionId === toSessionId) {
      throw new ApiErrorClass(400, 'Cannot carry forward to the same session', 'InvalidSession');
    }

    const [from, to] = await Promise.all([
      prisma.academicSession.findUnique({ where: { id: fromSessionId } }),
      prisma.academicSession.findUnique({ where: { id: toSessionId } }),
    ]);

    if (!from || !to) {
      throw new ApiErrorClass(404, 'One or both sessions not found', 'SessionNotFound');
    }

    const sourceAssignments = await prisma.assignment.findMany({
      where: { sessionId: fromSessionId },
    });

    let carried = 0;
    let skipped = 0;

    for (const a of sourceAssignments) {
      try {
        await prisma.assignment.create({
          data: {
            teacherId: a.teacherId,
            classId: a.classId,
            subjectId: a.subjectId,
            sessionId: toSessionId,
          },
        });
        carried++;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          // Duplicate - skip
          skipped++;
        } else {
          throw error;
        }
      }
    }

    return { carried, skipped };
  },
};
