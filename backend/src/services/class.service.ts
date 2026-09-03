import { Class, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiErrorClass } from '../utils/response';
import type { CreateClassInput, UpdateClassInput } from '../validators/class.validator';

export interface ClassResponse {
  id: string;
  name: string;
  code: string;
  description: string;
  subjectCount: number;
  createdAt: string;
  updatedAt: string;
}

function toClassResponse(cls: Class, subjectCount = 0): ClassResponse {
  return {
    id: cls.id,
    name: cls.name,
    code: cls.code,
    description: cls.description ?? '',
    subjectCount,
    createdAt: cls.createdAt.toISOString(),
    updatedAt: cls.updatedAt.toISOString(),
  };
}

export const classService = {
  /**
   * List all classes, ordered by name. Each class includes the number of
   * subjects currently assigned to it.
   */
  async getClasses(): Promise<ClassResponse[]> {
    const classes = await prisma.class.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { subjectClasses: true },
        },
      },
    });
    return classes.map((c) => toClassResponse(c, c._count.subjectClasses));
  },

  /**
   * Get a single class by ID.
   */
  async getClassById(id: string): Promise<ClassResponse> {
    const cls = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: { select: { subjectClasses: true } },
      },
    });
    if (!cls) {
      throw new ApiErrorClass(404, 'Class not found', 'ClassNotFound');
    }
    return toClassResponse(cls, cls._count.subjectClasses);
  },

  /**
   * Create a new class. Name and code must be unique.
   */
  async createClass(input: CreateClassInput): Promise<ClassResponse> {
    try {
      const cls = await prisma.class.create({
        data: {
          name: input.name,
          code: input.code,
          description: input.description || null,
        },
        include: {
          _count: { select: { subjectClasses: true } },
        },
      });
      return toClassResponse(cls, cls._count.subjectClasses);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.target as string[] | undefined)?.join(', ') || 'field';
        throw new ApiErrorClass(409, `A class with this ${target} already exists`, 'ClassDuplicate');
      }
      throw error;
    }
  },

  /**
   * Update a class. Checks for name/code conflicts with other classes.
   */
  async updateClass(id: string, input: UpdateClassInput): Promise<ClassResponse> {
    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiErrorClass(404, 'Class not found', 'ClassNotFound');
    }

    if (input.name && input.name !== existing.name) {
      const dup = await prisma.class.findUnique({ where: { name: input.name } });
      if (dup) {
        throw new ApiErrorClass(409, 'A class with this name already exists', 'ClassNameTaken');
      }
    }
    if (input.code && input.code !== existing.code) {
      const dup = await prisma.class.findUnique({ where: { code: input.code } });
      if (dup) {
        throw new ApiErrorClass(409, 'A class with this code already exists', 'ClassCodeTaken');
      }
    }

    const data: Prisma.ClassUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.code !== undefined) data.code = input.code;
    if (input.description !== undefined) data.description = input.description || null;

    try {
      const updated = await prisma.class.update({
        where: { id },
        data,
        include: {
          _count: { select: { subjectClasses: true } },
        },
      });
      return toClassResponse(updated, updated._count.subjectClasses);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApiErrorClass(409, 'A class with these details already exists', 'ClassDuplicate');
      }
      throw error;
    }
  },

  /**
   * Delete a class. Refuses if there are historical enrollments or assignments.
   */
  async deleteClass(id: string): Promise<void> {
    const existing = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: { select: { enrollments: true, assignments: true } },
      },
    });
    if (!existing) {
      throw new ApiErrorClass(404, 'Class not found', 'ClassNotFound');
    }
    if (existing._count.enrollments > 0) {
      throw new ApiErrorClass(
        400,
        `Cannot delete class with ${existing._count.enrollments} historical enrollment(s). Deactivate the class instead.`,
        'ClassInUse'
      );
    }
    if (existing._count.assignments > 0) {
      throw new ApiErrorClass(
        400,
        `Cannot delete class with ${existing._count.assignments} teacher assignment(s). Deactivate the class instead.`,
        'ClassInUse'
      );
    }
    // SubjectClass rows cascade automatically (pure junction table)
    await prisma.class.delete({ where: { id } });
  },

  /**
   * Search classes by name or code (case-insensitive contains).
   */
  async searchClasses(query: string): Promise<ClassResponse[]> {
    const classes = await prisma.class.findMany({
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
    return classes.map((c) => toClassResponse(c, c._count.subjectClasses));
  },
};
