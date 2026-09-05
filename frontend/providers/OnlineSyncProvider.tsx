"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { isOnline, onConnectivityChange, startHeartbeat } from "@/lib/sync/connectivity";
import { syncAllTeacherData } from "@/lib/sync/online-sync";
import { drainNow } from "@/lib/sync/sync-engine";
import { openLocalDb } from "@/lib/db/indexeddb";

interface SyncState {
  online: boolean;
  syncing: boolean;
  pendingSyncs: number;
  lastSyncedAt: string | null;
}

interface SyncContextValue extends SyncState {
  refresh: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function OnlineSyncProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SyncState>({
    online: isOnline(),
    syncing: false,
    pendingSyncs: 0,
    lastSyncedAt: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, syncing: true }));
    try {
      if (isOnline()) {
        await syncAllTeacherData();
        await drainNow();
      }
      const { getPendingCount } = await import("@/lib/db/repos/sync-queue.repo");
      const pending = await getPendingCount();
      setState((s) => ({
        ...s,
        syncing: false,
        pendingSyncs: pending,
        lastSyncedAt: new Date().toISOString(),
      }));
    } catch {
      setState((s) => ({ ...s, syncing: false }));
    }
  }, []);

  useEffect(() => {
    let stopHeartbeat: (() => void) | undefined;
    (async () => {
      await openLocalDb();
      stopHeartbeat = await startHeartbeat();
      await refresh();
    })();

    const unsub = onConnectivityChange((online) => {
      setState((s) => ({ ...s, online }));
      if (online) void refresh();
    });

    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      unsub();
      stopHeartbeat?.();
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return <SyncContext.Provider value={{ ...state, refresh }}>{children}</SyncContext.Provider>;
}

export function useOnlineSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useOnlineSync must be used within OnlineSyncProvider");
  return ctx;
}
