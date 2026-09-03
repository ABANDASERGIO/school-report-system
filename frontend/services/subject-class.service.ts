import { apiClient } from '@/lib/api-client';

/**
 * Junction service: manages which subjects are assigned to which class.
 * On the backend this is the SubjectClass table.
 *
 * Used by the class detail page to add/remove subjects from a class.
 */
export const subjectClassService = {
  async getClassesForSubject(subjectId: string): Promise<string[]> {
    return apiClient.get<string[]>(`/subjects/${subjectId}/classes`);
  },

  async getSubjectsForClass(classId: string): Promise<string[]> {
    return apiClient.get<string[]>(`/subjects/class/${classId}`);
  },

  async setSubjectClasses(classId: string, subjectIds: string[]): Promise<void> {
    await apiClient.put(`/subjects/class/${classId}`, { subjectIds });
  },

  async setClassesForSubject(subjectId: string, classIds: string[]): Promise<void> {
    // Backend currently exposes "replace subjects for class". We mimic the
    // reverse operation client-side: load the full junction, then PUT each
    // affected class with the new subject list (excluding/including this subject).
    const { classService } = await import('./class.service');
    const { subjectService } = await import('./subject.service');
    const allClasses = await classService.getClasses();
    const uniqueClassIds = Array.from(new Set(classIds));

    for (const cls of allClasses) {
      const currentSubjectIds = await apiClient.get<string[]>(`/subjects/class/${cls.id}`);
      const hasSubject = currentSubjectIds.includes(subjectId);
      const shouldHave = uniqueClassIds.includes(cls.id);

      if (hasSubject === shouldHave) continue;

      const next = shouldHave
        ? Array.from(new Set([...currentSubjectIds, subjectId]))
        : currentSubjectIds.filter((id) => id !== subjectId);

      await apiClient.put(`/subjects/class/${cls.id}`, { subjectIds: next });
    }

    // touch the service so it's not tree-shaken in callers that only use it
    void subjectService;
  },

  async getAllSubjectClasses(): Promise<Array<{ subjectId: string; classId: string }>> {
    // Backend doesn't expose a single endpoint for the full junction.
    // Fetch subjects and resolve via getClassIdsForSubject for each.
    const subjects = await apiClient.get<Array<{ id: string }>>('/subjects');
    const out: Array<{ subjectId: string; classId: string }> = [];
    for (const s of subjects) {
      const classIds = await apiClient.get<string[]>(`/subjects/${s.id}/classes`);
      for (const classId of classIds) {
        out.push({ subjectId: s.id, classId });
      }
    }
    return out;
  },
};
