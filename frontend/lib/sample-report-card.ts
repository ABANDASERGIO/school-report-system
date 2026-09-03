import type { ReportCardData, ReportCardType, SubjectResult } from '@/types';

const SAMPLE_SUBJECTS: Array<Pick<SubjectResult, 'subjectCode' | 'subjectName' | 'coefficient'>> = [
  { subjectCode: 'MAT', subjectName: 'Mathematics', coefficient: 5 },
  { subjectCode: 'ENG', subjectName: 'English Language', coefficient: 4 },
  { subjectCode: 'FRE', subjectName: 'French', coefficient: 3 },
  { subjectCode: 'PHY', subjectName: 'Physics', coefficient: 4 },
  { subjectCode: 'CHE', subjectName: 'Chemistry', coefficient: 4 },
  { subjectCode: 'BIO', subjectName: 'Biology', coefficient: 4 },
  { subjectCode: 'HIS', subjectName: 'History', coefficient: 2 },
  { subjectCode: 'GEO', subjectName: 'Geography', coefficient: 2 },
];

/**
 * Build a fully-formed ReportCardData with stable sample numbers so the
 * "Preview Sample Report Card" button can render the layout without
 * selecting a real student. The numbers are deterministic per type so
 * the preview feels real but is clearly a sample.
 */
export function buildSampleReportCard(type: ReportCardType): ReportCardData {
  const subjects: SubjectResult[] = SAMPLE_SUBJECTS.map((s, idx) => {
    // Stable, plausible scores in the 10-19 range, varying by subject.
    const base = 18 - (idx % 5);
    const seq1Score = Math.min(20, base);
    const seq2Score = Math.min(20, base - 1);
    const seq3Score = Math.min(20, base - 2);
    const seq4Score = Math.min(20, base - 1);
    const seq5Score = Math.min(20, base);
    const seq6Score = Math.min(20, base - 2);

    let term1Total: number | null = null;
    let term2Total: number | null = null;
    let term3Total: number | null = null;
    let annualTotal: number | null = null;
    let annualAverage: number | null = null;

    if (type === 'first-term') {
      term1Total = seq1Score + seq2Score;
    } else if (type === 'second-term') {
      term1Total = seq1Score + seq2Score;
      term2Total = seq3Score + seq4Score;
    } else {
      term1Total = seq1Score + seq2Score;
      term2Total = seq3Score + seq4Score;
      term3Total = seq5Score + seq6Score;
      annualTotal = (term1Total ?? 0) + (term2Total ?? 0) + (term3Total ?? 0);
      annualAverage = annualTotal / 6;
    }

    return {
      subjectId: `sample-${s.subjectCode}`,
      subjectName: s.subjectName,
      subjectCode: s.subjectCode,
      coefficient: s.coefficient,
      seq1Score,
      seq2Score,
      seq3Score,
      seq4Score,
      seq5Score,
      seq6Score,
      term1Total,
      term2Total,
      term3Total,
      annualTotal,
      annualAverage,
      position: idx + 1,
      maxScore: 20,
      teacherName: 'Mr. Sample Teacher',
      remark: 'Keep it up!',
    };
  });

  const totalScore = subjects.reduce(
    (acc, s) => acc + ((s.annualAverage ?? 0) > 0 ? s.annualAverage! : 0),
    0
  );
  const totalMaxScore = subjects.length * 20;
  const average = totalMaxScore > 0 ? Number((totalScore / subjects.length).toFixed(2)) : 0;

  const termSequenceLabel =
    type === 'first-term'
      ? 'Sequences 1 & 2'
      : type === 'second-term'
      ? 'Sequences 3 & 4'
      : 'All Sequences';

  return {
    type,
    schoolName: 'EduGrade Sample School',
    schoolMotto: 'Knowledge is Light',
    schoolAddress: '123 Sample Avenue, Buea',
    studentId: 'sample-student',
    studentName: 'Sample Student',
    studentNumber: 'STU-SAMPLE-0001',
    studentClass: 'Form 3A',
    studentGender: 'Male',
    academicYear: '2026/2027',
    termName: type === 'first-term' ? 'First Term' : type === 'second-term' ? 'Second Term' : 'Final Term',
    termSequenceLabel,
    subjects,
    totalScore: Number(totalScore.toFixed(2)),
    totalMaxScore,
    average,
    classPosition: 3,
    totalStudentsInClass: 32,
    attendance: 78,
    totalDays: 90,
    teacherComment: 'Demonstrates consistent effort. Encourage more independent practice.',
    principalComment: 'A solid performance. Aim higher next term.',
    promotionDecision: 'Promoted',
    classTeacherName: 'Mr. Sample Form Tutor',
    principalName: 'Dr. Sample Principal',
    generatedAt: new Date().toISOString(),
  };
}
