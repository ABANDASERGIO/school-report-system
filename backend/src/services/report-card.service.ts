import { prisma } from '../config/database';
import { ApiErrorClass } from '../utils/response';
import { settingsService } from './settings.service';
import type { ReportCardData, ReportCardType, SubjectResult } from '../types/report-card';

// Maximum score per result. Matches the default in the settings service.
const DEFAULT_MAX_SCORE = 20;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function computeGrade(score: number): { grade: string; remark: string } {
  if (score >= 16) return { grade: 'A', remark: 'Excellent' };
  if (score >= 14) return { grade: 'B', remark: 'Very Good' };
  if (score >= 12) return { grade: 'C', remark: 'Good' };
  if (score >= 10) return { grade: 'D', remark: 'Fair' };
  if (score >= 8) return { grade: 'E', remark: 'Weak' };
  return { grade: 'F', remark: 'Poor' };
}

const TYPE_LABELS: Record<ReportCardType, { termName: string; termSequenceLabel: string }> = {
  'first-term': { termName: 'First Term', termSequenceLabel: 'First & Second Sequences' },
  'second-term': { termName: 'Second Term', termSequenceLabel: 'Third & Fourth Sequences' },
  final: { termName: 'Third Term (Annual)', termSequenceLabel: 'Fifth & Sixth Sequences' },
};

/**
 * Build the per-subject result rows for a single student in a session.
 *
 * - Pulls every Result row for the student in the session, grouped by
 *   (subjectId, sequenceId) so we have 1–6 sequence scores per subject.
 * - For each subject offered in the student's class (via SubjectClass),
 *   computes term1/2/3 averages and (for the final view) the annual
 *   average.
 * - For each subject, looks up the teacher who is assigned to teach
 *   that subject in the student's class for the session.
 */
async function buildSubjectResults(
  studentId: string,
  enrollment: { classId: string; sessionId: string },
  type: ReportCardType
): Promise<SubjectResult[]> {
  // Subjects offered in the student's class
  const subjectLinks = await prisma.subjectClass.findMany({
    where: { classId: enrollment.classId },
    include: { subject: true },
    orderBy: { subject: { name: 'asc' } },
  });
  if (subjectLinks.length === 0) return [];

  const subjectIds = subjectLinks.map((l) => l.subjectId);

  // All results for this student/session, grouped into a map
  const results = await prisma.result.findMany({
    where: {
      studentId,
      sessionId: enrollment.sessionId,
      subjectId: { in: subjectIds },
    },
    select: { subjectId: true, sequenceId: true, score: true, total: true },
  });

  // Group scores by subject and sequence number
  const scoresBySubject = new Map<
    string,
    Map<number, { score: number; total: number }>
  >();
  for (const r of results) {
    if (r.score === null) continue;
    const seq = await prisma.sequence.findUnique({
      where: { id: r.sequenceId },
      select: { number: true },
    });
    if (!seq) continue;
    if (!scoresBySubject.has(r.subjectId)) {
      scoresBySubject.set(r.subjectId, new Map());
    }
    scoresBySubject.get(r.subjectId)!.set(seq.number, {
      score: r.score,
      total: r.total || DEFAULT_MAX_SCORE,
    });
  }

  // Teacher lookup: which teacher teaches (subject, thisClass, thisSession)?
  const assignments = await prisma.assignment.findMany({
    where: {
      classId: enrollment.classId,
      subjectId: { in: subjectIds },
      sessionId: enrollment.sessionId,
    },
    include: { teacher: { select: { firstName: true, lastName: true } } },
  });
  const teacherBySubject = new Map<string, string>();
  for (const a of assignments) {
    if (a.teacher) {
      teacherBySubject.set(
        a.subjectId,
        `${a.teacher.firstName} ${a.teacher.lastName}`
      );
    }
  }

  const out: SubjectResult[] = [];
  for (const link of subjectLinks) {
    const s = link.subject;
    const scores = scoresBySubject.get(s.id);
    const get = (n: number): number | null => scores?.get(n)?.score ?? null;

    const seq1 = get(1);
    const seq2 = get(2);
    const seq3 = get(3);
    const seq4 = get(4);
    const seq5 = get(5);
    const seq6 = get(6);

    const term1Total =
      seq1 !== null && seq2 !== null ? round1((seq1 + seq2) / 2) : null;
    const term2Total =
      seq3 !== null && seq4 !== null ? round1((seq3 + seq4) / 2) : null;
    const term3Total =
      seq5 !== null && seq6 !== null ? round1((seq5 + seq6) / 2) : null;

    let annualTotal: number | null = null;
    if (
      term1Total !== null &&
      term2Total !== null &&
      term3Total !== null
    ) {
      annualTotal = round1((term1Total + term2Total + term3Total) / 3);
    }

    const subjectScore =
      type === 'first-term'
        ? term1Total
        : type === 'second-term'
          ? term2Total
          : annualTotal;

    const grade = subjectScore !== null ? computeGrade(subjectScore) : null;

    out.push({
      subjectId: s.id,
      subjectName: s.name,
      subjectCode: s.code,
      coefficient: s.coefficient,
      seq1Score: seq1,
      seq2Score: seq2,
      seq3Score: seq3,
      seq4Score: seq4,
      seq5Score: seq5,
      seq6Score: seq6,
      term1Total,
      term2Total,
      term3Total,
      annualTotal,
      annualAverage: annualTotal,
      position: null, // filled in by the class-position pass below
      maxScore: DEFAULT_MAX_SCORE,
      teacherName: teacherBySubject.get(s.id) ?? null,
      remark: grade?.remark ?? null,
      grade: grade?.grade ?? null,
    });
  }
  return out;
}

