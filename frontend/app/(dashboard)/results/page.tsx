"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resultService } from "@/services/result.service";
import { assignmentService } from "@/services/assignment.service";
import { teacherService } from "@/services/teacher.service";
import { subjectService } from "@/services/subject.service";
import { sequenceService } from "@/services/sequence.service";
import { termService } from "@/services/term.service";
import { sessionService } from "@/services/session.service";
import { classService } from "@/services/class.service";
import { settingsService } from "@/services/settings.service";
import { useAuth } from "@/providers/AuthProvider";
import { useAcademicYear } from "@/providers/AcademicYearProvider";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showToast } from "@/components/ui/Toast";
import type { Result, Subject, Sequence, Term, AcademicSession, Class } from "@/types";
import { ClipboardList, Lock, Unlock, CheckCircle2, Clock, FileText } from "lucide-react";

export default function ResultsPage() {
  const router = useRouter();
  const { user, isProprietor } = useAuth();
  const { activeSession } = useAcademicYear();
  const [results, setResults] = useState<Result[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedSequence, setSelectedSequence] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [marksEntryOpen, setMarksEntryOpen] = useState(true);
  const [teacherSubjectIds, setTeacherSubjectIds] = useState<string[] | null>(null);

  useEffect(() => {
    Promise.all([
      sessionService.getSessions(),
      subjectService.getSubjects(),
      settingsService.getSetting("marks_entry_open"),
    ]).then(([ses, sub, setting]) => {
      setSessions(ses);
      setSubjects(sub);
      if (setting) setMarksEntryOpen(setting.value === "true");
      const current = ses.find((s) => s.isCurrent);
      if (current) {
        setSelectedSession(current.id);
        termService.getTerms(current.id).then(setTerms);
      }
    }).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    async function loadTeacherData() {
      if (isProprietor || !user) {
        setTeacherSubjectIds(null);
        return;
      }
      const teacher = await teacherService.getTeachers().then((teachers) => teachers.find((t) => t.userId === user.id));
      if (!teacher) {
        setTeacherSubjectIds(null);
        return;
      }
      const assignments = await assignmentService.getAssignmentsByTeacher(teacher.id);
      const currentAssignments = activeSession
        ? assignments.filter((a) => a.sessionId === activeSession.id)
        : assignments;
      const subjectIds = [...new Set(currentAssignments.map((a) => a.subjectId))];
      setTeacherSubjectIds(subjectIds);
    }
    loadTeacherData();
  }, [isProprietor, user, activeSession]);

  const handleSessionChange = (sessionId: string) => {
    setSelectedSession(sessionId);
    termService.getTerms(sessionId).then(setTerms);
    setSelectedTerm("");
    setSelectedSequence("");
  };

  const handleTermChange = (termId: string) => {
    setSelectedTerm(termId);
    if (termId) {
      sequenceService.getSequences(termId).then(setSequences);
    } else {
      setSequences([]);
    }
    setSelectedSequence("");
  };

  useEffect(() => {
    if (selectedTerm) {
      sequenceService.getSequences(selectedTerm).then(setSequences);
      setSelectedSequence("");
    }
  }, [selectedTerm]);

  useEffect(() => {
    if (selectedSequence && selectedSubject) {
      resultService.getResultsBySubjectAndSequence(selectedSubject, selectedSequence).then((res) => {
        let filtered = res;
        if (!isProprietor && teacherSubjectIds) {
          filtered = res.filter((r) => teacherSubjectIds.includes(r.subjectId));
        }
        setResults(filtered);
      });
    } else if (selectedSequence) {
      resultService.getResults(selectedSequence).then((res) => {
        let filtered = res;
        if (!isProprietor && teacherSubjectIds) {
          filtered = res.filter((r) => teacherSubjectIds.includes(r.subjectId));
        }
        setResults(filtered);
      });
    } else {
      setResults([]);
    }
  }, [selectedSequence, selectedSubject, isProprietor, teacherSubjectIds]);

  const handleLock = async () => {
    if (!selectedSequence) return;
    try {
      await resultService.lockResults(selectedSequence);
      showToast({ type: "success", title: "Results locked" });
    } catch {
      showToast({ type: "error", title: "Failed to lock" });
    }
  };

  const handleUnlock = async () => {
    if (!selectedSequence) return;
    try {
      await resultService.unlockResults(selectedSequence);
      showToast({ type: "success", title: "Results unlocked" });
    } catch {
      showToast({ type: "error", title: "Failed to unlock" });
    }
  };

  const getStudentName = (studentId: string) => {
    const names: Record<string, string> = {
      "stu-001": "Alice Nkwi", "stu-002": "Bob Efande", "stu-003": "Clara Mbah",
      "stu-004": "David Taku", "stu-005": "Esther Ngoe", "stu-006": "Francis Lyonga",
      "stu-007": "Grace Asobo", "stu-008": "Henry Mokube",
    };
    return names[studentId] || studentId;
  };

  const getSubjectName = (id: string) => {
    const s = subjects.find((s) => s.id === id);
    return s?.name || "Unknown";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-xl font-bold text-primary">Results</h1><p className="text-sm text-gray-500 mt-1">{results.length} result(s)</p></div>
        <div className="flex gap-2">
          {isProprietor && (
            <>
              <Button variant="secondary" size="sm" leftIcon={<Lock className="h-4 w-4" />} onClick={handleLock} disabled={!selectedSequence}>Lock Results</Button>
              <Button variant="secondary" size="sm" leftIcon={<Unlock className="h-4 w-4" />} onClick={handleUnlock} disabled={!selectedSequence}>Unlock</Button>
            </>
          )}
          {marksEntryOpen && <Button variant="primary" size="sm" leftIcon={<FileText className="h-4 w-4" />} onClick={() => router.push("/results/entry")}>Enter Marks</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <Select label="Academic Session" value={selectedSession} onChange={(e) => handleSessionChange(e.target.value)} options={sessions.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select session" />
        <Select label="Term" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} options={terms.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select term" disabled={!selectedSession} />
        <Select label="Sequence" value={selectedSequence} onChange={(e) => setSelectedSequence(e.target.value)} options={sequences.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select sequence" disabled={!selectedTerm} />
        <Select label="Subject" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} options={isProprietor ? subjects.map((s) => ({ value: s.id, label: s.name })) : subjects.filter((s) => teacherSubjectIds?.includes(s.id)).map((s) => ({ value: s.id, label: s.name }))} placeholder="Select subject" disabled={!selectedSequence} />
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} variant="card" />))}</div>
      ) : results.length === 0 ? (
        <EmptyState title="No results" description="Select a sequence to view results or enter marks." icon={<ClipboardList className="h-8 w-8" />} action={{ label: "Enter Marks", onClick: () => router.push("/results/entry") }} />
      ) : (
        <div className="space-y-3">
          {results.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-accent font-semibold text-sm">{getStudentName(r.studentId).split(" ").map((n) => n[0]).join("")}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary">{getStudentName(r.studentId)}</p>
                    <p className="text-xs text-gray-500">{getSubjectName(r.subjectId)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-primary">{r.score !== null ? r.score.toFixed(1) : "-"}<span className="text-sm font-normal text-gray-400">/{r.total}</span></span>
                  <Badge variant={r.status === "SUBMITTED" ? "success" : r.status === "DRAFT" ? "warning" : "info"} size="sm">
                    {r.status === "SUBMITTED" ? <CheckCircle2 className="h-3 w-3 mr-0.5" /> : r.status === "DRAFT" ? <Clock className="h-3 w-3 mr-0.5" /> : null}
                    {r.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
