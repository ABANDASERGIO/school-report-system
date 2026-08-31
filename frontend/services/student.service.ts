import type { Student, CreateStudentRequest } from "@/types";
import { Gender } from "@/types/enums";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let mockCloudinaryPublicIdCounter = 100;

export async function mockUploadToCloudinary(file: File, entityType: "students" | "teachers", entityId: string): Promise<{ url: string; publicId: string }> {
  await delay(600);
  const publicId = `${entityType}/${entityId}-${mockCloudinaryPublicIdCounter++}`;
  const url = `https://res.cloudinary.com/demo/image/upload/v1/${publicId}.jpg`;
  return { url, publicId };
}

export async function mockDeleteFromCloudinary(publicId: string): Promise<void> {
  await delay(400);
  console.log(`[Mock Cloudinary] Deleted image: ${publicId}`);
}

const mockStudents: Student[] = [
  {
    id: "stu-001",
    firstName: "Alice",
    lastName: "Nkwi",
    dateOfBirth: "2006-03-15",
    placeOfBirth: "Buea",
    gender: Gender.FEMALE,
    address: "Molyko, Buea",
    phone: "",
    parentName: "Mr. Nkwi Paul",
    parentPhone: "+237 670 111 222",
    studentNumber: "STU-2026-0001",
    photoUrl: "https://res.cloudinary.com/demo/image/upload/v1/students/stu-001.jpg",
    photoPublicId: "students/stu-001",
    createdAt: "2025-09-01T00:00:00Z",
    updatedAt: "2025-09-01T00:00:00Z",
  },
  {
    id: "stu-002",
    firstName: "Bob",
    lastName: "Efande",
    dateOfBirth: "2005-07-22",
    placeOfBirth: "Bamenda",
    gender: Gender.MALE,
    address: "Mile 16, Buea",
    phone: "+237 680 333 444",
    parentName: "Mrs. Efande Judith",
    parentPhone: "+237 670 555 666",
    studentNumber: "STU-2026-0002",
    photoUrl: "",
    photoPublicId: "",
    createdAt: "2025-09-01T00:00:00Z",
    updatedAt: "2025-09-01T00:00:00Z",
  },
  {
    id: "stu-003",
    firstName: "Clara",
    lastName: "Mbah",
    dateOfBirth: "2006-11-08",
    placeOfBirth: "Douala",
    gender: Gender.FEMALE,
    address: "Small Soppo, Buea",
    phone: "",
    parentName: "Mr. Mbah George",
    parentPhone: "+237 690 777 888",
    studentNumber: "STU-2026-0003",
    photoUrl: "https://res.cloudinary.com/demo/image/upload/v1/students/stu-003.jpg",
    photoPublicId: "students/stu-003",
    createdAt: "2025-09-02T00:00:00Z",
    updatedAt: "2025-09-02T00:00:00Z",
  },
  {
    id: "stu-004",
    firstName: "David",
    lastName: "Taku",
    dateOfBirth: "2005-01-30",
    placeOfBirth: "Buea",
    gender: Gender.MALE,
    address: "Bonduma, Buea",
    phone: "+237 670 999 000",
    parentName: "Mrs. Taku Beatrice",
    parentPhone: "+237 680 111 222",
    studentNumber: "STU-2026-0004",
    photoUrl: "",
    photoPublicId: "",
    createdAt: "2025-09-02T00:00:00Z",
    updatedAt: "2025-09-02T00:00:00Z",
  },
  {
    id: "stu-005",
    firstName: "Esther",
    lastName: "Ngoe",
    dateOfBirth: "2006-05-18",
    placeOfBirth: "Yaounde",
    gender: Gender.FEMALE,
    address: "Muea, Buea",
    phone: "",
    parentName: "Mr. Ngoe Michael",
    parentPhone: "+237 690 333 444",
    studentNumber: "STU-2026-0005",
    photoUrl: "",
    photoPublicId: "",
    createdAt: "2025-09-03T00:00:00Z",
    updatedAt: "2025-09-03T00:00:00Z",
  },
  {
    id: "stu-006",
    firstName: "Francis",
    lastName: "Lyonga",
    dateOfBirth: "2005-09-12",
    placeOfBirth: "Limbe",
    gender: Gender.MALE,
    address: "Great Soppo, Buea",
    phone: "+237 680 555 666",
    parentName: "Mr. Lyonga Peter",
    parentPhone: "+237 670 777 888",
    studentNumber: "STU-2026-0006",
    photoUrl: "",
    photoPublicId: "",
    createdAt: "2025-09-03T00:00:00Z",
    updatedAt: "2025-09-03T00:00:00Z",
  },
  {
    id: "stu-007",
    firstName: "Grace",
    lastName: "Asobo",
    dateOfBirth: "2006-02-25",
    placeOfBirth: "Buea",
    gender: Gender.FEMALE,
    address: "Bokwango, Buea",
    phone: "",
    parentName: "Mr. Asobo Thomas",
    parentPhone: "+237 690 999 000",
    studentNumber: "STU-2026-0007",
    photoUrl: "https://res.cloudinary.com/demo/image/upload/v1/students/stu-007.jpg",
    photoPublicId: "students/stu-007",
    createdAt: "2025-09-04T00:00:00Z",
    updatedAt: "2025-09-04T00:00:00Z",
  },
  {
    id: "stu-008",
    firstName: "Henry",
    lastName: "Mokube",
    dateOfBirth: "2005-12-03",
    placeOfBirth: "Kumba",
    gender: Gender.MALE,
    address: "Molyko, Buea",
    phone: "+237 670 111 333",
    parentName: "Mrs. Mokube Sarah",
    parentPhone: "+237 680 444 555",
    studentNumber: "STU-2026-0008",
    photoUrl: "",
    photoPublicId: "",
    createdAt: "2025-09-04T00:00:00Z",
    updatedAt: "2025-09-04T00:00:00Z",
  },
];

