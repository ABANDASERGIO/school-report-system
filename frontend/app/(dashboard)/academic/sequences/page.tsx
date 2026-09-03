"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sequenceService } from "@/services/sequence.service";
import { termService } from "@/services/term.service";
import { sessionService } from "@/services/session.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Sequence, Term, AcademicSession } from "@/types";
import { Plus, Layers, ChevronRight, CheckCircle2, Clock } from "lucide-react";

export default function SequencesPage() {
  const router = useRouter();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
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
      termService.getTerms(selectedSession).then(setTerms);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedTerm) {
      setIsLoading(true);
      sequenceService.getSequences(selectedTerm).then(setSequences).finally(() => setIsLoading(false));
    } else {
      setSequences([]);
    }
  }, [selectedTerm]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-xl font-bold text-primary">Sequences</h1></div>
        <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />} onClick={() => router.push("/academic/sequences/new")}>New Sequence</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Academic Session" value={selectedSession} onChange={(e) => { setSelectedSession(e.target.value); setSelectedTerm(""); }} options={sessions.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select session" />
        <Select label="Term" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} options={terms.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select term" disabled={!selectedSession} />
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => (<Skeleton key={i} variant="card" />))}</div>
      ) : !selectedTerm ? (
        <EmptyState title="Select a term" description="Choose a session and term to view sequences." icon={<Layers className="h-8 w-8" />} />
      ) : sequences.length === 0 ? (
        <EmptyState title="No sequences" description="Create sequences for this term." icon={<Layers className="h-8 w-8" />} action={{ label: "Create Sequence", onClick: () => router.push("/academic/sequences/new") }} />
      ) : (
        <div className="space-y-3">
          {sequences.map((seq) => (
            <Card key={seq.id} hover>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center"><Layers className="h-6 w-6 text-accent" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-primary">{seq.name}</p>
                      {seq.isActive ? <Badge variant="success" size="sm"><CheckCircle2 className="h-3 w-3 mr-0.5" />Active</Badge> : <Badge variant="neutral" size="sm"><Clock className="h-3 w-3 mr-0.5" />Inactive</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(seq.startDate).toLocaleDateString()} - {new Date(seq.endDate).toLocaleDateString()}</p>
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
