import {
  idbPut,
  idbGet,
  idbGetAll,
  idbDelete,
  idbClear,
  idbWhere,
} from '../indexeddb';
import type { DBStudent } from '../schema';

export async function putStudent(s: DBStudent): Promise<void> {
  await idbPut('students', s);
}

export async function getStudent(id: string): Promise<DBStudent | undefined> {
  return idbGet<DBStudent>('students', id);
}

export async function getStudentByNumber(studentNumber: string): Promise<DBStudent | undefined> {
  return idbWhere<DBStudent>('students', 'studentNumber', studentNumber).then((r) => r[0]);
}

export async function getAllStudents(): Promise<DBStudent[]> {
  return idbGetAll<DBStudent>('students');
}

export async function searchStudents(query: string): Promise<DBStudent[]> {
  const all = await getAllStudents();
  const q = query.toLowerCase();
  return all.filter(
    (s) =>
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.studentNumber.toLowerCase().includes(q)
  );
}

export async function replaceStudents(students: DBStudent[]): Promise<void> {
  await idbClear('students');
  const db = await (await import('../indexeddb')).openLocalDb();
  const tx = db.transaction('students', 'readwrite');
  const store = tx.objectStore('students');
  for (const s of students) store.put(s);
  await new Promise<void>((resolve, reject) => {
    tx.addEventListener('complete', () => resolve());
    tx.addEventListener('error', () => reject(tx.error));
  });
}
