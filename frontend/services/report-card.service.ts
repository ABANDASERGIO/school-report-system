import type { ReportCardData, SubjectResult, ReportCardType } from "@/types";
import { settingsService } from "./settings.service";
import { studentService } from "./student.service";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Compute grade based on absolute score out of 20 */
function computeGrade(score: number): { grade: string; remark: string } {
  if (score >= 16) return { grade: "A", remark: "Excellent" };
  if (score >= 14) return { grade: "B", remark: "Very Good" };
  if (score >= 12) return { grade: "C", remark: "Good" };
  if (score >= 10) return { grade: "D", remark: "Fair" };
  if (score >= 8) return { grade: "E", remark: "Weak" };
  return { grade: "F", remark: "Poor" };
}

function getSubjectScore(s: any, type: ReportCardType): number | null {
  if (type === "final") return s.annualTotal;
  if (type === "first-term") return s.term1Total;
  if (type === "second-term") return s.term2Total;
  return s.annualTotal;
}

/** Mock student name pool for bulk generation */
const studentPool = [
  { firstName: "Alice", lastName: "Nkwi", gender: "Female", studentNumber: "STU-2026-0001", className: "Form 5 Science" },
  { firstName: "Bob", lastName: "Mbah", gender: "Male", studentNumber: "STU-2026-0002", className: "Form 5 Science" },
  { firstName: "Clara", lastName: "Tata", gender: "Female", studentNumber: "STU-2026-0003", className: "Form 5 Science" },
  { firstName: "David", lastName: "Fon", gender: "Male", studentNumber: "STU-2026-0004", className: "Form 5 Science" },
  { firstName: "Esther", lastName: "Achu", gender: "Female", studentNumber: "STU-2026-0005", className: "Form 5 Science" },
  { firstName: "Frank", lastName: "Njoh", gender: "Male", studentNumber: "STU-2026-0006", className: "Form 5 Science" },
  { firstName: "Grace", lastName: "Leke", gender: "Female", studentNumber: "STU-2026-0007", className: "Form 5 Science" },
  { firstName: "Henry", lastName: "Mile", gender: "Male", studentNumber: "STU-2026-0008", className: "Form 5 Science" },
  { firstName: "Irene", lastName: "Bai", gender: "Female", studentNumber: "STU-2026-0009", className: "Form 5 Science" },
  { firstName: "John", lastName: "Tabi", gender: "Male", studentNumber: "STU-2026-0010", className: "Form 5 Science" },
];

