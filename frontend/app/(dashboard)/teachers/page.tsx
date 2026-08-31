"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { teacherService } from "@/services/teacher.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { showToast } from "@/components/ui/Toast";
import type { Teacher } from "@/types";
import { Plus, Users, Phone, Mail, BookOpen, ChevronRight, UserCheck, UserX, MoreVertical } from "lucide-react";

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<Teacher | null>(null);

  useEffect(() => { loadTeachers(); }, []);

  const loadTeachers = async () => {
    setIsLoading(true);
    try {
      const data = await teacherService.getTeachers();
      setTeachers(data);
    } catch (error) {
      console.error("Failed to load teachers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    try {
      if (suspendTarget.isActive) {
        await teacherService.suspendTeacher(suspendTarget.id);
        showToast({ type: "success", title: "Teacher suspended" });
      } else {
        await teacherService.activateTeacher(suspendTarget.id);
        showToast({ type: "success", title: "Teacher activated" });
      }
      loadTeachers();
    } catch {
      showToast({ type: "error", title: "Operation failed" });
    } finally {
      setSuspendTarget(null);
    }
  };

  const filteredTeachers = search
    ? teachers.filter((t) =>
        `${t.firstName} ${t.lastName} ${t.email} ${t.specialization}`.toLowerCase().includes(search.toLowerCase())
      )
    : teachers;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-primary">Teachers</h1>
          <p className="text-sm text-gray-500 mt-1">{teachers.length} total ({teachers.filter((t) => t.isActive).length} active)</p>
        </div>
        <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />} onClick={() => router.push("/teachers/new")}>
          Add Teacher
        </Button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search teachers..." />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><div className="flex items-center gap-4"><Skeleton variant="circular" className="h-12 w-12" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/4" /></div></div></Card>
          ))}
        </div>
      ) : filteredTeachers.length === 0 ? (
        <EmptyState title="No teachers found" description={search ? "Try a different search term." : "Add your first teacher to get started."} icon={<Users className="h-8 w-8" />} action={!search ? { label: "Add Teacher", onClick: () => router.push("/teachers/new") } : undefined} />
      ) : (
        <div className="space-y-3">
          {filteredTeachers.map((teacher) => (
            <Card key={teacher.id} hover onClick={() => router.push(`/teachers/${teacher.id}`)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-accent font-bold text-lg">
                    {teacher.firstName[0]}{teacher.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-primary truncate">{teacher.firstName} {teacher.lastName}</p>
                    <Badge variant={teacher.isActive ? "success" : "danger"} size="sm">{teacher.isActive ? "Active" : "Suspended"}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{teacher.specialization}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Mail className="h-3 w-3" />{teacher.email}</span>
                    {teacher.phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="h-3 w-3" />{teacher.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSuspendTarget(teacher); }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-danger"
                    title={teacher.isActive ? "Suspend" : "Activate"}
                  >
                    {teacher.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </button>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={handleSuspend}
        title={suspendTarget?.isActive ? "Suspend Teacher" : "Activate Teacher"}
        message={suspendTarget?.isActive ? `Are you sure you want to suspend ${suspendTarget?.firstName} ${suspendTarget?.lastName}? They will not be able to log in.` : `Activate ${suspendTarget?.firstName} ${suspendTarget?.lastName}?`}
        variant={suspendTarget?.isActive ? "danger" : "warning"}
        confirmLabel={suspendTarget?.isActive ? "Suspend" : "Activate"}
      />
    </div>
  );
}
