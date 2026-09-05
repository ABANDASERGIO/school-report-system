import {
  idbPut,
  idbGet,
  idbGetAll,
  idbDelete,
  idbClear,
  idbWhere,
} from '../indexeddb';
import type { DBAssignment } from '../schema';

export async function putAssignment(a: DBAssignment): Promise<void> {
  await idbPut('assignments', a);
}

export async function getAssignment(id: string): Promise<DBAssignment | undefined> {
  return idbGet<DBAssignment>('assignments', id);
}

export async function getAssignmentsByTeacher(teacherId: string): Promise<DBAssignment[]> {
  return idbWhere<DBAssignment>('assignments', 'teacherId', teacherId);
}

export async function getAssignmentsByClass(classId: string): Promise<DBAssignment[]> {
  return idbWhere<DBAssignment>('assignments', 'classId', classId);
}

export async function getAllAssignments(): Promise<DBAssignment[]> {
  return idbGetAll<DBAssignment>('assignments');
}

export async function replaceAssignments(assignments: DBAssignment[]): Promise<void> {
  await idbClear('assignments');
  const db = await (await import('../indexeddb')).openLocalDb();
  const tx = db.transaction('assignments', 'readwrite');
  const store = tx.objectStore('assignments');
  for (const a of assignments) store.put(a);
  await new Promise<void>((resolve, reject) => {
    tx.addEventListener('complete', () => resolve());
    tx.addEventListener('error', () => reject(tx.error));
  });
}
