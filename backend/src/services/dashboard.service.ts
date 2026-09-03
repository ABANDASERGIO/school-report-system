import { prisma } from '../config/database';
import { sessionService } from './session.service';

export interface ProprietorDashboardData {
  totalStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  pendingResults: number;
  submittedResults: number;
  lockedResults: number;
  currentSession: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
  } | null;
  recentEnrollments: number;
  totalAssignments: number;
}

export interface TeacherDashboardData {
  teacher: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    photoUrl: string;
    photoPublicId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  assignments: Array<{
    id: string;
    teacherId: string;
    classId: string;
    className: string;
    classCode: string;
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    subjectCoefficient: number;
    sessionId: string;
    sessionName: string;
  }>;
  currentSession: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
  } | null;
  totalStudents: number;
  totalClasses: number;
  totalSubjects: number;
  pendingResults: number;
  submittedResults: number;
  lockedResults: number;
}

/**
 * Build the proprietor dashboard. All counts come straight from Prisma.
 * "Recent enrollments" is the number of ACTIVE enrollments in the current
 * session (a proxy for "how many students registered this year").
 */
export async function buildProprietorDashboard(): Promise<ProprietorDashboardData> {
  const current = await sessionService.getCurrentSession();

  const [
    totalStudents,
    totalTeachers,
    activeTeachers,
    totalClasses,
    totalSubjects,
    resultCounts,
    recentEnrollments,
    totalAssignments,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.teacher.count({ where: { isActive: true } }),
    prisma.class.count(),
    prisma.subject.count(),
    prisma.result.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    current
      ? prisma.enrollment.count({
          where: { sessionId: current.id, status: 'ACTIVE' },
        })
      : Promise.resolve(0),
    prisma.assignment.count(),
  ]);

  const counts = { draft: 0, submitted: 0, locked: 0 };
  for (const row of resultCounts) {
    if (row.status === 'DRAFT') counts.draft = row._count._all;
    else if (row.status === 'SUBMITTED') counts.submitted = row._count._all;
    else if (row.status === 'LOCKED') counts.locked = row._count._all;
  }

  return {
    totalStudents,
    totalTeachers,
    activeTeachers,
    totalClasses,
    totalSubjects,
    pendingResults: counts.draft,
    submittedResults: counts.submitted,
    lockedResults: counts.locked,
    currentSession: current,
    recentEnrollments,
    totalAssignments,
  };
}

/**
 * Build the teacher dashboard. Resolves the Teacher row for the
 * currently authenticated user, then aggregates over their assignments.
 *
 * - totalStudents / totalClasses / totalSubjects = distinct across the
 *   teacher's assignments in the current session
 * - pending/submitted/locked = result counts where
 *   (subjectId, sessionId) match one of the teacher's assignments
 */
export async function buildTeacherDashboard(userId: string): Promise<TeacherDashboardData> {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
  });
  if (!teacher) {
    // Return a skeleton shape so the UI can render an empty state rather
    // than crashing. The frontend will treat it as "no teacher profile".
    const current = await sessionService.getCurrentSession();
    return {
      teacher: {
        id: '',
        userId,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        photoUrl: '',
        photoPublicId: '',
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      assignments: [],
      currentSession: current,
      totalStudents: 0,
      totalClasses: 0,
      totalSubjects: 0,
      pendingResults: 0,
      submittedResults: 0,
      lockedResults: 0,
    };
  }

  const current = await sessionService.getCurrentSession();
  const sessionFilter = current ? { sessionId: current.id } : {};

  const rawAssignments = await prisma.assignment.findMany({
    where: { teacherId: teacher.id, ...sessionFilter },
    include: {
      class: { select: { id: true, name: true, code: true } },
      subject: { select: { id: true, name: true, code: true, coefficient: true } },
      session: { select: { id: true, name: true } },
    },
    orderBy: [{ class: { name: 'asc' } }, { subject: { name: 'asc' } }],
  });

  const assignments = rawAssignments.map((a) => ({
    id: a.id,
    teacherId: a.teacherId,
    classId: a.classId,
    className: a.class.name,
    classCode: a.class.code,
    subjectId: a.subjectId,
    subjectName: a.subject.name,
    subjectCode: a.subject.code,
    subjectCoefficient: a.subject.coefficient,
    sessionId: a.sessionId,
    sessionName: a.session.name,
  }));

  const distinctClassIds = Array.from(new Set(assignments.map((a) => a.classId)));
  const distinctSubjectIds = Array.from(new Set(assignments.map((a) => a.subjectId)));

  // Count active enrollments across the teacher's classes
  const totalStudents =
    current && distinctClassIds.length > 0
      ? await prisma.enrollment.count({
          where: {
            classId: { in: distinctClassIds },
            sessionId: current.id,
            status: 'ACTIVE',
          },
        })
      : 0;

  // Count results for the teacher's subject/session pairs
  const resultWhere = current
    ? {
        sessionId: current.id,
        subjectId: { in: distinctSubjectIds },
      }
    : {
        subjectId: { in: distinctSubjectIds },
      };

  const resultCounts = await prisma.result.groupBy({
    by: ['status'],
    where: resultWhere,
    _count: { _all: true },
  });

  const counts = { draft: 0, submitted: 0, locked: 0 };
  for (const row of resultCounts) {
    if (row.status === 'DRAFT') counts.draft = row._count._all;
    else if (row.status === 'SUBMITTED') counts.submitted = row._count._all;
    else if (row.status === 'LOCKED') counts.locked = row._count._all;
  }

  return {
    teacher: {
      id: teacher.id,
      userId: teacher.userId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone ?? '',
      address: teacher.address ?? '',
      photoUrl: teacher.photoUrl ?? '',
      photoPublicId: teacher.photoPublicId ?? '',
      isActive: teacher.isActive,
      createdAt: teacher.createdAt.toISOString(),
      updatedAt: teacher.updatedAt.toISOString(),
    },
    assignments,
    currentSession: current,
    totalStudents,
    totalClasses: distinctClassIds.length,
    totalSubjects: distinctSubjectIds.length,
    pendingResults: counts.draft,
    submittedResults: counts.submitted,
    lockedResults: counts.locked,
  };
}
