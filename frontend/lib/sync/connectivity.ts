/**
 * Connectivity: tells the rest of the app whether we're online, and emits
 * events when the status changes. Uses both `navigator.onLine` (instant)
 * and a periodic heartbeat to `/health` (catches captive portals).
 */

type Listener = (online: boolean) => void;

const HEALTH_URL = '/health';
const HEARTBEAT_INTERVAL_MS = 30_000;

let online = typeof navigator !== 'undefined' ? navigator.onLine : true;
const listeners = new Set<Listener>();

function setOnline(value: boolean) {
  if (online === value) return;
  online = value;
  for (const fn of listeners) fn(online);
}

async function ping(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_URL, { method: 'GET', cache: 'no-store' });
    const ok = res.ok;
    setOnline(ok);
    return ok;
  } catch {
    setOnline(false);
    return false;
  }
}

export function isOnline(): boolean {
  return online;
}

export function onConnectivityChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function startHeartbeat(): Promise<() => void> {
  await ping();
  const id = setInterval(() => {
    void ping();
  }, HEARTBEAT_INTERVAL_MS);
  return () => clearInterval(id);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => setOnline(true));
  window.addEventListener('offline', () => setOnline(false));
}
