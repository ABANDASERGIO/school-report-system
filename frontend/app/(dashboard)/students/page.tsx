"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { studentService } from "@/services/student.service";
import { classService } from "@/services/class.service";
import { useAcademicYear } from "@/providers/AcademicYearProvider";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { showToast } from "@/components/ui/Toast";
import { Select } from "@/components/ui/Select";
import type { Student, Class } from "@/types";
import { Gender } from "@/types/enums";
import { Plus, GraduationCap, Phone, ChevronRight, MapPin, Users, Pencil, Trash2 } from "lucide-react";
import { getInitials, getFullName, cn } from "@/lib/utils";

export default function StudentsPage() {
  const router = useRouter();
  const { activeSession } = useAcademicYear();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [classesData] = await Promise.all([
          classService.getClasses(),
        ]);
        setClasses(classesData);
        await loadStudents();
      } catch (error) {
        console.error("Failed to load students:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [activeSession, selectedClass]);

  const loadStudents = async () => {
    if (!activeSession) {
      setStudents([]);
      return;
    }
    setIsLoading(true);
    try {
      let data: Student[];
      if (selectedClass) {
        data = await studentService.getStudentsByClassAndSession(selectedClass, activeSession.id);
      } else {
        const { enrollmentService } = await import("@/services/enrollment.service");
        const enrollments = await enrollmentService.getActiveEnrollmentsByClass("", activeSession.id);
        // Get all active enrollments for this session
        const allEnrollments = await enrollmentService.getEnrollments(activeSession.id);
        const activeEnrollments = allEnrollments.filter((e) => e.status === "ACTIVE");
        const studentIds = [...new Set(activeEnrollments.map((e) => e.studentId))];
        const allStudents = await studentService.getStudents();
        data = allStudents.filter((s) => studentIds.includes(s.id));
      }
      setStudents(data);
    } catch (error) {
      console.error("Failed to load students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !activeSession) return;
    try {
      const { enrollmentService } = await import("@/services/enrollment.service");
      await enrollmentService.removeEnrollment(deleteTarget.id, activeSession.id);
      showToast({ type: "success", title: "Student removed", message: `Removed from ${activeSession.name}` });
      loadStudents();
    } catch {
      showToast({ type: "error", title: "Failed to remove student" });
    }
    setDeleteTarget(null);
  };

  const filteredStudents = search
    ? students.filter(
        (s) =>
          s.firstName.toLowerCase().includes(search.toLowerCase()) ||
          s.lastName.toLowerCase().includes(search.toLowerCase()) ||
          s.studentNumber.toLowerCase().includes(search.toLowerCase())
      )
    : students;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-primary">Students</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeSession ? `${students.length} students in ${activeSession.name}` : "Select an academic year"}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => router.push("/students/new")}
        >
          Register Student
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or student number..."
          className="flex-1"
        />
        {activeSession && (
          <Select
            label="Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={[
              { value: "", label: "All Classes" },
              ...classes.map((c) => ({ value: c.id, label: c.name })),
            ]}
            className="w-full sm:w-48"
          />
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="flex items-center gap-4">
                <Skeleton variant="circular" className="h-12 w-12" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title={search ? "No students found" : "No students registered"}
          description={
            search
              ? "Try a different search term."
              : activeSession
                ? "Register your first student for this academic year."
                : "Select an academic year to view students."
          }
          icon={<GraduationCap className="h-8 w-8" />}
          action={
            !search && activeSession
              ? {
                  label: "Register Student",
                  onClick: () => router.push("/students/new"),
                }
              : undefined
          }
        />
      ) : (
        /* Student Cards */
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              hover
              onClick={() => router.push(`/students/${student.id}`)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0",
                    student.gender === Gender.MALE
                      ? "bg-accent/80"
                      : "bg-pink-400/80"
                  )}
                >
                  {getInitials(student.firstName, student.lastName)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-primary truncate">
                      {getFullName(student.firstName, student.lastName)}
                    </h3>
                    <Badge variant="info" size="sm">
                      {student.studentNumber}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {student.address || "No address"}
                    </span>
                    {student.parentPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {student.parentPhone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/students/${student.id}/edit`); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-accent transition-colors"
                    title="Edit student"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(student); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-danger transition-colors"
                    title="Remove from academic year"
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
        title="Remove Student from Academic Year"
        message={`This will remove ${deleteTarget ? getFullName(deleteTarget.firstName, deleteTarget.lastName) : ""} from ${activeSession?.name}. Historical records from other Academic Years will not be affected.`}
        variant="warning"
        confirmLabel="Remove"
      />
    </div>
  );
}
