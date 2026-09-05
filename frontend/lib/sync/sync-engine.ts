/**
 * Sync engine: drains the `sync_queue` outbox when online, oldest-first.
 * Each item is retried with exponential backoff up to 5 minutes. Failed
 * items (4xx validation) are marked `failed` and left for the user; 5xx /
 * network failures are retried indefinitely.
 *
 * The engine is intentionally single-flight: if a drain is already in
 * progress, new queue items wait for the next tick. This prevents the
 * teacher from spamming Save while a sync is in flight.
 */

import { isOnline } from './connectivity';
import { getPendingItems, markDone, markFailed, updateItem } from '@/lib/db/repos/sync-queue.repo';

let draining = false;
const drainers: Array<() => void> = [];

export async function waitForDrainSlot(): Promise<void> {
  if (!draining) return;
  await new Promise<void>((resolve) => drainers.push(resolve));
}

async function runDrain(): Promise<void> {
  draining = true;
  const pending = await getPendingItems();
  for (const item of pending) {
    if (!isOnline()) break;
    try {
      await postItem(item);
      await markDone(item.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isPermanentError(err)) {
        await markFailed(item.id, msg);
      } else {
        const next = backoff(item.attempts + 1);
        await updateItem({
          ...item,
          attempts: item.attempts + 1,
          lastError: msg,
          nextAttemptAt: new Date(Date.now() + next).toISOString(),
        });
      }
    }
  }
  draining = false;
  while (drainers.length) {
    const fn = drainers.shift()!;
    fn();
  }
}

export async function enqueueAndDrain(item: Parameters<typeof markDone>[0] extends never ? never : {
  op: string;
  endpoint: string;
  method: string;
  body: unknown;
  idempotencyKey?: string;
}): Promise<void> {
  const now = new Date();
  const queueItem = {
    id: crypto.randomUUID(),
    op: item.op,
    endpoint: item.endpoint,
    method: item.method,
    body: item.body,
    idempotencyKey: item.idempotencyKey,
    attempts: 0,
    lastError: undefined,
    createdAt: now.toISOString(),
    nextAttemptAt: now.toISOString(),
    status: 'pending' as const,
  };
  await (await import('@/lib/db/repos/sync-queue.repo')).enqueue(queueItem);
  if (isOnline()) {
    await runDrain();
  }
}

export async function drainNow(): Promise<void> {
  if (isOnline()) await runDrain();
}

async function postItem(item: {
  endpoint: string;
  method: string;
  body: unknown;
}): Promise<Response> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const url = `${apiBase}${item.endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Re-attach auth token from localStorage (same as api-client does).
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('edugrade_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: item.method,
    headers,
    body: JSON.stringify(item.body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  return res;
}

function isPermanentError(err: unknown): boolean {
  if (err instanceof TypeError) return false; // network
  const status = (err as any)?.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) return true;
  return false;
}

function backoff(attempt: number): number {
  const base = 1000;
  const cap = 5 * 60 * 1000;
  return Math.min(cap, base * Math.pow(2, attempt - 1));
}
