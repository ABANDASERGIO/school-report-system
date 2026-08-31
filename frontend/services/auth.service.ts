import { UserRole } from "@/types/enums";
import type { LoginRequest, LoginResponse, User, RegisterRequest } from "@/types";

interface MockUser extends User {
  password?: string;
}

const STORAGE_KEY = "edugrade_auth_mock";
const PASSWORD_KEY = "edugrade_auth_passwords";

function loadMockUsers(): MockUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [
    {
      id: "usr-001",
      email: "proprietor@edugrade.com",
      role: UserRole.PROPRIETOR,
      isActive: true,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
    {
      id: "usr-002",
      email: "john.teacher@edugrade.com",
      role: UserRole.TEACHER,
      isActive: true,
      createdAt: "2025-01-15T00:00:00Z",
      updatedAt: "2025-01-15T00:00:00Z",
    },
    {
      id: "usr-003",
      email: "jane.teacher@edugrade.com",
      role: UserRole.TEACHER,
      isActive: true,
      createdAt: "2025-01-20T00:00:00Z",
      updatedAt: "2025-01-20T00:00:00Z",
    },
  ];
}

function saveMockUsers(users: MockUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function loadPasswords(): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const raw = localStorage.getItem(PASSWORD_KEY);
    if (raw) {
      const entries = JSON.parse(raw) as [string, string][];
      entries.forEach(([id, password]) => map.set(id, password));
    }
  } catch {
    // ignore
  }
  return map;
}

function savePasswords(map: Map<string, string>) {
  localStorage.setItem(PASSWORD_KEY, JSON.stringify(Array.from(map.entries())));
}

let mockUsers = loadMockUsers();
let userPasswords = loadPasswords();
if (!userPasswords.has("usr-001")) userPasswords.set("usr-001", "proprietor");
if (!userPasswords.has("usr-002")) userPasswords.set("usr-002", "teacher");
if (!userPasswords.has("usr-003")) userPasswords.set("usr-003", "teacher");

// Simulated delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    await delay(800);

    const user = mockUsers.find((u) => u.email === credentials.email);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const storedPassword = userPasswords.get(user.id);
    if (storedPassword && storedPassword !== credentials.password) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("Your account has been deactivated. Contact the proprietor.");
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: (user as any).firstName,
        lastName: (user as any).lastName,
        role: user.role,
      },
      token: `mock-jwt-token-${user.id}-${Date.now()}`,
    };
  },

  async getCurrentUser(): Promise<User | null> {
    await delay(300);

    // Simulate getting user from stored token
    const stored = localStorage.getItem("edugrade_user");
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    await delay(200);
    localStorage.removeItem("edugrade_user");
    localStorage.removeItem("edugrade_token");
  },

  async resetTeacherPassword(teacherId: string, newPassword: string): Promise<void> {
    await delay(500);
    // In real app, this would call the API
    console.log(`Password reset for teacher ${teacherId}`);
  },

  async hasProprietor(): Promise<boolean> {
    await delay(300);
    return mockUsers.some((u) => u.role === UserRole.PROPRIETOR);
  },

  async findUserByEmail(email: string): Promise<MockUser | undefined> {
    await delay(200);
    return mockUsers.find((u) => u.email === email);
  },

  async resetPasswordByEmail(email: string, newPassword: string): Promise<void> {
    await delay(600);
    const user = mockUsers.find((u) => u.email === email);
    if (!user) {
      throw new Error("No account found with that email.");
    }
    if (user.role !== UserRole.PROPRIETOR) {
      throw new Error("Only proprietor accounts can be recovered from this page.");
    }
    userPasswords.set(user.id, newPassword);
    savePasswords(userPasswords);
  },

  async registerProprietor(data: RegisterRequest): Promise<LoginResponse> {
    await delay(800);

    const existing = mockUsers.find((u) => u.email === data.email);
    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const proprietorExists = mockUsers.some((u) => u.role === UserRole.PROPRIETOR);
    if (proprietorExists) {
      throw new Error("Proprietor account already exists. Contact support.");
    }

    const newUser: MockUser = {
      id: `usr-${String(mockUsers.length + 1).padStart(3, "0")}`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: UserRole.PROPRIETOR,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      password: data.password,
    };

    mockUsers.push(newUser);
    userPasswords.set(newUser.id, data.password);
    saveMockUsers(mockUsers);
    savePasswords(userPasswords);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
      token: `mock-jwt-token-${newUser.id}-${Date.now()}`,
    };
  },
};

