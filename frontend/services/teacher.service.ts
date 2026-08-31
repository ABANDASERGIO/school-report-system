import type { Teacher, CreateTeacherRequest } from "@/types";
import { UserRole, Gender } from "@/types/enums";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let mockCloudinaryPublicIdCounter = 200;

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

export const mockTeachers: Teacher[] = [
  {
    id: "tch-001",
    userId: "usr-002",
    firstName: "John",
    lastName: "Doe",
    email: "john.teacher@edugrade.com",
    phone: "+237 670 123 456",
    address: "Molyko, Buea",
    specialization: "Mathematics",
    photoUrl: "https://res.cloudinary.com/demo/image/upload/v1/teachers/tch-001.jpg",
    photoPublicId: "teachers/tch-001",
    isActive: true,
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-01-15T00:00:00Z",
  },
  {
    id: "tch-002",
    userId: "usr-003",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.teacher@edugrade.com",
    phone: "+237 680 789 012",
    address: "Bonduma, Buea",
    specialization: "English Literature",
    photoUrl: "",
    photoPublicId: "",
    isActive: true,
    createdAt: "2025-01-20T00:00:00Z",
    updatedAt: "2025-01-20T00:00:00Z",
  },
  {
    id: "tch-003",
    userId: "usr-004",
    firstName: "Paul",
    lastName: "Biyong",
    email: "paul.biyong@edugrade.com",
    phone: "+237 690 345 678",
    address: "Great Soppo, Buea",
    specialization: "Physics",
    photoUrl: "",
    photoPublicId: "",
    isActive: true,
    createdAt: "2025-02-01T00:00:00Z",
    updatedAt: "2025-02-01T00:00:00Z",
  },
  {
    id: "tch-004",
    userId: "usr-005",
    firstName: "Marie",
    lastName: "Ngono",
    email: "marie.ngono@edugrade.com",
    phone: "+237 670 901 234",
    address: "Muea, Buea",
    specialization: "French",
    photoUrl: "",
    photoPublicId: "",
    isActive: false,
    createdAt: "2025-02-10T00:00:00Z",
    updatedAt: "2025-03-01T00:00:00Z",
  },
  {
    id: "tch-005",
    userId: "usr-006",
    firstName: "Robert",
    lastName: "Ewanga",
    email: "robert.ewanga@edugrade.com",
    phone: "+237 680 567 890",
    address: "Bamenda",
    specialization: "History & Geography",
    photoUrl: "",
    photoPublicId: "",
    isActive: true,
    createdAt: "2025-02-15T00:00:00Z",
    updatedAt: "2025-02-15T00:00:00Z",
  },
];

export const teacherService = {
  async getTeachers(): Promise<Teacher[]> {
    await delay(600);
    return [...mockTeachers];
  },

  async getTeacherById(id: string): Promise<Teacher | undefined> {
    await delay(400);
    return mockTeachers.find((t) => t.id === id);
  },

  async createTeacher(data: CreateTeacherRequest): Promise<Teacher> {
    await delay(800);
    const newTeacher: Teacher = {
      id: `tch-${String(mockTeachers.length + 1).padStart(3, "0")}`,
      userId: `usr-${String(mockTeachers.length + 2).padStart(3, "0")}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      specialization: data.specialization,
      photoUrl: data.photoUrl || "",
      photoPublicId: data.photoPublicId || "",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTeachers.push(newTeacher);
    return newTeacher;
  },

  async updateTeacher(id: string, data: Partial<Teacher>): Promise<Teacher> {
    await delay(600);
    const index = mockTeachers.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Teacher not found");
    mockTeachers[index] = { ...mockTeachers[index], ...data, updatedAt: new Date().toISOString() };
    return mockTeachers[index];
  },

  async suspendTeacher(id: string): Promise<void> {
    await delay(500);
    const teacher = mockTeachers.find((t) => t.id === id);
    if (teacher) {
      teacher.isActive = false;
      teacher.updatedAt = new Date().toISOString();
    }
  },

  async activateTeacher(id: string): Promise<void> {
    await delay(500);
    const teacher = mockTeachers.find((t) => t.id === id);
    if (teacher) {
      teacher.isActive = true;
      teacher.updatedAt = new Date().toISOString();
    }
  },

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await delay(500);
    const teacher = mockTeachers.find((t) => t.id === id);
    if (!teacher) throw new Error("Teacher not found");
    console.log(`Password reset for ${teacher.email} to ${newPassword}`);
  },

  async deleteTeacher(id: string): Promise<void> {
    await delay(500);
    const index = mockTeachers.findIndex((t) => t.id === id);
    if (index !== -1) {
      mockTeachers.splice(index, 1);
    }
  },

  async searchTeachers(query: string): Promise<Teacher[]> {
    await delay(400);
    const q = query.toLowerCase();
    return mockTeachers.filter(
      (t) =>
        t.firstName.toLowerCase().includes(q) ||
        t.lastName.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.specialization.toLowerCase().includes(q)
    );
  },
};

