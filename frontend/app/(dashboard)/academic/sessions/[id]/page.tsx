"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sessionService } from "@/services/session.service";
import { termService } from "@/services/term.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showToast } from "@/components/ui/Toast";
import type { AcademicSession, Term } from "@/types";
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronRight, Edit, Layers } from "lucide-react";

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [session, setSession] = useState<AcademicSession | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const resolvedParams = React.use(params);
  const sessionId = resolvedParams.id;

  useEffect(() => {
    async function load() {
      try {
        const [s, t] = await Promise.all([
          sessionService.getSessionById(sessionId),
          termService.getTerms(sessionId),
        ]);
        if (s) setSession(s);
        setTerms(t);
      } catch {
        showToast({ type: "error", title: "Failed to load session" });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [sessionId]);

  const handleActivateTerm = async (termId: string) => {
    if (!session) return;
    setActivatingId(termId);
    try {
      await termService.setCurrentTerm(termId, session.id);
      setTerms((prev) => prev.map((t) => ({ ...t, isCurrent: t.id === termId })));
      showToast({ type: "success", title: "Term activated" });
    } catch {
      showToast({ type: "error", title: "Failed to activate term" });
    } finally {
      setActivatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton variant="card" className="h-32" />
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} variant="card" />))}</div>
      </div>
    );
  }

  if (!session) {
    return <EmptyState title="Session not found" description="The requested session could not be loaded." icon={<CalendarDays className="h-8 w-8" />} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push("/academic/sessions")}>Back</Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-primary">{session.name}</h1>
          <p className="text-sm text-gray-500">{new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}</p>
        </div>
        <Button variant="secondary" size="sm" leftIcon={<Edit className="h-4 w-4" />} onClick={() => router.push(`/academic/sessions/${session.id}/edit`)}>Edit</Button>
      </div>

      <div className="space-y-4">
        {terms.map((term) => (
          <Card key={term.id}>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <span>{term.name}</span>
                  {term.isCurrent && <Badge variant="success" size="sm"><CheckCircle2 className="h-3 w-3 mr-0.5" />Active</Badge>}
                </div>
              }
              description={`${new Date(term.startDate).toLocaleDateString()} - ${new Date(term.endDate).toLocaleDateString()} · ${term.sequences?.length || term.sequenceCount} sequences`}
              action={
                term.isCurrent ? (
                  <span className="text-xs text-green-600 font-medium">Current</span>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => handleActivateTerm(term.id)} disabled={activatingId === term.id}>
                    {activatingId === term.id ? "Saving..." : "Activate"}
                  </Button>
                )
              }
            />
            {term.sequences && term.sequences.length > 0 && (
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {term.sequences.map((seq) => (
                    <div key={seq.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-gray-50/50">
                      <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                        <Layers className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">{seq.name}</p>
                        <p className="text-xs text-gray-500">{new Date(seq.startDate).toLocaleDateString()} - {new Date(seq.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
