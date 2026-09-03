"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { termService } from "@/services/term.service";
import { sessionService } from "@/services/session.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Term, AcademicSession } from "@/types";
import { Plus, CalendarRange, ChevronRight } from "lucide-react";

export default function TermsPage() {
  const router = useRouter();
  const [terms, setTerms] = useState<Term[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    sessionService.getSessions().then((data) => {
      setSessions(data);
      const current = data.find((s) => s.isCurrent);
      if (current) setSelectedSession(current.id);
    });
  }, []);

  useEffect(() => {
    if (selectedSession) {
      setIsLoading(true);
      termService.getTerms(selectedSession).then(setTerms).finally(() => setIsLoading(false));
    }
  }, [selectedSession]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-xl font-bold text-primary">Terms</h1></div>
        <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />} onClick={() => router.push("/academic/terms/new")}>New Term</Button>
      </div>
      <Select label="Academic Session" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} options={sessions.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select session" />
      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} variant="card" />))}</div>
      ) : terms.length === 0 ? (
        <EmptyState title="No terms" description="Select a session and create terms." icon={<CalendarRange className="h-8 w-8" />} action={{ label: "Create Term", onClick: () => router.push("/academic/terms/new") }} />
      ) : (
        <div className="space-y-3">
          {terms.map((t) => (
            <Card key={t.id} hover>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center"><CalendarRange className="h-6 w-6 text-accent" /></div>
                  <div>
                    <p className="text-sm font-semibold text-primary">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.sequenceCount} sequences · {new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
