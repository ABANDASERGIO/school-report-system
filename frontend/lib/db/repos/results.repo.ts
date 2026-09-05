import {
  idbPut,
  idbGet,
  idbGetAll,
  idbDelete,
  idbClear,
  idbWhere,
} from '../indexeddb';
import type { DBResult } from '../schema';

export async function putResult(r: DBResult): Promise<void> {
  await idbPut('results', r);
}

export async function getResult(id: string): Promise<DBResult | undefined> {
  return idbGet<DBResult>('results', id);
}

export async function getResultByCell(
  studentId: string,
  subjectId: string,
  sequenceId: string,
  sessionId: string
): Promise<DBResult | undefined> {
  const all = await idbWhere<DBResult>('results', 'studentId', studentId);
  return all.find(
    (r) =>
      r.studentId === studentId &&
      r.subjectId === subjectId &&
      r.sequenceId === sequenceId &&
      r.sessionId === sessionId
  );
}

export async function getResultsBySequence(sequenceId: string): Promise<DBResult[]> {
  return idbWhere<DBResult>('results', 'sequenceId', sequenceId);
}

export async function getResultsBySession(sessionId: string): Promise<DBResult[]> {
  return idbWhere<DBResult>('results', 'sessionId', sessionId);
}

export async function getDirtyResults(): Promise<DBResult[]> {
  return idbWhere<DBResult>('results', 'dirty', '1');
}

export async function clearDirtyFlag(id: string): Promise<void> {
  const r = await getResult(id);
  if (r) {
    await idbPut('results', { ...r, dirty: 0, pendingOpId: undefined });
  }
}

export async function getAllResults(): Promise<DBResult[]> {
  return idbGetAll<DBResult>('results');
}

export async function replaceResults(results: DBResult[]): Promise<void> {
  await idbClear('results');
  const db = await (await import('../indexeddb')).openLocalDb();
  const tx = db.transaction('results', 'readwrite');
  const store = tx.objectStore('results');
  for (const r of results) store.put(r);
  await new Promise<void>((resolve, reject) => {
    tx.addEventListener('complete', () => resolve());
    tx.addEventListener('error', () => reject(tx.error));
  });
}