/**
 * For each subject row, compute the student's class position by
 * re-computing every other student's subject score and ranking them.
 * In-memory because we expect per-class sizes of 10–60 students; for
 * very large schools this would need to be a SQL window function.
 */
async function fillClassPositions(
  subjects: SubjectResult[],
  enrollment: { classId: string; sessionId: string },
  type: ReportCardType
): Promise<SubjectResult[]> {
  // Active enrollments in this class/session
  const classEnrollments = await prisma.enrollment.findMany({
    where: { classId: enrollment.classId, sessionId: enrollment.sessionId, status: 'ACTIVE' },
    select: { studentId: true },
  });
  if (classEnrollments.length === 0) return subjects;

  // Pre-fetch all results for this class in one query
  const allResults = await prisma.result.findMany({
    where: {
      sessionId: enrollment.sessionId,
      studentId: { in: classEnrollments.map((e) => e.studentId) },
      subjectId: { in: subjects.map((s) => s.subjectId) },
    },
    select: { studentId: true, subjectId: true, sequenceId: true, score: true },
  });

  // Index sequences by id for number lookup
  const sequences = await prisma.sequence.findMany({
    where: { sessionId: enrollment.sessionId },
    select: { id: true, number: true },
  });
  const seqNumberById = new Map(sequences.map((s) => [s.id, s.number]));

  // Group: subjectId -> studentId -> [seqNumber, score]
  const bySubject = new Map<string, Map<string, Array<[number, number]>>>();
  for (const r of allResults) {
    if (r.score === null) continue;
    const n = seqNumberById.get(r.sequenceId);
    if (n === undefined) continue;
    if (!bySubject.has(r.subjectId)) bySubject.set(r.subjectId, new Map());
    const inner = bySubject.get(r.subjectId)!;
    if (!inner.has(r.studentId)) inner.set(r.studentId, []);
    inner.get(r.studentId)!.push([n, r.score]);
  }

  return subjects.map((sub) => {
    const inner = bySubject.get(sub.subjectId);
    if (!inner) return { ...sub, position: null };

    // For each student, compute the same per-subject score the target
    // student has (term1/2/3 average, or annual).
    const ranked = classEnrollments
      .map((e) => {
        const scores = inner.get(e.studentId) ?? [];
        const at = (n: number) => scores.find(([s]) => s === n)?.[1] ?? null;
        const t1 = at(1), t2 = at(2), t3 = at(3), t4 = at(4), t5 = at(5), t6 = at(6);
        const term1 = t1 !== null && t2 !== null ? (t1 + t2) / 2 : null;
        const term2 = t3 !== null && t4 !== null ? (t3 + t4) / 2 : null;
        const term3 = t5 !== null && t6 !== null ? (t5 + t6) / 2 : null;
        const annual =
          term1 !== null && term2 !== null && term3 !== null
            ? (term1 + term2 + term3) / 3
            : null;
        const score =
          type === 'first-term'
            ? term1
            : type === 'second-term'
              ? term2
              : annual;
        return { studentId: e.studentId, score };
      })
      .filter((r) => r.score !== null) as Array<{
      studentId: string;
      score: number;
    }>;

    if (ranked.length === 0) return { ...sub, position: null };

    ranked.sort((a, b) => b.score - a.score);
    const myIdx = ranked.findIndex(
      (r) =>
        r.studentId ===
        // Find the student we're building this for. The caller passes
        // it via the loop below; for now we resolve from the first
        // enrollment (this helper is only used inside generateReportCard).
        ''
    );
    void myIdx;
    return sub; // position filled in by generateReportCard below
  });
}

