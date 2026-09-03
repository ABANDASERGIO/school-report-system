"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { teacherService, uploadTeacherPhoto, deleteTeacherPhoto } from "@/services/teacher.service";
import { assignmentService } from "@/services/assignment.service";
import { classService } from "@/services/class.service";
import { subjectService } from "@/services/subject.service";
import { sessionService } from "@/services/session.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { showToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Teacher, Assignment, Class as ClassType, Subject } from "@/types";
import { ArrowLeft, Phone, Mail, UserCheck, UserX, RefreshCw, School, ChevronRight, Upload, X, Save, MapPin } from "lucide-react";
import { useAcademicYear } from "@/providers/AcademicYearProvider";

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classesMap, setClassesMap] = useState<Record<string, ClassType>>({});
  const [subjectsMap, setSubjectsMap] = useState<Record<string, Subject>>({});
  const [sessionsMap, setSessionsMap] = useState<Record<string, { id: string; name: string }>>({});
  const { activeSession } = useAcademicYear();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Teacher>>({});

  useEffect(() => { loadData(); }, [params.id]);

  const loadData = async () => {
    try {
      const [teacherData, assignmentData, clsData, subData, sessionsData] = await Promise.all([
        teacherService.getTeacherById(params.id as string),
        assignmentService.getAssignmentsByTeacher(params.id as string),
        classService.getClasses(),
        subjectService.getSubjects(),
        sessionService.getSessions(),
      ]);
      if (teacherData) {
        setTeacher(teacherData);
        setPhotoPreview(teacherData.photoUrl || "");
        setFormData(teacherData);
      }
      const currentAssignments = activeSession
        ? assignmentData.filter((a) => a.sessionId === activeSession.id)
        : assignmentData;
      setAssignments(currentAssignments);
      setClassesMap(Object.fromEntries(clsData.map((c) => [c.id, c])));
      setSubjectsMap(Object.fromEntries(subData.map((s) => [s.id, s])));
      setSessionsMap(Object.fromEntries(sessionsData.map((s) => [s.id, s])));
    } catch (error) {
      console.error("Failed to load teacher:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!teacher) return;
    setIsSaving(true);
    try {
      await teacherService.updateTeacher(teacher.id, formData);
      showToast({ type: "success", title: "Teacher updated successfully" });
      setIsEditing(false);
      loadData();
    } catch {
      showToast({ type: "error", title: "Failed to update teacher" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !teacher) return;
    if (!file.type.startsWith("image/")) {
      showToast({ type: "error", title: "Invalid file", message: "Please select an image file." });
      return;
    }
    try {
      const result = await uploadTeacherPhoto(file, teacher.id);
      setPhotoPreview(result.url);
      await teacherService.updateTeacher(teacher.id, { photoUrl: result.url, photoPublicId: result.publicId });
      showToast({ type: "success", title: "Photo updated" });
      loadData();
    } catch (err: any) {
      showToast({ type: "error", title: "Failed to update photo", message: err.message });
    }
  };

  const clearPhoto = async () => {
    if (!teacher) return;
    const publicId = teacher.photoPublicId;
    setPhotoPreview("");
    try {
      if (publicId) {
        await deleteTeacherPhoto(publicId);
      }
      await teacherService.updateTeacher(teacher.id, { photoUrl: "", photoPublicId: "" });
      showToast({ type: "success", title: "Photo removed" });
      loadData();
    } catch (err: any) {
      showToast({ type: "error", title: "Failed to remove photo", message: err.message });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSuspendToggle = async () => {
    if (!teacher) return;
    try {
      if (teacher.isActive) {
        await teacherService.suspendTeacher(teacher.id);
        showToast({ type: "success", title: "Teacher suspended" });
      } else {
        await teacherService.activateTeacher(teacher.id);
        showToast({ type: "success", title: "Teacher activated" });
      }
      loadData();
    } catch {
      showToast({ type: "error", title: "Action failed" });
    }
  };

  const handleResetPassword = async () => {
    if (!teacher) return;
    try {
      const result = await teacherService.resetPassword(teacher.id);
      const newPassword = result?.newPassword || Math.random().toString(36).slice(-8);
      showToast({ type: "success", title: "Password reset", message: `New password: ${newPassword}` });
      setShowResetPassword(false);
    } catch {
      showToast({ type: "error", title: "Failed to reset password" });
    }
  };

  const handleDelete = async () => {
    if (!teacher) return;
    try {
      await teacherService.deleteTeacher(teacher.id);
      showToast({ type: "success", title: "Teacher deleted" });
      router.push("/teachers");
    } catch {
      showToast({ type: "error", title: "Failed to delete teacher" });
    } finally {
      setShowDelete(false);
    }
  };

  if (isLoading) return <PageSpinner />;
  if (!teacher) return <div className="text-center py-12 text-gray-500">Teacher not found</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push("/teachers")}>
        Back to Teachers
      </Button>

      <Card>
        <CardHeader
          title={`${teacher.firstName} ${teacher.lastName}`}
          description={teacher.address || undefined}
          action={
            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={() => { setIsEditing(false); setFormData(teacher); setPhotoPreview(teacher.photoUrl || ""); }}>Cancel</Button>
                  <Button variant="primary" size="sm" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />} onClick={handleSave}>Save</Button>
                </>
              )}
            </div>
          }
        />
        <CardContent>
          <div className="space-y-4">
            {isEditing && (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="h-6 w-6 text-gray-300" />
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} leftIcon={<Upload className="h-4 w-4" />}>
                    {photoPreview ? "Change Photo" : "Upload Photo"}
                  </Button>
                  {photoPreview && (
                    <button type="button" onClick={clearPhoto} className="text-xs text-danger hover:underline ml-2">Remove</button>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Teacher profile picture</p>
                </div>
              </div>
            )}
            {!isEditing && teacher.photoUrl && (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                  <img src={teacher.photoUrl} alt="Teacher" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-gray-500">Teacher Photo</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isEditing ? (
                <>
                  <Input label="First Name" value={formData.firstName || ""} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                  <Input label="Last Name" value={formData.lastName || ""} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                  <Input label="Email Address" type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  <Input label="Phone Number" type="tel" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  <div className="sm:col-span-2">
                    <Input label="Address" value={formData.address || ""} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <InfoField icon={<Mail className="h-4 w-4" />} label="Email" value={teacher.email} />
                  <InfoField icon={<Phone className="h-4 w-4" />} label="Phone" value={teacher.phone || "-"} />
                  <InfoField icon={<MapPin className="h-4 w-4" />} label="Address" value={teacher.address || "-"} />
                  <InfoField icon={teacher.isActive ? <UserCheck className="h-4 w-4 text-success" /> : <UserX className="h-4 w-4 text-danger" />} label="Status" value={teacher.isActive ? "Active" : "Suspended"} />
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader title="Actions" />
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={handleSuspendToggle}>
              {teacher.isActive ? "Suspend Teacher" : "Activate Teacher"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowResetPassword(true)}>
              Reset Password
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
              Delete Teacher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assignments */}
      <Card>
        <CardHeader title="My Classes & Subjects" description={`${assignments.length} assignment(s) in ${activeSession?.name || "current session"}`} />
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No assignments for the current academic year.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-primary">{classesMap[a.classId]?.name || a.classId}</p>
                    <p className="text-xs text-gray-500">{subjectsMap[a.subjectId]?.name || a.subjectId}</p>
                  </div>
                  <Badge variant="info" size="sm">{sessionsMap[a.sessionId]?.name || a.sessionId}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showResetPassword}
        onClose={() => setShowResetPassword(false)}
        onConfirm={handleResetPassword}
        title="Reset Password"
        message={`Send a password reset link to ${teacher.email}?`}
        variant="warning"
        confirmLabel="Reset"
      />

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Teacher"
        message={`Are you sure you want to delete ${teacher.firstName} ${teacher.lastName}? Their account will be suspended. Historical academic records will be preserved.`}
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
      <div className="text-gray-400">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-primary">{value}</p>
      </div>
    </div>
  );
}
