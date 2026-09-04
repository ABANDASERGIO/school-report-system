import {
  idbPut,
  idbGet,
  idbGetAll,
  idbDelete,
  idbClear,
  idbWhere,
} from '../indexeddb';
import type { DBSyncQueueItem } from '../schema';

export async function enqueue(item: DBSyncQueueItem): Promise<void> {
  await idbPut('sync_queue', item);
}

export async function getQueueItem(id: string): Promise<DBSyncQueueItem | undefined> {
  return idbGet<DBSyncQueueItem>('sync_queue', id);
}

export async function getPendingItems(): Promise<DBSyncQueueItem[]> {
  return idbWhere<DBSyncQueueItem>('sync_queue', 'status', 'pending');
}

export async function getFailedItems(): Promise<DBSyncQueueItem[]> {
  return idbWhere<DBSyncQueueItem>('sync_queue', 'status', 'failed');
}

export async function getAllQueueItems(): Promise<DBSyncQueueItem[]> {
  return idbGetAll<DBSyncQueueItem>('sync_queue');
}

export async function markDone(id: string): Promise<void> {
  await idbDelete('sync_queue', id);
}

export async function markFailed(id: string, lastError: string): Promise<void> {
  const item = await getQueueItem(id);
  if (item) {
    await idbPut('sync_queue', {
      ...item,
      status: 'failed',
      lastError,
      attempts: item.attempts + 1,
    });
  }
}

export async function updateItem(item: DBSyncQueueItem): Promise<void> {
  await idbPut('sync_queue', item);
}

export async function clearQueue(): Promise<void> {
  await idbClear('sync_queue');
}

export async function getPendingCount(): Promise<number> {
  return idbWhere<DBSyncQueueItem>('sync_queue', 'status', 'pending').then((r) => r.length);
}
