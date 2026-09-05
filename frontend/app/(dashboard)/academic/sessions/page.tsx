"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sessionService } from "@/services/session.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AcademicSession } from "@/types";
import { Plus, CalendarDays, ChevronRight, CheckCircle2, Edit } from "lucide-react";

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    sessionService.getSessions().then(setSessions).finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-xl font-bold text-primary">Academic Sessions</h1><p className="text-sm text-gray-500 mt-1">{sessions.length} sessions</p></div>
        <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />} onClick={() => router.push("/academic/sessions/new")}>New Session</Button>
      </div>
      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} variant="card" />))}</div>
      ) : sessions.length === 0 ? (
        <EmptyState title="No sessions" icon={<CalendarDays className="h-8 w-8" />} action={{ label: "Create Session", onClick: () => router.push("/academic/sessions/new") }} />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id} hover>
              <div className="flex items-center justify-between" onClick={(e) => { if ((e.target as HTMLElement).closest('button')) return; router.push(`/academic/sessions/${s.id}`); }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center"><CalendarDays className="h-6 w-6 text-accent" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-primary">{s.name}</p>
                      {s.isCurrent && <Badge variant="success" size="sm"><CheckCircle2 className="h-3 w-3 mr-0.5" />Current</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/academic/sessions/${s.id}/edit`); }}><Edit className="h-4 w-4" /></Button>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