export const studentService = {
  async getStudents(): Promise<Student[]> {
    await delay(600);
    return [...mockStudents];
  },

  async getStudentById(id: string): Promise<Student | undefined> {
    await delay(400);
    return mockStudents.find((s) => s.id === id);
  },

  async createStudent(data: CreateStudentRequest): Promise<Student> {
    await delay(800);
    const newStudent: Student = {
      id: `stu-${String(mockStudents.length + 1).padStart(3, "0")}`,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      placeOfBirth: data.placeOfBirth,
      gender: data.gender as Gender,
      address: data.address,
      phone: data.phone,
      parentName: data.parentName,
      parentPhone: data.parentPhone,
      studentNumber: `STU-2026-${String(mockStudents.length + 1).padStart(4, "0")}`,
      photoUrl: data.photoUrl || "",
      photoPublicId: data.photoPublicId || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStudents.push(newStudent);
    return newStudent;
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    await delay(600);
    const index = mockStudents.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Student not found");
    mockStudents[index] = {
      ...mockStudents[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return mockStudents[index];
  },

  async searchStudents(query: string): Promise<Student[]> {
    await delay(400);
    const q = query.toLowerCase();
    return mockStudents.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.studentNumber.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q)
    );
  },

  async getStudentsByClass(classId: string): Promise<Student[]> {
    await delay(500);
    // In a real app, this would query enrollments
    return mockStudents.slice(0, 4);
  },

  async getStudentsByClassAndSession(classId: string, sessionId: string): Promise<Student[]> {
    await delay(500);
    const { enrollmentService } = await import("./enrollment.service");
    const enrollments = await enrollmentService.getActiveEnrollmentsByClass(classId, sessionId);
    const studentIds = new Set(enrollments.map((e) => e.studentId));
    return mockStudents.filter((s) => studentIds.has(s.id));
  },
};

