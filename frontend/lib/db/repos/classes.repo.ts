import {
  idbPut,
  idbGet,
  idbGetAll,
  idbDelete,
  idbClear,
  idbWhere,
} from '../indexeddb';
import type { DBClass, DBSubject } from '../schema';

// ---- Classes ----

export async function putClass(cls: DBClass): Promise<void> {
  await idbPut('classes', cls);
}

export async function getClass(id: string): Promise<DBClass | undefined> {
  return idbGet<DBClass>('classes', id);
}

export async function getAllClasses(): Promise<DBClass[]> {
  return idbGetAll<DBClass>('classes');
}

export async function replaceClasses(classes: DBClass[]): Promise<void> {
  await idbClear('classes');
  const db = await (await import('../indexeddb')).openLocalDb();
  const tx = db.transaction('classes', 'readwrite');
  const store = tx.objectStore('classes');
  for (const c of classes) store.put(c);
  await new Promise<void>((resolve, reject) => {
    tx.addEventListener('complete', () => resolve());
    tx.addEventListener('error', () => reject(tx.error));
  });
}

// ---- Subjects ----

export async function putSubject(subject: DBSubject): Promise<void> {
  await idbPut('subjects', subject);
}

export async function getSubject(id: string): Promise<DBSubject | undefined> {
  return idbGet<DBSubject>('subjects', id);
}

export async function getAllSubjects(): Promise<DBSubject[]> {
  return idbGetAll<DBSubject>('subjects');
}

export async function replaceSubjects(subjects: DBSubject[]): Promise<void> {
  await idbClear('subjects');
  const db = await (await import('../indexeddb')).openLocalDb();
  const tx = db.transaction('subjects', 'readwrite');
  const store = tx.objectStore('subjects');
  for (const s of subjects) store.put(s);
  await new Promise<void>((resolve, reject) => {
    tx.addEventListener('complete', () => resolve());
    tx.addEventListener('error', () => reject(tx.error));
  });
}
