import { Subject, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiErrorClass } from '../utils/response';
import type { CreateSubjectInput, UpdateSubjectInput } from '../validators/subject.validator';

export interface SubjectResponse {
  id: string;
  name: string;
  code: string;
  description: string;
  coefficient: number;
  classCount: number;
  createdAt: string;
  updatedAt: string;
}

function toSubjectResponse(subject: Subject, classCount = 0): SubjectResponse {
  return {
    id: subject.id,
    name: subject.name,
    code: subject.code,
    description: subject.description ?? '',
    coefficient: subject.coefficient,
    classCount,
    createdAt: subject.createdAt.toISOString(),
    updatedAt: subject.updatedAt.toISOString(),
  };
}

export const subjectService = {
  /**
   * List all subjects, ordered by name. Includes class count.
   */
  async getSubjects(): Promise<SubjectResponse[]> {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { subjectClasses: true } },
      },
    });
    return subjects.map((s) => toSubjectResponse(s, s._count.subjectClasses));
  },

  /**
   * Get a single subject by ID.
   */
  async getSubjectById(id: string): Promise<SubjectResponse> {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: { select: { subjectClasses: true } },
      },
    });
    if (!subject) {
      throw new ApiErrorClass(404, 'Subject not found', 'SubjectNotFound');
    }
    return toSubjectResponse(subject, subject._count.subjectClasses);
  },

  /**
   * Create a new subject. Name and code must be unique.
   */
  async createSubject(input: CreateSubjectInput): Promise<SubjectResponse> {
    try {
      const subject = await prisma.subject.create({
        data: {
          name: input.name,
          code: input.code,
          description: input.description || null,
          coefficient: input.coefficient,
        },
        include: {
          _count: { select: { subjectClasses: true } },
        },
      });
      return toSubjectResponse(subject, subject._count.subjectClasses);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.target as string[] | undefined)?.join(', ') || 'field';
        throw new ApiErrorClass(409, `A subject with this ${target} already exists`, 'SubjectDuplicate');
      }
      throw error;
    }
  },

  /**
   * Update a subject. Checks for name/code conflicts.
   */
  async updateSubject(id: string, input: UpdateSubjectInput): Promise<SubjectResponse> {
    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Subject not found', 'SubjectNotFound');
    }

    if (input.name && input.name !== existing.name) {
      const dup = await prisma.subject.findUnique({ where: { name: input.name } });
      if (dup) {
        throw new ApiErrorClass(409, 'A subject with this name already exists', 'SubjectNameTaken');
      }
    }
    if (input.code && input.code !== existing.code) {
      const dup = await prisma.subject.findUnique({ where: { code: input.code } });
      if (dup) {
        throw new ApiErrorClass(409, 'A subject with this code already exists', 'SubjectCodeTaken');
      }
    }

    const data: Prisma.SubjectUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.code !== undefined) data.code = input.code;
    if (input.description !== undefined) data.description = input.description || null;
    if (input.coefficient !== undefined) data.coefficient = input.coefficient;

    try {
      const updated = await prisma.subject.update({
        where: { id },
        data,
        include: {
          _count: { select: { subjectClasses: true } },
        },
      });
      return toSubjectResponse(updated, updated._count.subjectClasses);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApiErrorClass(409, 'A subject with these details already exists', 'SubjectDuplicate');
      }
      throw error;
    }
  },

  /**
   * Delete a subject. Refuses if there are historical results or assignments.
   */
  async deleteSubject(id: string): Promise<void> {
    const existing = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: { select: { results: true, assignments: true } },
      },
    });
    if (!existing) {
      throw new ApiErrorClass(404, 'Subject not found', 'SubjectNotFound');
    }
    if (existing._count.results > 0) {
      throw new ApiErrorClass(
        400,
        `Cannot delete subject with ${existing._count.results} historical result(s).`,
        'SubjectInUse'
      );
    }
    if (existing._count.assignments > 0) {
      throw new ApiErrorClass(
        400,
        `Cannot delete subject with ${existing._count.assignments} teacher assignment(s).`,
        'SubjectInUse'
      );
    }
    // SubjectClass rows cascade automatically
    await prisma.subject.delete({ where: { id } });
  },

  /**
   * Search subjects by name or code (case-insensitive).
   */
  async searchSubjects(query: string): Promise<SubjectResponse[]> {
    const subjects = await prisma.subject.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { subjectClasses: true } },
      },
    });
    return subjects.map((s) => toSubjectResponse(s, s._count.subjectClasses));
  },

  /**
   * Get the list of subject IDs assigned to a class.
   */
  async getSubjectIdsForClass(classId: string): Promise<string[]> {
    const classExists = await prisma.class.findUnique({ where: { id: classId } });
    if (!classExists) {
      throw new ApiErrorClass(404, 'Class not found', 'ClassNotFound');
    }
    const links = await prisma.subjectClass.findMany({
      where: { classId },
      select: { subjectId: true },
    });
    return links.map((l) => l.subjectId);
  },

  /**
   * Get the list of class IDs assigned to a subject.
   */
  async getClassIdsForSubject(subjectId: string): Promise<string[]> {
    const subjectExists = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subjectExists) {
      throw new ApiErrorClass(404, 'Subject not found', 'SubjectNotFound');
    }
    const links = await prisma.subjectClass.findMany({
      where: { subjectId },
      select: { classId: true },
    });
    return links.map((l) => l.classId);
  },

  /**
   * Replace the set of subjects assigned to a class. Drops existing
   * SubjectClass rows for the class and recreates the provided set.
   * Duplicates in the input are de-duplicated.
   */
  async setSubjectsForClass(classId: string, subjectIds: string[]): Promise<string[]> {
    const classExists = await prisma.class.findUnique({ where: { id: classId } });
    if (!classExists) {
      throw new ApiErrorClass(404, 'Class not found', 'ClassNotFound');
    }

    const uniqueIds = Array.from(new Set(subjectIds));

    if (uniqueIds.length > 0) {
      // Validate that every subject exists in one query
      const found = await prisma.subject.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true },
      });
      if (found.length !== uniqueIds.length) {
        throw new ApiErrorClass(400, 'One or more subjects do not exist', 'InvalidSubject');
      }
    }

    await prisma.$transaction([
      prisma.subjectClass.deleteMany({ where: { classId } }),
      ...(uniqueIds.length > 0
        ? [
            prisma.subjectClass.createMany({
              data: uniqueIds.map((subjectId) => ({ classId, subjectId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    return uniqueIds;
  },

  /**
   * Get the list of class IDs assigned to a subject (returns just the IDs
   * used by frontend, no metadata).
   */
  async getClassesIdsOnlyForSubject(subjectId: string): Promise<string[]> {
    return this.getClassIdsForSubject(subjectId);
  },
};
