// Shared report-card types used by the service, controller, and frontend.

export type ReportCardType = 'first-term' | 'second-term' | 'final';

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  coefficient: number;
  seq1Score: number | null;
  seq2Score: number | null;
  seq3Score: number | null;
  seq4Score: number | null;
  seq5Score: number | null;
  seq6Score: number | null;
  term1Total: number | null;
  term2Total: number | null;
  term3Total: number | null;
  annualTotal: number | null;
  annualAverage: number | null;
  position: number | null;
  maxScore: number;
  teacherName: string | null;
  remark: string | null;
  grade: string | null;
}

export interface ReportCardData {
  type: ReportCardType;
  schoolName: string;
  schoolMotto: string;
  schoolAddress: string;
  schoolLogo: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  studentClass: string;
  studentGender: string;
  studentPhotoUrl: string;
  academicYear: string;
  termName: string;
  termSequenceLabel: string;
  subjects: SubjectResult[];
  totalScore: number;
  totalMaxScore: number;
  average: number;
  classPosition: number;
  totalStudentsInClass: number;
  attendance: number;
  totalDays: number;
  teacherComment: string;
  principalComment: string;
  promotionDecision: string;
  classTeacherName: string;
  principalName: string;
  generatedAt: string;
}

export interface GradeInfo {
  grade: string;
  remark: string;
}
