"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { subjectService } from "@/services/subject.service";
import { classService } from "@/services/class.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { showToast } from "@/components/ui/Toast";
import type { Subject, Class } from "@/types";
import { Plus, BookOpen, ChevronRight, BookCopy, Pencil, Trash2, School } from "lucide-react";

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subjectsData, classesData] = await Promise.all([
        subjectService.getSubjects(),
        classService.getClasses(),
      ]);
      setSubjects(subjectsData);
      setClasses(classesData);

      const counts: Record<string, number> = {};
      await Promise.all(
        subjectsData.map(async (s) => {
          const classIds = await subjectService.getClassIdsForSubject(s.id);
          counts[s.id] = classIds.length;
        })
      );
      setClassCounts(counts);
    } catch (error) {
      console.error("Failed to load subjects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await subjectService.deleteSubject(deleteTarget.id);
      showToast({ type: "success", title: "Subject deleted" });
      loadData();
    } catch {
      showToast({ type: "error", title: "Failed to delete subject" });
    }
    setDeleteTarget(null);
  };

  const filtered = search ? subjects.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())) : subjects;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-xl font-bold text-primary">Subjects</h1><p className="text-sm text-gray-500 mt-1">{subjects.length} subjects</p></div>
        <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />} onClick={() => router.push("/subjects/new")}>Add Subject</Button>
      </div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search subjects..." />
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} variant="card" />))}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No subjects found" icon={<BookOpen className="h-8 w-8" />} action={!search ? { label: "Add Subject", onClick: () => router.push("/subjects/new") } : undefined} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Card key={s.id} hover onClick={() => router.push(`/subjects/${s.id}`)}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><BookCopy className="h-6 w-6 text-accent" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-primary">{s.name}</h3>
                  <Badge variant="neutral" size="sm" className="mt-1">{s.code}</Badge>
                  <p className="text-xs text-gray-500 mt-1">Coefficient: {s.coefficient}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <School className="h-3 w-3" />
                    {classCounts[s.id] ?? 0} classes
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/subjects/${s.id}/edit`); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-accent transition-colors"
                    title="Edit subject"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-danger transition-colors"
                    title="Delete subject"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-gray-300 ml-1" />
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
        title="Delete Subject"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
