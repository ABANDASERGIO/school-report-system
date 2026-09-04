import { promisifyRequest, promisifyTransaction } from '@/lib/db/idb-promisify';

let dbInstance: IDBDatabase | null = null;

/**
 * Open (or return cached) EduGrade offline database.
 * Throws if IndexedDB is unavailable (very old browsers / private mode
 * with no quota).
 */
export async function openLocalDb(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available in this browser');
  }

  const db = await promisifyRequest<IDBDatabase>(
    indexedDB.open('edugrade-offline', 1),
    'upgradeneeded'
  );

  if (db.objectStoreNames.contains('sessions')) return db;

  // ---- schema migration ----
  const tx = db.transaction(
    [
      'sessions',
      'terms',
      'sequences',
      'classes',
      'subjects',
      'assignments',
      'students',
      'enrollments',
      'results',
      'sync_queue',
    ],
    'readwrite'
  );

  const makeStore = (name: string, keyPath: string, indexes: { key: string; unique?: boolean }[] = []) => {
    const store = tx.objectStore(name);
    for (const idx of indexes) {
      store.createIndex(idx.key, idx.key, idx.unique ? { unique: true } : undefined);
    }
    return store;
  };

  makeStore('sessions', 'id', [{ key: 'isCurrent' }]);
  makeStore('terms', 'id', [{ key: 'sessionId' }]);
  makeStore('sequences', 'id', [
    { key: 'sessionId' },
    { key: 'termId' },
    { key: 'isActive' },
  ]);
  makeStore('classes', 'id');
  makeStore('subjects', 'id');
  makeStore('assignments', 'id', [{ key: 'teacherId' }, { key: 'classId' }]);
  makeStore('students', 'id', [{ key: 'studentNumber' }]);
  makeStore('enrollments', 'id', [
    { key: 'studentId' },
    { key: 'classId' },
    { key: 'sessionId' },
    { key: 'status' },
  ]);
  makeStore('results', 'id', [
    { key: 'studentId' },
    { key: 'subjectId' },
    { key: 'sequenceId' },
    { key: 'sessionId' },
    { key: 'dirty' },
    { key: 'pendingOpId' },
  ]);
  makeStore('sync_queue', 'id', [{ key: 'status' }, { key: 'nextAttemptAt' }]);

  await promisifyTransaction(tx, 'complete');

  dbInstance = db;
  return db;
}

// ---------- Generic helpers ----------

export async function idbPut<T>(storeName: string, value: T): Promise<void> {
  const db = await openLocalDb();
  const tx = db.transaction(storeName, 'readwrite');
  await promisifyRequest(tx.objectStore(storeName).put(value), 'complete');
}

export async function idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openLocalDb();
  const tx = db.transaction(storeName, 'readonly');
  const result = await promisifyRequest<T>(tx.objectStore(storeName).get(key), 'success');
  return result ?? undefined;
}

export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openLocalDb();
  const tx = db.transaction(storeName, 'readonly');
  const result = await promisifyRequest<T[]>(tx.objectStore(storeName).getAll(), 'success');
  return result ?? [];
}

export async function idbDelete(storeName: string, key: string): Promise<void> {
  const db = await openLocalDb();
  const tx = db.transaction(storeName, 'readwrite');
  await promisifyRequest(tx.objectStore(storeName).delete(key), 'complete');
}

export async function idbClear(storeName: string): Promise<void> {
  const db = await openLocalDb();
  const tx = db.transaction(storeName, 'readwrite');
  await promisifyRequest(tx.objectStore(storeName).clear(), 'complete');
}

export async function idbWhere<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
  const db = await openLocalDb();
  const tx = db.transaction(storeName, 'readonly');
  const idx = tx.objectStore(storeName).index(indexName);
  const result = await promisifyRequest<T[]>(idx.getAll(value), 'success');
  return result ?? [];
}

export async function idbCount(storeName: string): Promise<number> {
  const db = await openLocalDb();
  const tx = db.transaction(storeName, 'readonly');
  const result = await promisifyRequest<number>(tx.objectStore(storeName).count(), 'success');
  return result ?? 0;
}

export async function idbClose(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