/** Generate a single mock report card for a given student index */
function generateMockReportData(type: ReportCardType, studentIdx: number = 0, schoolLogo: string = "", studentPhotoUrl: string = ""): ReportCardData {
  const student = studentPool[studentIdx % studentPool.length];
  const pos = studentIdx + 1;
  const total = studentPool.length;

  const subjects: SubjectResult[] = [
    {
      subjectId: "sub-001",
      subjectName: "Mathematics",
      subjectCode: "MATH",
      coefficient: 5,
      seq1Score: Math.round((10 + (studentIdx % 10) + Math.random() * 2) * 10) / 10,
      seq2Score: Math.round((11 + (studentIdx % 9) + Math.random() * 2) * 10) / 10,
      seq3Score: Math.round((9 + (studentIdx % 11) + Math.random() * 2) * 10) / 10,
      seq4Score: Math.round((12 + (studentIdx % 8) + Math.random() * 2) * 10) / 10,
      seq5Score: Math.round((11 + (studentIdx % 10) + Math.random() * 2) * 10) / 10,
      seq6Score: Math.round((13 + (studentIdx % 7) + Math.random() * 2) * 10) / 10,
      position: Math.max(1, pos),
      maxScore: 20,
      teacherName: "Mr. John Doe",
    },
    {
      subjectId: "sub-002",
      subjectName: "English Language",
      subjectCode: "ENG",
      coefficient: 4,
      seq1Score: Math.round((8 + (studentIdx % 12) + Math.random() * 2) * 10) / 10,
      seq2Score: Math.round((10 + (studentIdx % 10) + Math.random() * 2) * 10) / 10,
      seq3Score: Math.round((9 + (studentIdx % 10) + Math.random() * 2) * 10) / 10,
      seq4Score: Math.round((11 + (studentIdx % 9) + Math.random() * 2) * 10) / 10,
      seq5Score: Math.round((10 + (studentIdx % 9) + Math.random() * 2) * 10) / 10,
      seq6Score: Math.round((12 + (studentIdx % 8) + Math.random() * 2) * 10) / 10,
      position: Math.max(1, pos + 1),
      maxScore: 20,
      teacherName: "Mrs. Jane Smith",
    },
    {
      subjectId: "sub-003",
      subjectName: "French",
      subjectCode: "FREN",
      coefficient: 3,
      seq1Score: Math.round((7 + (studentIdx % 11) + Math.random() * 2) * 10) / 10,
      seq2Score: Math.round((9 + (studentIdx % 9) + Math.random() * 2) * 10) / 10,
      seq3Score: Math.round((8 + (studentIdx % 10) + Math.random() * 2) * 10) / 10,
      seq4Score: Math.round((10 + (studentIdx % 8) + Math.random() * 2) * 10) / 10,
      seq5Score: Math.round((9 + (studentIdx % 9) + Math.random() * 2) * 10) / 10,
      seq6Score: Math.round((11 + (studentIdx % 7) + Math.random() * 2) * 10) / 10,
      position: Math.max(1, pos + 2),
      maxScore: 20,
      teacherName: "Mr. Paul Biyong",
    },
    {
      subjectId: "sub-004",
      subjectName: "Physics",
      subjectCode: "PHY",
      coefficient: 4,
      seq1Score: Math.round((12 + (studentIdx % 8) + Math.random() * 2) * 10) / 10,
      seq2Score: Math.round((14 + (studentIdx % 6) + Math.random() * 2) * 10) / 10,
      seq3Score: Math.round((11 + (studentIdx % 9) + Math.random() * 2) * 10) / 10,
      seq4Score: Math.round((13 + (studentIdx % 7) + Math.random() * 2) * 10) / 10,
      seq5Score: Math.round((12 + (studentIdx % 8) + Math.random() * 2) * 10) / 10,
      seq6Score: Math.round((15 + (studentIdx % 5) + Math.random() * 2) * 10) / 10,
      position: Math.max(1, pos - 1),
      maxScore: 20,
      teacherName: "Mr. John Doe",
    },
    {
      subjectId: "sub-005",
      subjectName: "Chemistry",
      subjectCode: "CHEM",
      coefficient: 3,
      seq1Score: Math.round((10 + (studentIdx % 9) + Math.random() * 2) * 10) / 10,
      seq2Score: Math.round((11 + (studentIdx % 8) + Math.random() * 2) * 10) / 10,
      seq3Score: Math.round((9 + (studentIdx % 10) + Math.random() * 2) * 10) / 10,
      seq4Score: Math.round((12 + (studentIdx % 7) + Math.random() * 2) * 10) / 10,
      seq5Score: Math.round((11 + (studentIdx % 8) + Math.random() * 2) * 10) / 10,
      seq6Score: Math.round((13 + (studentIdx % 6) + Math.random() * 2) * 10) / 10,
      position: Math.max(1, pos + 3),
      maxScore: 20,
      teacherName: "Mrs. Jane Smith",
    },
    {
      subjectId: "sub-006",
      subjectName: "Biology",
      subjectCode: "BIO",
      coefficient: 3,
      seq1Score: Math.round((9 + (studentIdx % 10) + Math.random() * 2) * 10) / 10,
      seq2Score: Math.round((10 + (studentIdx % 9) + Math.random() * 2) * 10) / 10,
      seq3Score: Math.round((10 + (studentIdx % 8) + Math.random() * 2) * 10) / 10,
      seq4Score: Math.round((11 + (studentIdx % 8) + Math.random() * 2) * 10) / 10,
      seq5Score: Math.round((10 + (studentIdx % 9) + Math.random() * 2) * 10) / 10,
      seq6Score: Math.round((12 + (studentIdx % 7) + Math.random() * 2) * 10) / 10,
      position: Math.max(1, pos),
      maxScore: 20,
      teacherName: "Mr. Paul Biyong",
    },
    {
      subjectId: "sub-007",
      subjectName: "ICT",
      subjectCode: "ICT",
      coefficient: 2,
      seq1Score: Math.round((13 + (studentIdx % 7) + Math.random() * 2) * 10) / 10,
      seq2Score: Math.round((15 + (studentIdx % 5) + Math.random() * 2) * 10) / 10,
      seq3Score: Math.round((12 + (studentIdx % 8) + Math.random() * 2) * 10) / 10,
      seq4Score: Math.round((14 + (studentIdx % 6) + Math.random() * 2) * 10) / 10,
      seq5Score: Math.round((13 + (studentIdx % 7) + Math.random() * 2) * 10) / 10,
      seq6Score: Math.round((16 + (studentIdx % 4) + Math.random() * 2) * 10) / 10,
      position: Math.max(1, pos - 2),
      maxScore: 20,
      teacherName: "Mr. John Doe",
    },
  ];

  // Compute totals based on report type
  const computedSubjects = subjects.map((s) => {
    let term1Total: number | null = null;
    let term2Total: number | null = null;
    let term3Total: number | null = null;
    let annualTotal: number | null = null;

    if (s.seq1Score !== null && s.seq2Score !== null) {
      term1Total = Math.round(((s.seq1Score! + s.seq2Score!) / 2) * 10) / 10;
    }
    if (s.seq3Score !== null && s.seq4Score !== null) {
      term2Total = Math.round(((s.seq3Score! + s.seq4Score!) / 2) * 10) / 10;
    }
    if (s.seq5Score !== null && s.seq6Score !== null) {
      term3Total = Math.round(((s.seq5Score! + s.seq6Score!) / 2) * 10) / 10;
    }

    if (type === "final" && term1Total !== null && term2Total !== null && term3Total !== null) {
      annualTotal = Math.round(((term1Total + term2Total + term3Total) / 3) * 10) / 10;
    }

    return {
      ...s,
      term1Total,
      term2Total,
      term3Total,
      annualTotal,
    };
  });

  // Calculate overall average
  let totalScore = 0;
  let totalMaxScore = 0;

  if (type === "final") {
    computedSubjects.forEach((s) => {
      if (s.annualTotal) {
        totalScore += s.annualTotal * s.coefficient;
        totalMaxScore += 20 * s.coefficient;
      }
    });
  } else {
    computedSubjects.forEach((s) => {
      const termAvg = type === "first-term" ? s.term1Total : type === "second-term" ? s.term2Total : 0;
      if (termAvg) {
        totalScore += termAvg * s.coefficient;
        totalMaxScore += 20 * s.coefficient;
      }
    });
  }

  const average = totalScore > 0 ? Math.round((totalScore / totalMaxScore) * 20 * 10) / 10 : 0;
  const overallGrade = computeGrade(average);

  const termSequenceLabels: Record<ReportCardType, string> = {
    "first-term": "First & Second Sequences",
    "second-term": "Third & Fourth Sequences",
    final: "Fifth & Sixth Sequences",
  };

  const termNames: Record<ReportCardType, string> = {
    "first-term": "First Term",
    "second-term": "Second Term",
    final: "Third Term (Annual)",
  };

  return {
    type,
    schoolName: "Government High School Buea",
    schoolMotto: "Knowledge is Light",
    schoolAddress: "Molyko, Buea, South West Region, Cameroon",
    schoolLogo: schoolLogo,
    studentId: `stu-${String(studentIdx + 1).padStart(3, "0")}`,
    studentName: `${student.firstName} ${student.lastName}`,
    studentNumber: student.studentNumber,
    studentClass: student.className,
    studentGender: student.gender,
    studentPhotoUrl: studentPhotoUrl,
    academicYear: "2026/2027",
    termName: termNames[type],
    termSequenceLabel: termSequenceLabels[type],
    subjects: computedSubjects.map((s) => {
      const subjectScore = getSubjectScore(s, type);
      const { grade, remark } = subjectScore !== null ? computeGrade(subjectScore) : { grade: "-", remark: "-" };
      return {
        ...s,
        grade,
        remark,
      };
    }),
    totalScore,
    totalMaxScore,
    average,
    classPosition: pos,
    totalStudentsInClass: total,
    attendance: Math.floor(80 + Math.random() * 15),
    totalDays: 90,
    teacherComment: `${student.firstName} has performed well this ${termNames[type].toLowerCase()}. Keep up the good work.`,
    principalComment: "Keep up the good work.",
    classTeacherName: "Mr. John Doe",
    principalName: "Dr. Thomas Ewanga",
    generatedAt: new Date().toISOString(),
  } as ReportCardData;
}

