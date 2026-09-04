// Shared TypeScript types for every IndexedDB object store used by the
// offline layer. Every field is intentionally a subset of what the backend
// returns so the offline renderer has everything it needs without joins.

export interface DBSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  syncedAt: string;
}

export interface DBTerm {
  id: string;
  sessionId: string;
  name: string;
  sequenceCount: number;
  startDate: string;
  endDate: string;
  syncedAt: string;
}

export interface DBSequence {
  id: string;
  termId: string;
  sessionId: string;
  name: string;
  number: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  syncedAt: string;
}

export interface DBClass {
  id: string;
  name: string;
  code: string;
  description?: string;
  syncedAt: string;
}

export interface DBSubject {
  id: string;
  name: string;
  code: string;
  description?: string;
  coefficient: number;
  syncedAt: string;
}

export interface DBAssignment {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  sessionId: string;
  // Denormalized so the offline form can render without a join.
  className?: string;
  subjectName?: string;
  sessionName?: string;
  subjectCode?: string;
  syncedAt: string;
}

export interface DBStudent {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  gender: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  address?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  photoUrl?: string;
  syncedAt: string;
}

export interface DBEnrollment {
  id: string;
  studentId: string;
  classId: string;
  sessionId: string;
  status: string;
  enrollmentDate: string;
  // Denormalized so the offline form can render without a join.
  studentName?: string;
  studentNumber?: string;
  syncedAt: string;
}

export interface DBResult {
  id: string;
  studentId: string;
  subjectId: string;
  sequenceId: string;
  enrollmentId: string;
  sessionId: string;
  score: number | null;
  total: number;
  status: string;
  submittedAt: string | null;
  // Offline metadata
  dirty: 0 | 1;
  pendingOpId?: string;
  syncedAt: string;
  // Denormalized so the offline form can render without a join.
  studentName?: string;
  studentNumber?: string;
}

export interface DBSyncQueueItem {
  id: string;
  op: string;
  endpoint: string;
  method: string;
  body: unknown;
  idempotencyKey?: string;
  attempts: number;
  lastError?: string;
  createdAt: string;
  nextAttemptAt: string;
  status: 'pending' | 'failed' | 'cancelled';
}

export const DB_NAME = 'edugrade-offline';
export const DB_VERSION = 1;

export const STORE_NAMES = {
  sessions: 'sessions',
  terms: 'terms',
  sequences: 'sequences',
  classes: 'classes',
  subjects: 'subjects',
  assignments: 'assignments',
  students: 'students',
  enrollments: 'enrollments',
  results: 'results',
  syncQueue: 'sync_queue',
} as const;