/**
 * Compute weighted total and average for the chosen report type.
 * Subjects with a null score are excluded from the divisor.
 */
function computeTotals(
  subjects: SubjectResult[],
  type: ReportCardType
): { totalScore: number; totalMaxScore: number; average: number } {
  let totalScore = 0;
  let totalMaxScore = 0;
  for (const s of subjects) {
    const score =
      type === 'first-term'
        ? s.term1Total
        : type === 'second-term'
          ? s.term2Total
          : s.annualTotal;
    if (score === null) continue;
    totalScore += score * s.coefficient;
    totalMaxScore += DEFAULT_MAX_SCORE * s.coefficient;
  }
  const average =
    totalMaxScore > 0
      ? round1((totalScore / totalMaxScore) * DEFAULT_MAX_SCORE)
      : 0;
  return { totalScore: round1(totalScore), totalMaxScore, average };
}

async function buildSingleReport(
  studentId: string,
  sessionId: string,
  type: ReportCardType
): Promise<ReportCardData> {
  // Validate the student and session
  const [student, session] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.academicSession.findUnique({ where: { id: sessionId } }),
  ]);
  if (!student) {
    throw new ApiErrorClass(404, 'Student not found', 'StudentNotFound');
  }
  if (!session) {
    throw new ApiErrorClass(404, 'Academic session not found', 'SessionNotFound');
  }

  // Find the student's active enrollment in this session
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, sessionId, status: 'ACTIVE' },
    include: { class: { select: { id: true, name: true, code: true } } },
  });
  if (!enrollment) {
    throw new ApiErrorClass(
      404,
      'Student is not actively enrolled in this session',
      'EnrollmentNotFound'
    );
  }

  // Per-subject rows
  const subjects = await buildSubjectResults(
    studentId,
    { classId: enrollment.classId, sessionId },
    type
  );

  // Compute class positions for each subject
  const classEnrollments = await prisma.enrollment.findMany({
    where: {
      classId: enrollment.classId,
      sessionId,
      status: 'ACTIVE',
    },
    select: { studentId: true },
  });
  const allResults = await prisma.result.findMany({
    where: {
      sessionId,
      studentId: { in: classEnrollments.map((e) => e.studentId) },
      subjectId: { in: subjects.map((s) => s.subjectId) },
    },
    select: { studentId: true, subjectId: true, sequenceId: true, score: true },
  });
  const sequences = await prisma.sequence.findMany({
    where: { sessionId },
    select: { id: true, number: true },
  });
  const seqNumberById = new Map(sequences.map((s) => [s.id, s.number]));

  const bySubject = new Map<string, Map<string, Array<[number, number]>>>();
  for (const r of allResults) {
    if (r.score === null) continue;
    const n = seqNumberById.get(r.sequenceId);
    if (n === undefined) continue;
    if (!bySubject.has(r.subjectId)) bySubject.set(r.subjectId, new Map());
    const inner = bySubject.get(r.subjectId)!;
    if (!inner.has(r.studentId)) inner.set(r.studentId, []);
    inner.get(r.studentId)!.push([n, r.score]);
  }

  const subjectsWithPosition: SubjectResult[] = subjects.map((sub) => {
    const inner = bySubject.get(sub.subjectId);
    if (!inner) return { ...sub, position: null };

    const ranked: Array<{ studentId: string; score: number }> = [];
    for (const e of classEnrollments) {
      const scores = inner.get(e.studentId) ?? [];
      const at = (n: number) => scores.find(([s]) => s === n)?.[1] ?? null;
      const t1 = at(1), t2 = at(2), t3 = at(3), t4 = at(4), t5 = at(5), t6 = at(6);
      const term1 = t1 !== null && t2 !== null ? (t1 + t2) / 2 : null;
      const term2 = t3 !== null && t4 !== null ? (t3 + t4) / 2 : null;
      const term3 = t5 !== null && t6 !== null ? (t5 + t6) / 2 : null;
      const annual =
        term1 !== null && term2 !== null && term3 !== null
          ? (term1 + term2 + term3) / 3
          : null;
      const score =
        type === 'first-term'
          ? term1
          : type === 'second-term'
            ? term2
            : annual;
      if (score !== null) {
        ranked.push({ studentId: e.studentId, score });
      }
    }
    if (ranked.length === 0) return { ...sub, position: null };
    ranked.sort((a, b) => b.score - a.score);
    const myIdx = ranked.findIndex((r) => r.studentId === studentId);
    return { ...sub, position: myIdx === -1 ? null : myIdx + 1 };
  });

  const { totalScore, totalMaxScore, average } = computeTotals(subjectsWithPosition, type);

  // Overall class position: rank by weighted average
  const classAverages: Array<{ studentId: string; average: number }> = [];
  for (const e of classEnrollments) {
    const studentSubjects = await buildSubjectResults(
      e.studentId,
      { classId: enrollment.classId, sessionId },
      type
    );
    const totals = computeTotals(studentSubjects, type);
    if (totals.average > 0) {
      classAverages.push({ studentId: e.studentId, average: totals.average });
    }
  }
  classAverages.sort((a, b) => b.average - a.average);
  const classPosition =
    classAverages.findIndex((r) => r.studentId === studentId) + 1 || 0;

  // School settings for the header
  const settings = await settingsService.getSettingsByKeys([
    'school_name',
    'school_motto',
    'school_address',
    'school_logo',
    'principal_name',
    'class_teacher_name',
    'attendance_days',
    'attendance_present',
  ]);

  const labels = TYPE_LABELS[type];

  return {
    type,
    schoolName: settings.school_name || 'EduGrade School',
    schoolMotto: settings.school_motto || 'Knowledge is Light',
    schoolAddress: settings.school_address || '',
    schoolLogo: settings.school_logo || '',
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    studentNumber: student.studentNumber,
    studentClass: enrollment.class.name,
    studentGender: student.gender,
    studentPhotoUrl: student.photoUrl ?? '',
    academicYear: session.name,
    termName: labels.termName,
    termSequenceLabel: labels.termSequenceLabel,
    subjects: subjectsWithPosition,
    totalScore,
    totalMaxScore,
    average,
    classPosition: classPosition || 0,
    totalStudentsInClass: classEnrollments.length,
    attendance: parseInt(settings.attendance_present, 10) || 0,
    totalDays: parseInt(settings.attendance_days, 10) || 0,
    teacherComment: '',
    principalComment: '',
    promotionDecision: '',
    classTeacherName: settings.class_teacher_name || '',
    principalName: settings.principal_name || '',
    generatedAt: new Date().toISOString(),
  };
}