export const reportCardService = {
  /** Generate a single report card for preview or single-student use */
  async generateReportCard(
    type: ReportCardType,
    studentId?: string,
    _classId?: string,
    _sessionId?: string
  ): Promise<ReportCardData> {
    await delay(800);
    const settings = await settingsService.getAllSettings();
    const logoSetting = settings.find((s) => s.key === "school_logo");
    const schoolLogo = logoSetting?.value || "";

    let studentPhotoUrl = "";
    let studentIdx = 0;
    if (studentId) {
      const student = await studentService.getStudentById(studentId);
      if (student) {
        studentPhotoUrl = student.photoUrl || "";
        studentIdx = parseInt(studentId.replace("stu-", ""), 10) - 1;
      }
    } else {
      studentIdx = 0;
    }

    return generateMockReportData(type, Math.max(0, studentIdx), schoolLogo, studentPhotoUrl);
  },

  /** Generate report cards for ALL students in a class (bulk) */
  async generateBulkReportCards(
    type: ReportCardType,
    classId: string,
    sessionId: string
  ): Promise<ReportCardData[]> {
    await delay(1200);
    const settings = await settingsService.getAllSettings();
    const logoSetting = settings.find((s) => s.key === "school_logo");
    const schoolLogo = logoSetting?.value || "";

    const students = await studentService.getStudents();
    return students.map((student, idx) => {
      const studentIdx = idx % studentPool.length;
      return generateMockReportData(type, studentIdx, schoolLogo, student.photoUrl || "");
    });
  },

  /** Get grade info from score */
  getGradeInfo(score: number) {
    return computeGrade(score);
  },

  /** Generate subject-level report with sequences */
  async getSubjectReport(
    studentId: string,
    subjectId: string,
    sessionId: string
  ): Promise<SubjectResult | null> {
    await delay(500);
    const data = generateMockReportData("final", 0);
    return data.subjects.find((s) => s.subjectId === subjectId) || null;
  },
};
