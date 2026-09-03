-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PROPRIETOR', 'TEACHER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'TRANSFERRED', 'GRADUATED', 'REPEATER');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'LOCKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "specialization" TEXT,
    "photoUrl" TEXT,
    "photoPublicId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "placeOfBirth" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "parentName" TEXT,
    "parentPhone" TEXT,
    "studentNumber" TEXT NOT NULL,
    "photoUrl" TEXT,
    "photoPublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "coefficient" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectClass" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,

    CONSTRAINT "SubjectClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicSession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Term" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequenceCount" INTEGER NOT NULL DEFAULT 2,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sequence" (
    "id" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "status" "ResultStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");

-- CreateIndex
CREATE INDEX "Teacher_email_idx" ON "Teacher"("email");

-- CreateIndex
CREATE INDEX "Teacher_isActive_idx" ON "Teacher"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentNumber_key" ON "Student"("studentNumber");

-- CreateIndex
CREATE INDEX "Student_studentNumber_idx" ON "Student"("studentNumber");

-- CreateIndex
CREATE INDEX "Student_lastName_firstName_idx" ON "Student"("lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Class_name_key" ON "Class"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Class_code_key" ON "Class"("code");

-- CreateIndex
CREATE INDEX "Class_name_idx" ON "Class"("name");

-- CreateIndex
CREATE INDEX "Class_code_idx" ON "Class"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE INDEX "Subject_name_idx" ON "Subject"("name");

-- CreateIndex
CREATE INDEX "Subject_code_idx" ON "Subject"("code");

-- CreateIndex
CREATE INDEX "SubjectClass_subjectId_idx" ON "SubjectClass"("subjectId");

-- CreateIndex
CREATE INDEX "SubjectClass_classId_idx" ON "SubjectClass"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectClass_subjectId_classId_key" ON "SubjectClass"("subjectId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSession_name_key" ON "AcademicSession"("name");

-- CreateIndex
CREATE INDEX "AcademicSession_name_idx" ON "AcademicSession"("name");

-- CreateIndex
CREATE INDEX "AcademicSession_isCurrent_idx" ON "AcademicSession"("isCurrent");

-- CreateIndex
CREATE INDEX "AcademicSession_isActive_idx" ON "AcademicSession"("isActive");

-- CreateIndex
CREATE INDEX "Term_sessionId_idx" ON "Term"("sessionId");

-- CreateIndex
CREATE INDEX "Sequence_termId_idx" ON "Sequence"("termId");

-- CreateIndex
CREATE INDEX "Sequence_sessionId_idx" ON "Sequence"("sessionId");

-- CreateIndex
CREATE INDEX "Sequence_isActive_idx" ON "Sequence"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Sequence_termId_number_key" ON "Sequence"("termId", "number");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");

-- CreateIndex
CREATE INDEX "Enrollment_classId_sessionId_idx" ON "Enrollment"("classId", "sessionId");

-- CreateIndex
CREATE INDEX "Enrollment_sessionId_idx" ON "Enrollment"("sessionId");

-- CreateIndex
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_classId_sessionId_key" ON "Enrollment"("studentId", "classId", "sessionId");

-- CreateIndex
CREATE INDEX "Assignment_teacherId_sessionId_idx" ON "Assignment"("teacherId", "sessionId");

-- CreateIndex
CREATE INDEX "Assignment_classId_sessionId_idx" ON "Assignment"("classId", "sessionId");

-- CreateIndex
CREATE INDEX "Assignment_subjectId_sessionId_idx" ON "Assignment"("subjectId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_teacherId_classId_subjectId_sessionId_key" ON "Assignment"("teacherId", "classId", "subjectId", "sessionId");

-- CreateIndex
CREATE INDEX "Result_studentId_idx" ON "Result"("studentId");

-- CreateIndex
CREATE INDEX "Result_subjectId_sequenceId_idx" ON "Result"("subjectId", "sequenceId");

-- CreateIndex
CREATE INDEX "Result_sequenceId_idx" ON "Result"("sequenceId");

-- CreateIndex
CREATE INDEX "Result_status_idx" ON "Result"("status");

-- CreateIndex
CREATE INDEX "Result_enrollmentId_idx" ON "Result"("enrollmentId");

-- CreateIndex
CREATE INDEX "Result_sessionId_idx" ON "Result"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_studentId_subjectId_sequenceId_sessionId_key" ON "Result"("studentId", "subjectId", "sequenceId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSetting_key_key" ON "SchoolSetting"("key");

-- CreateIndex
CREATE INDEX "SchoolSetting_key_idx" ON "SchoolSetting"("key");

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectClass" ADD CONSTRAINT "SubjectClass_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectClass" ADD CONSTRAINT "SubjectClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sequence" ADD CONSTRAINT "Sequence_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sequence" ADD CONSTRAINT "Sequence_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "Sequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
