import type { SchoolSetting } from "@/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockSettings: SchoolSetting[] = [
  {
    id: "set-001",
    key: "school_name",
    value: "Government High School Buea",
    description: "Official name of the school",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "set-002",
    key: "school_motto",
    value: "Knowledge is Light",
    description: "School motto",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "set-003",
    key: "school_address",
    value: "Molyko, Buea, South West Region, Cameroon",
    description: "Physical address of the school",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "set-004",
    key: "school_phone",
    value: "+237 670 000 000",
    description: "School contact phone number",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "set-005",
    key: "school_email",
    value: "info@ghsbuea.edu.cm",
    description: "School contact email",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "set-006",
    key: "school_logo",
    value: "",
    description: "School logo image (base64 or URL)",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "set-007",
    key: "grading_system",
    value: "cameroon_gce",
    description: "The grading system used (cameroon_gce, french, etc.)",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "set-008",
    key: "max_score",
    value: "20",
    description: "Maximum score per subject",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "set-009",
    key: "pass_mark",
    value: "10",
    description: "Minimum passing score",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "set-010",
    key: "academic_year_format",
    value: "2026/2027",
    description: "Current academic year display format",
    updatedAt: "2025-09-01T00:00:00Z",
  },
  {
    id: "set-011",
    key: "marks_entry_open",
    value: "true",
    description: "Whether teachers can enter marks. When false, teachers can only view marks.",
    updatedAt: "2025-09-01T00:00:00Z",
  },
];

export const settingsService = {
  async getAllSettings(): Promise<SchoolSetting[]> {
    await delay(500);
    return [...mockSettings];
  },

  async getSetting(key: string): Promise<SchoolSetting | undefined> {
    await delay(300);
    return mockSettings.find((s) => s.key === key);
  },

  async updateSetting(key: string, value: string): Promise<SchoolSetting> {
    await delay(500);
    const setting = mockSettings.find((s) => s.key === key);
    if (!setting) {
      throw new Error(`Setting "${key}" not found`);
    }
    setting.value = value;
    setting.updatedAt = new Date().toISOString();
    return setting;
  },

  async updateSettings(settings: { key: string; value: string }[]): Promise<void> {
    await delay(700);
    for (const { key, value } of settings) {
      const setting = mockSettings.find((s) => s.key === key);
      if (setting) {
        setting.value = value;
        setting.updatedAt = new Date().toISOString();
      }
    }
  },

  async getSchoolName(): Promise<string> {
    await delay(200);
    const setting = mockSettings.find((s) => s.key === "school_name");
    return setting?.value || "EduGrade School";
  },
};

