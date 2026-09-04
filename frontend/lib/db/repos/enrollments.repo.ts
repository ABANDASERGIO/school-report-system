import {
  idbPut,
  idbGet,
  idbGetAll,
  idbDelete,
  idbClear,
  idbWhere,
} from '../indexeddb';
import type { DBEnrollment } from '../schema';

export async function putEnrollment(e: DBEnrollment): Promise<void> {
  await idbPut('enrollments', e);
}

export async function getEnrollment(id: string): Promise<DBEnrollment | undefined> {
  return idbGet<DBEnrollment>('enrollments', id);
}

export async function getEnrollmentsByStudent(studentId: string): Promise<DBEnrollment[]> {
  return idbWhere<DBEnrollment>('enrollments', 'studentId', studentId);
}

export async function getEnrollmentsByClass(classId: string): Promise<DBEnrollment[]> {
  return idbWhere<DBEnrollment>('enrollments', 'classId', classId);
}

export async function getActiveEnrollmentsByClass(classId: string, sessionId: string): Promise<DBEnrollment[]> {
  const all = await getEnrollmentsByClass(classId);
  return all.filter((e) => e.classId === classId && e.sessionId === sessionId && e.status === 'ACTIVE');
}

export async function getAllEnrollments(): Promise<DBEnrollment[]> {
  return idbGetAll<DBEnrollment>('enrollments');
}

export async function replaceEnrollments(enrollments: DBEnrollment[]): Promise<void> {
  await idbClear('enrollments');
  const db = await (await import('../indexeddb')).openLocalDb();
  const tx = db.transaction('enrollments', 'readwrite');
  const store = tx.objectStore('enrollments');
  for (const e of enrollments) store.put(e);
  await new Promise<void>((resolve, reject) => {
    tx.addEventListener('complete', () => resolve());
    tx.addEventListener('error', () => reject(tx.error));
  });
}
