export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  token: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  schoolName?: string;
}

export interface CreateStudentRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: string;
  address: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  photoUrl?: string;
  photoPublicId?: string;
}

export interface CreateTeacherRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  specialization: string;
  password: string;
  photoUrl?: string;
  photoPublicId?: string;
}

export interface CreateClassRequest {
  name: string;
  code: string;
  description: string;
}

export interface CreateSubjectRequest {
  name: string;
  code: string;
  description: string;
  coefficient: number;
}

export interface CreateSessionRequest {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface CreateTermRequest {
  sessionId: string;
  name: string;
  sequenceCount: number;
  startDate: string;
  endDate: string;
}

export interface CreateSequenceRequest {
  termId: string;
  name: string;
  number: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CreateAssignmentRequest {
  teacherId: string;
  classId: string;
  subjectId: string;
  sessionId: string;
}

export interface CreateEnrollmentRequest {
  studentId: string;
  classId: string;
  sessionId: string;
}

export interface MarkEntryRequest {
  studentId: string;
  subjectId: string;
  sequenceId: string;
  enrollmentId: string;
  score: number;
  total: number;
}

export interface SubmitResultsRequest {
  sequenceId: string;
  results: MarkEntryRequest[];
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

