import {
  UserRole,
  Gender,
  EnrollmentStatus,
  ResultStatus,
} from "./enums";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  specialization: string;
  photoUrl?: string;
  photoPublicId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: Gender;
  address: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  studentNumber: string;
  photoUrl?: string;
  photoPublicId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  name: string;
  code: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  coefficient: number;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Term {
  id: string;
  sessionId: string;
  name: string;
  sequenceCount: number;
  startDate: string;
  endDate: string;
  session?: AcademicSession;
}

export interface Sequence {
  id: string;
  termId: string;
  name: string;
  number: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  term?: Term;
}

export interface Assignment {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  sessionId: string;
  teacher?: Teacher;
  class?: Class;
  subject?: Subject;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  sessionId: string;
  status: EnrollmentStatus;
  enrollmentDate: string;
  student?: Student;
  class?: Class;
  session?: AcademicSession;
}

export interface Result {
  id: string;
  studentId: string;
  subjectId: string;
  sequenceId: string;
  enrollmentId: string;
  score: number | null;
  total: number;
  status: ResultStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student?: Student;
  subject?: Subject;
  sequence?: Sequence;
  enrollment?: Enrollment;
}

export interface SchoolSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  updatedAt: string;
}

export interface TeacherDashboardData {
  teacher: Teacher;
  assignments: Assignment[];
  currentSession: AcademicSession | null;
  totalStudents: number;
  pendingResults: number;
  submittedResults: number;
}

export interface ProprietorDashboardData {
  totalStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  pendingResults: number;
  submittedResults: number;
  currentSession: AcademicSession | null;
  recentEnrollments: number;
}

// Report Card Types
export type ReportCardType = "first-term" | "second-term" | "final";

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  coefficient: number;
  seq1Score?: number | null;
  seq2Score?: number | null;
  seq3Score?: number | null;
  seq4Score?: number | null;
  seq5Score?: number | null;
  seq6Score?: number | null;
  term1Total?: number | null;
  term2Total?: number | null;
  term3Total?: number | null;
  annualTotal?: number | null;
  annualAverage?: number | null;
  position?: number | null;
  maxScore: number;
  teacherName?: string;
  remark?: string;
}

export interface ReportCardData {
  type: ReportCardType;
  schoolName: string;
  schoolMotto: string;
  schoolAddress: string;
  schoolLogo?: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  studentClass: string;
  studentGender: string;
  studentPhotoUrl?: string;
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
  promotionDecision?: string;
  classTeacherName?: string;
  principalName?: string;
  generatedAt: string;
}

