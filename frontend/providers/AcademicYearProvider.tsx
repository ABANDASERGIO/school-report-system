"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { sessionService } from "@/services/session.service";
import { termService } from "@/services/term.service";
import type { AcademicSession, Term } from "@/types";
import { useAuth } from "@/providers/AuthProvider";

interface AcademicYearContextType {
  sessions: AcademicSession[];
  activeSession: AcademicSession | null;
  activeTerm: Term | null;
  isLoading: boolean;
  hasSessions: boolean;
  setActiveSession: (sessionId: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export function AcademicYearProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [activeSession, setActiveSessionState] = useState<AcademicSession | null>(null);
  const [activeTerm, setActiveTerm] = useState<Term | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSessions = async () => {
    try {
      const all = await sessionService.getSessions();
      setSessions(all);
      const current = all.find((s) => s.isCurrent) || null;
      setActiveSessionState(current);

      if (current) {
        const terms = await termService.getTerms(current.id);
        setActiveTerm(terms.find((t) => t.isCurrent) || null);
      } else {
        setActiveTerm(null);
      }
    } catch (err) {
      console.error("Failed to load sessions", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      return;
    }
    void Promise.resolve().then(loadSessions);
  }, [authLoading, isAuthenticated]);

  const setActiveSession = async (sessionId: string) => {
    try {
      await sessionService.setCurrentSession(sessionId);
      // Refresh from server to ensure consistency
      await loadSessions();
    } catch (err) {
      console.error("Failed to set active session", err);
      throw err;
    }
  };

  const refreshSessions = async () => {
    await loadSessions();
  };

  return (
    <AcademicYearContext.Provider
      value={{
        sessions,
        activeSession,
        activeTerm,
        isLoading: authLoading || (isAuthenticated && isLoading),
        hasSessions: sessions.length > 0,
        setActiveSession,
        refreshSessions,
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const context = useContext(AcademicYearContext);
  if (context === undefined) {
    throw new Error("useAcademicYear must be used within an AcademicYearProvider");
  }
  return context;
}
