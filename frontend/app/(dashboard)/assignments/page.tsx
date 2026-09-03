"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { assignmentService } from "@/services/assignment.service";
import { teacherService } from "@/services/teacher.service";
import { classService } from "@/services/class.service";
import { subjectService } from "@/services/subject.service";
import { subjectClassService } from "@/services/subject-class.service";
import { sessionService } from "@/services/session.service";
import { useAcademicYear } from "@/providers/AcademicYearProvider";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Teacher, Class, Subject, AcademicSession, Assignment } from "@/types";
import { Plus, UserCheck, X, BookOpen, School, Pencil, Filter } from "lucide-react";

export default function AssignmentsPage() {
  const router = useRouter();
  const { activeSession } = useAcademicYear();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Assignment | null>(null);
  const [editTarget, setEditTarget] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({ teacherId: "", classId: "", subjectId: "", sessionId: "" });
  const [editFormData, setEditFormData] = useState({ teacherId: "", classId: "", subjectId: "", sessionId: "" });
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      teacherService.getTeachers(),
      classService.getClasses(),
      subjectService.getSubjects(),
      sessionService.getSessions(),
    ]).then(([t, c, s, ses]) => {
      setTeachers(t.filter((t) => t.isActive));
      setClasses(c);
      setSubjects(s);
      setSessions(ses);
      const current = ses.find((s) => s.isCurrent);
      if (current) {
        setFormData((prev) => ({ ...prev, sessionId: current.id }));
      }
    });
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [activeSession]);

  const loadAssignments = async () => {
    setIsLoading(true);
    try {
      let data: Assignment[];
      if (activeSession) {
        data = await assignmentService.getAssignmentsBySession(activeSession.id);
      } else {
        data = await assignmentService.getAssignments();
      }
      setAssignments(data);
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (formData.classId) {
      subjectService.getSubjects().then(async (allSubjects) => {
        const classSubjectIds = await subjectClassService.getSubjectsForClass(formData.classId);
        const filtered = allSubjects.filter((s) => classSubjectIds.includes(s.id));
        setAvailableSubjects(filtered);
        if (filtered.length > 0 && !filtered.find((s) => s.id === formData.subjectId)) {
          setFormData((prev) => ({ ...prev, subjectId: "" }));
        }
      });
    } else {
      setAvailableSubjects([]);
      setFormData((prev) => ({ ...prev, subjectId: "" }));
    }
  }, [formData.classId]);

  useEffect(() => {
    if (editTarget?.classId) {
      subjectService.getSubjects().then(async (allSubjects) => {
        const classSubjectIds = await subjectClassService.getSubjectsForClass(editTarget.classId);
        const filtered = allSubjects.filter((s) => classSubjectIds.includes(s.id));
        setAvailableSubjects(filtered);
      });
    }
  }, [editTarget?.classId]);

  const handleAdd = async () => {
    if (!formData.teacherId || !formData.classId || !formData.subjectId || !formData.sessionId) {
      showToast({ type: "error", title: "Please fill all fields" });
      return;
    }
    setIsSaving(true);
    try {
      await assignmentService.createAssignment(formData as any);
      showToast({ type: "success", title: "Assignment created" });
      setShowAdd(false);
      setFormData({ teacherId: "", classId: "", subjectId: "", sessionId: formData.sessionId });
      setAvailableSubjects([]);
      loadAssignments();
    } catch (err: any) {
      showToast({ type: "error", title: err.message || "Failed to create assignment" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editFormData.teacherId || !editFormData.classId || !editFormData.subjectId || !editFormData.sessionId) {
      showToast({ type: "error", title: "Please fill all fields" });
      return;
    }
    setIsSaving(true);
    try {
      await assignmentService.updateAssignment(editTarget.id, editFormData as any);
      showToast({ type: "success", title: "Assignment updated" });
      setEditTarget(null);
      loadAssignments();
    } catch (err: any) {
      showToast({ type: "error", title: err.message || "Failed to update assignment" });
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (assignment: Assignment) => {
    setEditTarget(assignment);
    setEditFormData({
      teacherId: assignment.teacherId,
      classId: assignment.classId,
      subjectId: assignment.subjectId,
      sessionId: assignment.sessionId,
    });
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await assignmentService.removeAssignment(removeTarget.id);
      showToast({ type: "success", title: "Assignment removed" });
      setAssignments((prev) => prev.filter((a) => a.id !== removeTarget.id));
    } catch {
      showToast({ type: "error", title: "Failed to remove" });
    }
    setRemoveTarget(null);
  };

  const getTeacherName = (id: string) => {
    const t = teachers.find((t) => t.id === id);
    return t ? `${t.firstName} ${t.lastName}` : "Unknown";
  };

  const getClassName = (id: string) => {
    const c = classes.find((c) => c.id === id);
    return c ? c.name : "Unknown";
  };

  const getSubjectName = (id: string) => {
    const s = subjects.find((s) => s.id === id);
    return s ? s.name : "Unknown";
  };

  const getSessionName = (id: string) => {
    const s = sessions.find((s) => s.id === id);
    return s?.name || id;
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filterTeacher && a.teacherId !== filterTeacher) return false;
    if (filterClass && a.classId !== filterClass) return false;
    if (filterSubject && a.subjectId !== filterSubject) return false;
    return true;
  });

  const displaySession = activeSession || sessions.find((s) => s.isCurrent);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-primary">Teacher Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">
            {displaySession ? `${displaySession.name}` : ""} · {assignments.length} assignment(s)
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(!showAdd)}>New Assignment</Button>
      </div>

      {showAdd && (
        <Card className="border-accent/30">
          <CardHeader title="Create Assignment" description="Assign a teacher to teach a subject in a class." />
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Select label="Academic Year" value={formData.sessionId} onChange={(e) => setFormData({ ...formData, sessionId: e.target.value, teacherId: "", classId: "", subjectId: "" })} options={sessions.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select year" />
              <Select label="Teacher" value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })} options={teachers.map((t) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))} placeholder="Select teacher" disabled={!formData.sessionId} />
              <Select label="Class" value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value, subjectId: "" })} options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select class" disabled={!formData.sessionId} />
              <Select label="Subject" value={formData.subjectId} onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })} options={availableSubjects.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select subject" disabled={!formData.classId} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => { setShowAdd(false); setAvailableSubjects([]); }}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleAdd} leftIcon={<Plus className="h-4 w-4" />} isLoading={isSaving}>Create</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {editTarget && (
        <Card className="border-accent/30">
          <CardHeader title="Edit Assignment" description="Update teacher, class, or subject." />
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Select label="Academic Year" value={editFormData.sessionId} onChange={(e) => setEditFormData({ ...editFormData, sessionId: e.target.value, classId: "", subjectId: "" })} options={sessions.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select year" />
              <Select label="Teacher" value={editFormData.teacherId} onChange={(e) => setEditFormData({ ...editFormData, teacherId: e.target.value })} options={teachers.map((t) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))} placeholder="Select teacher" disabled={!editFormData.sessionId} />
              <Select label="Class" value={editFormData.classId} onChange={(e) => setEditFormData({ ...editFormData, classId: e.target.value, subjectId: "" })} options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select class" disabled={!editFormData.sessionId} />
              <Select label="Subject" value={editFormData.subjectId} onChange={(e) => setEditFormData({ ...editFormData, subjectId: e.target.value })} options={availableSubjects.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select subject" disabled={!editFormData.classId} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => { setEditTarget(null); setAvailableSubjects([]); }}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleEdit} leftIcon={<Pencil className="h-4 w-4" />} isLoading={isSaving}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} variant="card" />))}</div>
      ) : filteredAssignments.length === 0 ? (
        <EmptyState title="No assignments" description={showAdd ? "Fill the form above to create an assignment." : "Assign teachers to classes and subjects."} icon={<UserCheck className="h-8 w-8" />} action={!showAdd ? { label: "Create Assignment", onClick: () => setShowAdd(true) } : undefined} />
      ) : (
        <>
          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-primary">Filters</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select label="Teacher" value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)} options={[{ value: "", label: "All Teachers" }, ...teachers.map((t) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))]} />
                <Select label="Class" value={filterClass} onChange={(e) => setFilterClass(e.target.value)} options={[{ value: "", label: "All Classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} />
                <Select label="Subject" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} options={[{ value: "", label: "All Subjects" }, ...subjects.map((s) => ({ value: s.id, label: s.name }))]} />
              </div>
            </CardContent>
          </Card>
          <div className="space-y-3">
            {filteredAssignments.map((a) => (
              <Card key={a.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center"><UserCheck className="h-6 w-6 text-accent" /></div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{getTeacherName(a.teacherId)}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1"><School className="h-3 w-3" />{getClassName(a.classId)}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1"><BookOpen className="h-3 w-3" />{getSubjectName(a.subjectId)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="info" size="sm">{getSessionName(a.sessionId)}</Badge>
                    <button onClick={() => startEdit(a)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-accent" title="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setRemoveTarget(a)} className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-danger" title="Remove"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} onConfirm={handleRemove}
        title="Remove Assignment"
        message={`Remove ${getTeacherName(removeTarget?.teacherId || "")} from ${removeTarget ? getClassName(removeTarget.classId) : ""} - ${removeTarget ? getSubjectName(removeTarget.subjectId) : ""}?`}
        variant="danger"
        confirmLabel="Remove"
      />
    </div>
  );
}
