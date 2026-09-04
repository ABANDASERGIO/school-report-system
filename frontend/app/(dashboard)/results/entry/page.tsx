"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resultService } from "@/services/result.service";
import { studentService } from "@/services/student.service";
import { subjectService } from "@/services/subject.service";
import { sequenceService } from "@/services/sequence.service";
import { termService } from "@/services/term.service";
import { sessionService } from "@/services/session.service";
import { classService } from "@/services/class.service";
import { enrollmentService } from "@/services/enrollment.service";
import { assignmentService } from "@/services/assignment.service";
import { teacherService } from "@/services/teacher.service";
import { subjectClassService } from "@/services/subject-class.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showToast } from "@/components/ui/Toast";
import { useAuth } from "@/providers/AuthProvider";
import { useAcademicYear } from "@/providers/AcademicYearProvider";
import { settingsService } from "@/services/settings.service";
import type { Student, Subject, Sequence, Term, AcademicSession, Class, Result, Assignment } from "@/types";
import { Save, Send, ClipboardPen, Users, BookOpen } from "lucide-react";

export default function ResultEntryPage() {
  const router = useRouter();
  const { user, isProprietor } = useAuth();
  const { activeSession } = useAcademicYear();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<Map<string, number | null>>(new Map());
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedSequence, setSelectedSequence] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [maxScore, setMaxScore] = useState(20);
  const [marksEntryOpen, setMarksEntryOpen] = useState(true);
  const [teacherAssignments, setTeacherAssignments] = useState<Assignment[]>([]);
  const [availableClassIds, setAvailableClassIds] = useState<string[] | null>(null);
  const [availableSubjectIds, setAvailableSubjectIds] = useState<string[] | null>(null);

  useEffect(() => {
    Promise.all([
      sessionService.getSessions(),
      classService.getClasses(),
      subjectService.getSubjects(),
      settingsService.getSetting("max_score"),
      settingsService.getSetting("marks_entry_open"),
    ]).then(([ses, cls, sub, setting, marksSetting]) => {
      setSessions(ses);
      setClasses(cls);
      setSubjects(sub);
      if (setting) setMaxScore(parseInt(setting.value, 10) || 20);
      if (marksSetting) setMarksEntryOpen(marksSetting.value === "true");
      const current = ses.find((s) => s.isCurrent);
      if (current) setSelectedSession(current.id);
    }).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    async function loadTeacherData() {
      if (isProprietor || !user) {
        setTeacherAssignments([]);
        setAvailableClassIds(null);
        return;
      }
      const teacher = await teacherService.getTeachers().then((teachers) => teachers.find((t) => t.userId === user.id));
      if (!teacher) {
        setTeacherAssignments([]);
        setAvailableClassIds(null);
        return;
      }
      const assignments = await assignmentService.getAssignmentsByTeacher(teacher.id);
      const currentAssignments = activeSession
        ? assignments.filter((a) => a.sessionId === activeSession.id)
        : assignments;
      setTeacherAssignments(currentAssignments);
      const classIds = [...new Set(currentAssignments.map((a) => a.classId))];
      setAvailableClassIds(classIds);
    }
    loadTeacherData();
  }, [isProprietor, user, activeSession]);

  useEffect(() => {
    if (selectedClass && availableClassIds && !isProprietor) {
      setSelectedSubject("");
      setAvailableSubjectIds(null);
    }
  }, [selectedClass, availableClassIds, isProprietor]);

  useEffect(() => {
    if (selectedClass && selectedSession) {
      enrollmentService.getActiveEnrollmentsByClass(selectedClass, selectedSession).then((enrollments) => {
        const studentIds = enrollments.map((e) => e.studentId);
        studentService.getStudents().then((all) => {
          setStudents(all.filter((s) => studentIds.includes(s.id)));
        });
      });
    }
  }, [selectedClass, selectedSession]);

  useEffect(() => {
    if (selectedSubject && selectedSequence) {
      resultService.getResultsBySubjectAndSequence(selectedSubject, selectedSequence).then((res) => {
        const map = new Map<string, number | null>();
        res.forEach((r) => map.set(r.studentId, r.score));
        setResults(map);
      });
    }
  }, [selectedSubject, selectedSequence]);

  const handleScoreChange = (studentId: string, score: string) => {
    const num = score === "" ? null : Math.min(maxScore, Math.max(0, parseFloat(score) || 0));
    setResults((prev) => new Map(prev).set(studentId, num));
  };

  const handleSaveDraft = async () => {
    if (!selectedSubject || !selectedSequence || !selectedClass) return;
    if (!activeSession || selectedSession !== activeSession.id) {
      showToast({ type: "error", title: "Please select the current active session" });
      return;
    }
    setIsSaving(true);
    try {
      const enrollments = await enrollmentService.getActiveEnrollmentsByClass(selectedClass, selectedSession);
      const enrollmentByStudent = new Map(enrollments.map((e) => [e.studentId, e]));
      const payload = students
        .filter((s) => enrollmentByStudent.has(s.id))
        .map((student) => ({
          studentId: student.id,
          subjectId: selectedSubject,
          sequenceId: selectedSequence,
          enrollmentId: enrollmentByStudent.get(student.id)!.id,
          sessionId: selectedSession,
          score: results.get(student.id) ?? 0,
          total: maxScore,
        }));
      const out = await resultService.bulkSaveDraft(payload);
      if (out.skipped > 0) {
        showToast({
          type: "warning",
          title: `Saved ${out.saved} draft(s)`,
          message: `${out.skipped} skipped (locked or no active enrollment)`,
        });
      } else {
        showToast({ type: "success", title: `Saved ${out.saved} draft(s)` });
      }
    } catch {
      showToast({ type: "error", title: "Failed to save draft" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSubject || !selectedSequence || !selectedClass) return;
    if (!activeSession || selectedSession !== activeSession.id) {
      showToast({ type: "error", title: "Please select the current active session" });
      return;
    }
    setIsSaving(true);
    try {
      const enrollments = await enrollmentService.getActiveEnrollmentsByClass(selectedClass, selectedSession);
      const enrollmentByStudent = new Map(enrollments.map((e) => [e.studentId, e]));
      const payload = {
        sequenceId: selectedSequence,
        results: students
          .filter((s) => enrollmentByStudent.has(s.id))
          .map((student) => ({
            studentId: student.id,
            subjectId: selectedSubject,
            sequenceId: selectedSequence,
            enrollmentId: enrollmentByStudent.get(student.id)!.id,
            sessionId: selectedSession,
            score: results.get(student.id) ?? 0,
            total: maxScore,
          })),
      };
      const out = await resultService.submitResults(payload);
      if (out.skipped > 0) {
        showToast({
          type: "warning",
          title: `Submitted ${out.submitted} result(s)`,
          message: `${out.skipped} skipped (locked or no active enrollment)`,
        });
      } else {
        showToast({ type: "success", title: `Submitted ${out.submitted} result(s)` });
      }
      router.push("/results");
    } catch {
      showToast({ type: "error", title: "Failed to submit" });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClasses = isProprietor
    ? classes
    : classes.filter((c) => availableClassIds?.includes(c.id));

  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    async function loadFilteredSubjects() {
      if (isProprietor) {
        if (selectedClass) {
          const classSubjectIds = await subjectClassService.getSubjectsForClass(selectedClass);
          setFilteredSubjects(subjects.filter((s) => classSubjectIds.includes(s.id)));
        } else {
          setFilteredSubjects(subjects);
        }
      } else {
        if (!selectedClass || availableClassIds === null) {
          setFilteredSubjects([]);
          return;
        }
        const classSubjectIds = await subjectClassService.getSubjectsForClass(selectedClass);
        const subjectsInClass = subjects.filter((s) => classSubjectIds.includes(s.id));
        const teacherSubjectIdsForClass = teacherAssignments
          .filter((a) => a.classId === selectedClass)
          .map((a) => a.subjectId);
        setFilteredSubjects(subjectsInClass.filter((s) => teacherSubjectIdsForClass.includes(s.id)));
      }
    }
    loadFilteredSubjects();
  }, [selectedClass, subjects, teacherAssignments, isProprietor, availableClassIds]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-primary">Enter Marks</h1>
        <p className="text-sm text-gray-500 mt-1">Select a class, subject, and sequence to enter marks.</p>
      </div>

      <Card>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select label="Session" value={selectedSession} onChange={(e) => { setSelectedSession(e.target.value); setSelectedClass(""); setSelectedSubject(""); }} options={sessions.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select session" />
            <Select label="Term" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} options={terms.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select term" disabled={!selectedSession} />
            <Select label="Sequence" value={selectedSequence} onChange={(e) => setSelectedSequence(e.target.value)} options={sequences.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select sequence" disabled={!selectedTerm} />
            <Select label="Class" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} options={filteredClasses.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select class" />
            <Select label="Subject" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} options={filteredSubjects.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select subject" disabled={filteredSubjects.length === 0} />
          </div>
        </CardContent>
      </Card>

      {selectedClass && selectedSubject && selectedSequence ? (
        <Card>
          <CardHeader
            title="Student Marks"
            description={`${students.length} students · Max score: ${maxScore}${!marksEntryOpen && !isProprietor ? " · Read-only mode" : ""}`}
            action={
              marksEntryOpen || isProprietor ? (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={handleSaveDraft} isLoading={isSaving}>Save Draft</Button>
                  <Button variant="primary" size="sm" leftIcon={<Send className="h-4 w-4" />} onClick={handleSubmit} isLoading={isSaving}>Submit</Button>
                </div>
              ) : (
                <Badge variant="warning" size="sm">Marks Entry Closed</Badge>
              )
            }
          />
          <CardContent>
            {students.length === 0 ? (
              <EmptyState title="No students" description="No students enrolled in this class." icon={<Users className="h-8 w-8" />} />
            ) : (
              <div className="space-y-3">
                {students.map((student) => {
                  const score = results.get(student.id);
                  const hasScore = score !== undefined && score !== null;
                  return (
                    <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                          <span className="text-accent font-semibold text-sm">{student.firstName[0]}{student.lastName[0]}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-primary truncate">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-gray-400">{student.studentNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          type="number"
                          min={0}
                          max={maxScore}
                          step={0.5}
                          value={hasScore ? score : ""}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          className="w-20 text-center"
                          placeholder={hasScore ? "" : `—`}
                          disabled={!marksEntryOpen && !isProprietor}
                        />
                        <span className="text-xs text-gray-400">/{maxScore}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <EmptyState title="Make selections" description="Select a session, term, sequence, class, and subject to start entering marks." icon={<ClipboardPen className="h-8 w-8" />} />
      )}
    </div>
  );
}
