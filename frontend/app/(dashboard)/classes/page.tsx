"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { classService } from "@/services/class.service";
import { subjectService } from "@/services/subject.service";
import { settingsService } from "@/services/settings.service";
import { useAcademicYear } from "@/providers/AcademicYearProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { showToast } from "@/components/ui/Toast";
import { generateClassListPDF } from "@/lib/pdf-utils";
import type { Class, Subject } from "@/types";
import { Plus, School, Pencil, Trash2, Users, BookOpen, FileDown } from "lucide-react";

export default function ClassesPage() {
  const router = useRouter();
  const { activeSession } = useAcademicYear();
  const [classes, setClasses] = useState<Class[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({});
  const [schoolName, setSchoolName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Class | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [classesData, name] = await Promise.all([
          classService.getClasses(),
          settingsService.getSchoolName(),
        ]);
        setClasses(classesData);
        setSchoolName(name);

        const [studentCountMap, subjectCountMap] = await Promise.all([
          loadStudentCounts(classesData),
          loadSubjectCounts(classesData),
        ]);
        setStudentCounts(studentCountMap);
        setSubjectCounts(subjectCountMap);
      } catch (error) {
        console.error("Failed to load classes:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const loadStudentCounts = async (classesList: Class[]): Promise<Record<string, number>> => {
    if (!activeSession) return {};
    const counts = await Promise.all(
      classesList.map((cls) => classService.getStudentCountByClass(cls.id, activeSession!.id))
    );
    const map: Record<string, number> = {};
    classesList.forEach((cls, i) => {
      map[cls.id] = counts[i];
    });
    return map;
  };

  const loadSubjectCounts = async (classesList: Class[]): Promise<Record<string, number>> => {
    const counts = await Promise.all(
      classesList.map((cls) => subjectService.getSubjectsByClass(cls.id))
    );
    const map: Record<string, number> = {};
    classesList.forEach((cls, i) => {
      map[cls.id] = counts[i].length;
    });
    return map;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await classService.deleteClass(deleteTarget.id);
      showToast({ type: "success", title: "Class deleted" });
      setClasses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setStudentCounts((prev) => { const next = { ...prev }; delete next[deleteTarget.id]; return next; });
      setSubjectCounts((prev) => { const next = { ...prev }; delete next[deleteTarget.id]; return next; });
    } catch {
      showToast({ type: "error", title: "Failed to delete class" });
    }
    setDeleteTarget(null);
  };

  const handleDownloadPDF = async (cls: Class) => {
    if (!activeSession) {
      showToast({ type: "error", title: "No active academic year selected" });
      return;
    }
    setDownloadingId(cls.id);
    try {
      const [studentsList] = await Promise.all([
        classService.getStudentsByClass(cls.id, activeSession.id),
      ]);
      const success = generateClassListPDF({
        schoolName: schoolName || "EduGrade School",
        className: cls.name,
        academicYear: activeSession.name,
        students: studentsList.map((s) => ({ firstName: s.firstName, lastName: s.lastName })),
      });
      if (!success) {
        showToast({ type: "error", title: "Please allow popups to download PDF" });
      }
    } catch {
      showToast({ type: "error", title: "Failed to generate PDF" });
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = search
    ? classes.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
    : classes;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-primary">Classes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeSession ? `${classes.length} classes · ${activeSession.name}` : `${classes.length} classes`}
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />} onClick={() => router.push("/classes/new")}>Add Class</Button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search classes..." />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} variant="card" />))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No classes found"
          description={search ? "Try a different search term." : "Add your first class."}
          icon={<School className="h-8 w-8" />}
          action={!search ? { label: "Add Class", onClick: () => router.push("/classes/new") } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cls) => (
            <Card key={cls.id} hover onClick={() => router.push(`/classes/${cls.id}`)}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <School className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-primary">{cls.name}</h3>
                  <Badge variant="neutral" size="sm" className="mt-1">{cls.code}</Badge>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cls.description || "No description"}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {studentCounts[cls.id] ?? "-"}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {subjectCounts[cls.id] ?? "-"} subjects
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownloadPDF(cls); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-accent transition-colors"
                    title="Download class list PDF"
                    disabled={downloadingId === cls.id}
                  >
                    <FileDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/classes/${cls.id}/edit`); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-accent transition-colors"
                    title="Edit class"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(cls); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-danger transition-colors"
                    title="Delete class"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Class"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