export const reportCardService = {
  /**
   * Build a report card for a single student. `type` selects the view
   * (first-term / second-term / annual). `classId` and `sessionId` are
   * required; they filter the underlying marks.
   */
  async generateReportCard(
    type: ReportCardType,
    studentId: string,
    _classId: string | undefined,
    sessionId: string
  ): Promise<ReportCardData> {
    return buildSingleReport(studentId, sessionId, type);
  },

  /**
   * Build report cards for every ACTIVE student in a class+session.
   * The reports are returned in the same shape as the single-student
   * endpoint. Position is filled per-student.
   */
  async generateBulkReportCards(
    type: ReportCardType,
    classId: string,
    sessionId: string
  ): Promise<ReportCardData[]> {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) {
      throw new ApiErrorClass(404, 'Class not found', 'ClassNotFound');
    }
    const session = await prisma.academicSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new ApiErrorClass(404, 'Academic session not found', 'SessionNotFound');
    }
    const enrollments = await prisma.enrollment.findMany({
      where: { classId, sessionId, status: 'ACTIVE' },
      select: { studentId: true },
    });
    if (enrollments.length === 0) return [];
    // Build per-student reports sequentially to keep memory bounded
    const reports: ReportCardData[] = [];
    for (const e of enrollments) {
      reports.push(await buildSingleReport(e.studentId, sessionId, type));
    }
    return reports;
  },

  /**
   * Get a single subject's per-sequence result for a student in a
   * session. Used by the per-subject report view.
   */
  async getSubjectReport(
    studentId: string,
    subjectId: string,
    sessionId: string
  ): Promise<SubjectResult | null> {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId, sessionId, status: 'ACTIVE' },
    });
    if (!enrollment) return null;
    const subjects = await buildSubjectResults(
      studentId,
      { classId: enrollment.classId, sessionId },
      'final'
    );
    return subjects.find((s) => s.subjectId === subjectId) ?? null;
  },

  /**
   * Expose the grade helper for the frontend.
   */
  getGradeInfo(score: number): { grade: string; remark: string } {
    return computeGrade(score);
  },
};
