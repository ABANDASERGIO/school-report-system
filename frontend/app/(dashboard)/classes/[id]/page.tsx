"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { classService } from "@/services/class.service";
import { subjectService } from "@/services/subject.service";
import { subjectClassService } from "@/services/subject-class.service";
import { settingsService } from "@/services/settings.service";
import { useAcademicYear } from "@/providers/AcademicYearProvider";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { PageSpinner } from "@/components/ui/Spinner";
import { showToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { generateClassListPDF } from "@/lib/pdf-utils";
import type { Class, Subject, Student } from "@/types";
import { ArrowLeft, School, BookOpen, Users, Pencil, Plus, Trash2, FileDown } from "lucide-react";

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { activeSession } = useAcademicYear();
  const [cls, setCls] = useState<Class | null>(null);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [classSubjectIds, setClassSubjectIds] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", code: "", description: "" });
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => { loadData(); }, [params.id]);

  const loadData = async () => {
    try {
      const [clsData, subData, name, studentsList, subjectIds] = await Promise.all([
        classService.getClassById(params.id as string),
        subjectService.getSubjects(),
        settingsService.getSchoolName(),
        activeSession
          ? classService.getStudentsByClass(params.id as string, activeSession.id)
          : Promise.resolve([]),
        subjectClassService.getSubjectsForClass(params.id as string),
      ]);
      if (clsData) {
        setCls(clsData);
        setEditForm({ name: clsData.name, code: clsData.code, description: clsData.description });
      }
      setAllSubjects(subData);
      setSchoolName(name);
      setStudents(studentsList);
      setClassSubjectIds(subjectIds);
    } catch (error) {
      console.error("Failed to load class:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!cls) return;
    try {
      await classService.updateClass(cls.id, editForm);
      showToast({ type: "success", title: "Class updated" });
      setIsEditing(false);
      loadData();
    } catch {
      showToast({ type: "error", title: "Failed to update class" });
    }
  };

  const handleDownloadPDF = async () => {
    if (!cls || !activeSession) return;
    setDownloadingPDF(true);
    try {
      const success = generateClassListPDF({
        schoolName: schoolName || "EduGrade School",
        className: cls.name,
        academicYear: activeSession.name,
        students: students.map((s) => ({ firstName: s.firstName, lastName: s.lastName })),
      });
      if (!success) {
        showToast({ type: "error", title: "Please allow popups to download PDF" });
      }
    } catch {
      showToast({ type: "error", title: "Failed to generate PDF" });
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleAddSubject = async () => {
    if (!selectedSubject) return;
    if (classSubjectIds.includes(selectedSubject)) {
      showToast({ type: "error", title: "Subject already added" });
      return;
    }
    const newIds = [...classSubjectIds, selectedSubject];
    setClassSubjectIds(newIds);
    await subjectClassService.setSubjectClasses(params.id as string, newIds);
    showToast({ type: "success", title: "Subject added to class" });
    setSelectedSubject("");
    setShowAddModal(false);
  };

  const handleRemoveSubject = async () => {
    if (!deleteTarget) return;
    const newIds = classSubjectIds.filter((id) => id !== deleteTarget.id);
    setClassSubjectIds(newIds);
    await subjectClassService.setSubjectClasses(params.id as string, newIds);
    showToast({ type: "success", title: "Subject removed from class" });
    setDeleteTarget(null);
  };

  const subjects = allSubjects.filter((s) => classSubjectIds.includes(s.id));
  const availableSubjects = allSubjects.filter((s) => !classSubjectIds.includes(s.id));

  if (isLoading) return <PageSpinner />;
  if (!cls) return <div className="text-center py-12 text-gray-500">Class not found</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push("/classes")}>Back to Classes</Button>

      {/* Class Info */}
      <Card>
        <CardHeader
          title={cls.name}
          description={`Code: ${cls.code}${activeSession ? ` · ${activeSession.name}` : ""}`}
          action={
            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="secondary" size="sm" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setIsEditing(true)}>Edit</Button>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={() => { setIsEditing(false); setEditForm({ name: cls.name, code: cls.code, description: cls.description }); }}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={handleSaveEdit}>Save</Button>
                </>
              )}
            </div>
          }
        />
        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="Class name" />
              <input type="text" value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="Class code" />
              <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="Description" rows={2} />
            </div>
          ) : (
            <p className="text-sm text-gray-500">{cls.description || "No description"}</p>
          )}
        </CardContent>
      </Card>

      {/* Students */}
      <Card>
        <CardHeader
          title="Students"
          description={activeSession ? `${students.length} students in ${activeSession.name}` : "Select an academic year to view students"}
          action={
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FileDown className="h-4 w-4" />}
              onClick={handleDownloadPDF}
              disabled={!activeSession || students.length === 0 || downloadingPDF}
            >
              {downloadingPDF ? "Generating..." : "Download PDF"}
            </Button>
          }
        />
        <CardContent>
          {!activeSession ? (
            <p className="text-sm text-gray-400 text-center py-4">No academic year selected.</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No students enrolled in this class for the selected academic year.</p>
          ) : (
            <div className="space-y-2">
              {students.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <span className="text-accent font-semibold text-xs">{s.firstName[0]}{s.lastName[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-400">{s.studentNumber}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{i + 1}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subjects */}
      <Card>
        <CardHeader
          title="Subjects Offered"
          description={`${subjects.length} subject(s)`}
          action={
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddModal(true)}>
              Add Subject
            </Button>
          }
        />
        <CardContent>
          {subjects.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No subjects assigned to this class yet.</p>
          ) : (
            <div className="space-y-2">
              {subjects.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-primary">{s.name}</p>
                      <p className="text-xs text-gray-500">Coefficient: {s.coefficient} | Code: {s.code}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-danger transition-colors"
                    title="Remove subject"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Subject Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Subject to Class">
        <div className="space-y-4">
          <Select
            label="Select Subject"
            placeholder="Choose a subject"
            options={availableSubjects.map((s) => ({ value: s.id, label: `${s.name} (${s.code}) - Coef: ${s.coefficient}` }))}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddSubject} disabled={!selectedSubject}>Add Subject</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleRemoveSubject}
        title="Remove Subject"
        message={`Remove ${deleteTarget?.name} from ${cls.name}? The subject will not be deleted from the system.`}
        variant="warning"
        confirmLabel="Remove"
      />
    </div>
  );
}
