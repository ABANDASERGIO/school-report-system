/**
 * Tiny promisifier for IndexedDB requests/events.
 * Pure utility — no deps, no framework imports.
 */
export function promisifyRequest<T>(
  request: IDBRequest<T>,
  eventName: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result as T));
    request.addEventListener('error', () => reject(request.error));
  });
}

export function promisifyTransaction(
  transaction: IDBTransaction,
  eventName: 'complete' | 'error'
): Promise<Event> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener(eventName, () => resolve(new Event(eventName)));
    transaction.addEventListener('error', () => reject(transaction.error));
  });
}
