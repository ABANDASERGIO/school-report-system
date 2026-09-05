import {
  idbPut,
  idbGet,
  idbGetAll,
  idbDelete,
  idbClear,
  idbWhere,
  openLocalDb,
} from '../indexeddb';
import { promisifyRequest } from '../idb-promisify';
import type { DBSession, DBTerm, DBSequence } from '../schema';

// ---- Sessions ----

export async function putSession(session: DBSession): Promise<void> {
  await idbPut('sessions', session);
}

export async function getSession(id: string): Promise<DBSession | undefined> {
  return idbGet<DBSession>('sessions', id);
}

export async function getAllSessions(): Promise<DBSession[]> {
  return idbGetAll<DBSession>('sessions');
}

export async function getCurrentSession(): Promise<DBSession | undefined> {
  const db = await openLocalDb();
  const tx = db.transaction('sessions', 'readonly');
  const idx = tx.objectStore('sessions').index('isCurrent');
  const result = await promisifyRequest<DBSession | undefined>(idx.get(1), 'success');
  return result ?? undefined;
}

export async function replaceSessions(sessions: DBSession[]): Promise<void> {
  await idbClear('sessions');
  const db = await openLocalDb();
  const tx = db.transaction('sessions', 'readwrite');
  const store = tx.objectStore('sessions');
  for (const s of sessions) store.put(s);
  await new Promise<void>((resolve, reject) => {
    tx.addEventListener('complete', () => resolve());
    tx.addEventListener('error', () => reject(tx.error));
  });
}

// ---- Terms ----

export async function putTerm(term: DBTerm): Promise<void> {
  await idbPut('terms', term);
}

export async function getTermsBySession(sessionId: string): Promise<DBTerm[]> {
  return idbWhere<DBTerm>('terms', 'sessionId', sessionId);
}

export async function getAllTerms(): Promise<DBTerm[]> {
  return idbGetAll<DBTerm>('terms');
}

export async function replaceTerms(terms: DBTerm[]): Promise<void> {
  await idbClear('terms');
  const db = await openLocalDb();
  const tx = db.transaction('terms', 'readwrite');
  const store = tx.objectStore('terms');
  for (const t of terms) store.put(t);
  await new Promise<void>((resolve, reject) => {
    tx.addEventListener('complete', () => resolve());
    tx.addEventListener('error', () => reject(tx.error));
  });
}

// ---- Sequences ----

export async function putSequence(seq: DBSequence): Promise<void> {
  await idbPut('sequences', seq);
}

export async function getSequencesBySession(sessionId: string): Promise<DBSequence[]> {
  return idbWhere<DBSequence>('sequences', 'sessionId', sessionId);
}

export async function getSequencesByTerm(termId: string): Promise<DBSequence[]> {
  return idbWhere<DBSequence>('sequences', 'termId', termId);
}

export async function getActiveSequence(sessionId: string): Promise<DBSequence | undefined> {
  const all = await getSequencesBySession(sessionId);
  return all.find((s) => s.isActive);
}

export async function getAllSequences(): Promise<DBSequence[]> {
  return idbGetAll<DBSequence>('sequences');
}

export async function replaceSequences(sequences: DBSequence[]): Promise<void> {
  await idbClear('sequences');
  const db = await openLocalDb();
  const tx = db.transaction('sequences', 'readwrite');
  const store = tx.objectStore('sequences');
  for (const s of sequences) store.put(s);
  await new Promise<void>((resolve, reject) => {
    tx.addEventListener('complete', () => resolve());
    tx.addEventListener('error', () => reject(tx.error));
  });
}
