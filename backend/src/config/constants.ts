// Application-wide constants

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const DEFAULT_PORT = 3001;

export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

export const GRADE_SCALE = {
  EXCELLENT: { min: 16, max: 20, label: 'Excellent', letter: 'A' },
  VERY_GOOD: { min: 14, max: 15.99, label: 'Very Good', letter: 'B' },
  GOOD: { min: 12, max: 13.99, label: 'Good', letter: 'C' },
  FAIR: { min: 10, max: 11.99, label: 'Fair', letter: 'D' },
  WEAK: { min: 8, max: 9.99, label: 'Weak', letter: 'E' },
  POOR: { min: 0, max: 7.99, label: 'Poor', letter: 'F' },
} as const;

export const DEFAULT_SETTINGS = [
  { key: 'school_name', value: 'EduGrade School', description: 'Official name of the school' },
  { key: 'school_motto', value: 'Knowledge is Light', description: 'School motto' },
  { key: 'school_address', value: '', description: 'Physical address of the school' },
  { key: 'school_phone', value: '', description: 'School contact phone number' },
  { key: 'school_email', value: '', description: 'School contact email' },
  { key: 'school_logo', value: '', description: 'School logo URL (Cloudinary)' },
  { key: 'grading_system', value: 'cameroon_gce', description: 'The grading system used' },
  { key: 'max_score', value: '20', description: 'Maximum score per subject' },
  { key: 'pass_mark', value: '10', description: 'Minimum passing score' },
  { key: 'academic_year_format', value: '2026/2027', description: 'Current academic year display format' },
  { key: 'marks_entry_open', value: 'true', description: 'Whether teachers can enter marks' },
] as const;

export const CLOUDINARY_FOLDERS = {
  STUDENT: 'edugrade/students',
  TEACHER: 'edugrade/teachers',
  SCHOOL_LOGO: 'edugrade/school',
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as string[],
} as const;
