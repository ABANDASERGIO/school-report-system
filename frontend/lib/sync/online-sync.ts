/**
 * Online-sync bootstrap: downloads all data the teacher needs to work
 * offline. Called on app boot when online. Replaces the IDB caches for
 * the current active session.
 */

import {
  replaceSessions,
  replaceTerms,
  replaceSequences,
} from '@/lib/db/repos/academic.repo';
import { replaceClasses as replaceClassesRepo, getAllClasses } from '@/lib/db/repos/classes.repo';
import { replaceSubjects as replaceSubjectsRepo } from '@/lib/db/repos/classes.repo';
import { replaceAssignments } from '@/lib/db/repos/assignments.repo';
import { replaceStudents } from '@/lib/db/repos/students.repo';
import { replaceEnrollments } from '@/lib/db/repos/enrollments.repo';
import { replaceResults } from '@/lib/db/repos/results.repo';
import { sessionService } from '@/services/session.service';
import { termService } from '@/services/term.service';
import { sequenceService } from '@/services/sequence.service';
import { classService } from '@/services/class.service';
import { subjectService } from '@/services/subject.service';
import { assignmentService } from '@/services/assignment.service';
import { studentService } from '@/services/student.service';
import { enrollmentService } from '@/services/enrollment.service';
import { resultService } from '@/services/result.service';
import type {
  DBSession,
  DBTerm,
  DBSequence,
  DBClass,
  DBSubject,
  DBAssignment,
  DBStudent,
  DBEnrollment,
  DBResult,
} from '@/lib/db/schema';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface OnlineSyncResult {
  sessions: DBSession[];
  terms: DBTerm[];
  sequences: DBSequence[];
  classes: DBClass[];
  subjects: DBSubject[];
  assignments: DBAssignment[];
  students: DBStudent[];
  enrollments: DBEnrollment[];
  results: DBResult[];
}

/**
 * Full sync: downloads every table the teacher needs for the current
 * active session. Returns the downloaded records so the caller can
 * update UI state.
 *
 * @param teacherId optional; when omitted we read the cached user from
 * localStorage (same as api-client does).
 */
export async function syncAllTeacherData(teacherId?: string): Promise<OnlineSyncResult> {
  // 1. Sessions, terms, sequences, classes, subjects
  const [sessions, termsRaw, sequencesRaw, classesRaw, subjectsRaw] =
    await Promise.all([
      sessionService.getSessions(),
      termService.getTerms(),
      sequenceService.getSequences(),
      classService.getClasses(),
      subjectService.getSubjects(),
    ]);

  const sessionsDb = sessions.map((s) => ({
    ...s,
    syncedAt: new Date().toISOString(),
  }));

  const current = sessionsDb.find((s) => s.isCurrent) || sessionsDb[0];

  const terms = termsRaw.map((t) => ({
    id: t.id,
    sessionId: t.sessionId,
    name: t.name,
    sequenceCount: t.sequenceCount,
    startDate: t.startDate,
    endDate: t.endDate,
    syncedAt: new Date().toISOString(),
  })) as DBTerm[];

  const sequences = sequencesRaw.map((s) => ({
    id: s.id,
    termId: s.termId,
    sessionId: s.term?.sessionId || current?.id || '',
    name: s.name,
    number: s.number,
    isActive: s.isActive,
    startDate: s.startDate,
    endDate: s.endDate,
    syncedAt: new Date().toISOString(),
  })) as DBSequence[];

  const classes = classesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    description: c.description,
    syncedAt: new Date().toISOString(),
  })) as DBClass[];

  const subjects = subjectsRaw.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    description: s.description,
    coefficient: s.coefficient,
    syncedAt: new Date().toISOString(),
  })) as DBSubject[];

  // 2. Teacher's assignments
  const resolvedTeacherId =
    teacherId ||
    (typeof window !== 'undefined'
      ? (() => {
          try {
            const raw = localStorage.getItem('edugrade_user');
            return raw ? JSON.parse(raw).id : undefined;
          } catch {
            return undefined;
          }
        })()
      : undefined);
  const assignmentsRaw = resolvedTeacherId
    ? await assignmentService.getAssignmentsByTeacher(resolvedTeacherId)
    : [];
  const classIds = new Set(assignmentsRaw.map((a) => a.classId));
  const sessionMap = new Map(sessionsDb.map((s) => [s.id, s.name]));

  const assignments: DBAssignment[] = assignmentsRaw.map((a) => ({
    id: a.id,
    teacherId: a.teacherId,
    classId: a.classId,
    subjectId: a.subjectId,
    sessionId: a.sessionId,
    className: a.class?.name,
    subjectName: a.subject?.name,
    sessionName: sessionMap.get(a.sessionId),
    subjectCode: a.subject?.code,
    syncedAt: new Date().toISOString(),
  }));

  // 3. Students + enrollments for the classes the teacher teaches
  const [studentsRaw, enrollmentsRaw, resultsRaw] = await Promise.all([
    classIds.size > 0 ? studentService.getStudents() : Promise.resolve([]),
    classIds.size > 0
      ? Promise.all(
          Array.from(classIds).map((cid) =>
            enrollmentService.getActiveEnrollmentsByClass(cid, current?.id || '')
          )
        ).then((arrs) => arrs.flat())
      : Promise.resolve([]),
    current
      ? resultService.getResults(undefined)
      : Promise.resolve([]),
  ]);

  const students = studentsRaw.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    studentNumber: s.studentNumber,
    gender: s.gender,
    dateOfBirth: s.dateOfBirth,
    placeOfBirth: s.placeOfBirth,
    address: s.address,
    phone: s.phone,
    parentName: s.parentName,
    parentPhone: s.parentPhone,
    photoUrl: s.photoUrl,
    syncedAt: new Date().toISOString(),
  })) as DBStudent[];

  const enrollments = enrollmentsRaw.map((e) => ({
    id: e.id,
    studentId: e.studentId,
    classId: e.classId,
    sessionId: e.sessionId,
    status: e.status,
    enrollmentDate: e.enrollmentDate,
    studentName: e.student ? `${e.student.firstName} ${e.student.lastName}` : undefined,
    studentNumber: e.student?.studentNumber,
    syncedAt: new Date().toISOString(),
  })) as DBEnrollment[];

  const results = resultsRaw.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    subjectId: r.subjectId,
    sequenceId: r.sequenceId,
    enrollmentId: r.enrollmentId,
    sessionId: r.sessionId,
    score: r.score ?? null,
    total: r.total,
    status: r.status,
    submittedAt: r.submittedAt ?? null,
    dirty: 0,
    pendingOpId: undefined,
    syncedAt: new Date().toISOString(),
    studentName: r.student ? `${r.student.firstName} ${r.student.lastName}` : undefined,
    studentNumber: r.student?.studentNumber,
  })) as DBResult[];

  // 4. Persist all to IDB in one batch
  await Promise.all([
    replaceSessions(sessionsDb),
    replaceTerms(terms),
    replaceSequences(sequences),
    replaceClassesRepo(classes),
    replaceSubjectsRepo(subjects),
    replaceAssignments(assignments),
    replaceStudents(students),
    replaceEnrollments(enrollments),
    replaceResults(results),
  ]);

  return {
    sessions: sessionsDb,
    terms,
    sequences,
    classes,
    subjects,
    assignments,
    students,
    enrollments,
    results,
  };
}
