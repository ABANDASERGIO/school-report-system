"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { studentService, uploadStudentPhoto, deleteStudentPhoto } from "@/services/student.service";
import { classService } from "@/services/class.service";
import { enrollmentService } from "@/services/enrollment.service";
import { sessionService } from "@/services/session.service";
import { useAcademicYear } from "@/providers/AcademicYearProvider";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PageSpinner } from "@/components/ui/Spinner";
import { showToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Student, Class, Enrollment, AcademicSession } from "@/types";
import { Gender } from "@/types/enums";
import { ArrowLeft, Save, GraduationCap, Phone, Mail, MapPin, Calendar, User, Upload, X, Pencil, Trash2 } from "lucide-react";

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { activeSession } = useAcademicYear();
  const [student, setStudent] = useState<Student | null>(null);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [allSessions, setAllSessions] = useState<AcademicSession[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    placeOfBirth: "",
    gender: "",
    address: "",
    phone: "",
    parentName: "",
    parentPhone: "",
    photoUrl: "",
    photoPublicId: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState("");
  const [isChangingClass, setIsChangingClass] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AcademicSession | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const [studentData, classesData, sessionsData, enrollmentsData] = await Promise.all([
        studentService.getStudentById(params.id as string),
        classService.getClasses(),
        sessionService.getSessions(),
        enrollmentService.getEnrollmentsByStudent(params.id as string),
      ]);
      if (studentData) {
        setStudent(studentData);
        setFormData({
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          dateOfBirth: studentData.dateOfBirth,
          placeOfBirth: (studentData as any).placeOfBirth || "",
          gender: studentData.gender,
          address: studentData.address,
          phone: studentData.phone,
          parentName: studentData.parentName,
          parentPhone: studentData.parentPhone,
          photoUrl: studentData.photoUrl || "",
          photoPublicId: studentData.photoPublicId || "",
        });
        setPhotoPreview(studentData.photoUrl || "");
      }
      setAllClasses(classesData);
      setAllSessions(sessionsData);
      setEnrollments(enrollmentsData);
    } catch (error) {
      console.error("Failed to load student:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await studentService.updateStudent(params.id as string, formData as any);
      showToast({ type: "success", title: "Student updated successfully" });
      setIsEditing(false);
      loadData();
    } catch (error) {
      showToast({ type: "error", title: "Failed to update student" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClassChange = async () => {
    if (!selectedClass || !activeSession || !student) return;
    setIsChangingClass(true);
    try {
      await enrollmentService.removeEnrollment(student.id, activeSession.id);
      await enrollmentService.createEnrollment({
        studentId: student.id,
        classId: selectedClass,
        sessionId: activeSession.id,
      });
      const className = allClasses.find((c) => c.id === selectedClass)?.name || "";
      showToast({ type: "success", title: "Class updated", message: `Moved to ${className}` });
      setIsChangingClass(false);
      setIsEditing(false);
      loadData();
    } catch {
      showToast({ type: "error", title: "Failed to update class" });
      setIsChangingClass(false);
    }
  };

  const handleRemoveFromSession = async () => {
    if (!deleteTarget || !student) return;
    try {
      await enrollmentService.removeEnrollment(student.id, deleteTarget.id);
      showToast({ type: "success", title: "Student removed", message: `Removed from ${deleteTarget.name}` });
      setDeleteTarget(null);
      loadData();
    } catch {
      showToast({ type: "error", title: "Failed to remove student" });
      setDeleteTarget(null);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast({ type: "error", title: "Invalid file", message: "Please select an image file." });
      return;
    }
    if (!student) return;
    try {
      const result = await uploadStudentPhoto(file, student.id);
      setPhotoPreview(result.url);
      setFormData((prev) => ({ ...prev, photoUrl: result.url, photoPublicId: result.publicId }));
    } catch (err: any) {
      showToast({ type: "error", title: "Failed to upload photo", message: err.message });
    }
  };

  const clearPhoto = async () => {
    if (formData.photoPublicId) {
      try {
        await deleteStudentPhoto(formData.photoPublicId);
      } catch {
        // continue anyway
      }
    }
    setPhotoPreview("");
    setFormData((prev) => ({ ...prev, photoUrl: "", photoPublicId: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getSessionName = (sessionId: string) => {
    const session = allSessions.find((s) => s.id === sessionId);
    return session?.name || sessionId;
  };

  const getClassName = (classId: string) => {
    const cls = allClasses.find((c) => c.id === classId);
    return cls?.name || classId;
  };

  const currentEnrollment = activeSession
    ? enrollments.find((e) => e.sessionId === activeSession.id)
    : null;

  if (isLoading) return <PageSpinner />;
  if (!student) return <div className="text-center py-12 text-gray-500">Student not found</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push("/students")}>
        Back to Students
      </Button>

      {/* Student Info Card */}
      <Card>
        <CardHeader
          title={`${student.firstName} ${student.lastName}`}
          description={`Student #${student.studentNumber}`}
          action={
            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={() => { setIsEditing(false); setFormData({ firstName: student.firstName, lastName: student.lastName, dateOfBirth: student.dateOfBirth, placeOfBirth: (student as any).placeOfBirth || "", gender: student.gender, address: student.address, phone: student.phone, parentName: student.parentName, parentPhone: student.parentPhone, photoUrl: student.photoUrl || "", photoPublicId: student.photoPublicId || "" }); setPhotoPreview(student.photoUrl || ""); }}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />} onClick={handleSave}>
                    Save
                  </Button>
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
                  <p className="text-xs text-gray-400 mt-1">Used on report cards</p>
                </div>
              </div>
            )}
            {!isEditing && student.photoUrl && (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                  <img src={student.photoUrl} alt="Student" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-gray-500">Student Photo</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <Input label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                  <Input label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                  <Input label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                  <Input label="Place of Birth" value={formData.placeOfBirth} onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })} />
                  <Select label="Gender" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} options={[{ value: Gender.MALE, label: "Male" }, { value: Gender.FEMALE, label: "Female" }]} />
                  <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  <Input label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                  <Input label="Parent Name" value={formData.parentName} onChange={(e) => setFormData({ ...formData, parentName: e.target.value })} />
                  <Input label="Parent Phone" value={formData.parentPhone} onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })} />
                </>
              ) : (
                <>
                  <InfoField icon={<User className="h-4 w-4" />} label="Gender" value={student.gender === Gender.MALE ? "Male" : "Female"} />
                  <InfoField icon={<Calendar className="h-4 w-4" />} label="Date of Birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "-"} />
                  <InfoField icon={<MapPin className="h-4 w-4" />} label="Place of Birth" value={(student as any).placeOfBirth || "-"} />
                  <InfoField icon={<Phone className="h-4 w-4" />} label="Phone" value={student.phone || "-"} />
                  <InfoField icon={<MapPin className="h-4 w-4" />} label="Address" value={student.address || "-"} />
                  <InfoField icon={<User className="h-4 w-4" />} label="Parent" value={student.parentName || "-"} />
                  <InfoField icon={<Phone className="h-4 w-4" />} label="Parent Phone" value={student.parentPhone || "-"} />
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Enrollment */}
      {activeSession && (
        <Card>
          <CardHeader
            title="Current Enrollment"
            description={currentEnrollment ? `${activeSession.name}` : "Not enrolled in this academic year"}
            action={
              !isChangingClass && (
                <Button variant="secondary" size="sm" onClick={() => setIsChangingClass(true)}>
                  Change Class
                </Button>
              )
            }
          />
          <CardContent>
            {isChangingClass ? (
              <div className="space-y-3">
                <Select
                  label="Select New Class"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  options={allClasses.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))}
                  placeholder="Choose a class"
                />
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => { setIsChangingClass(false); setSelectedClass(""); }}>Cancel</Button>
                  <Button variant="primary" onClick={handleClassChange} isLoading={isChangingClass}>Update Class</Button>
                </div>
              </div>
            ) : currentEnrollment ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-primary">{getClassName(currentEnrollment.classId)}</p>
                  <p className="text-xs text-gray-400">Enrolled on {currentEnrollment.enrollmentDate}</p>
                </div>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">This student is not enrolled in {activeSession.name}.</p>
                <Select
                  label="Enroll in Class"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  options={allClasses.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))}
                  placeholder="Choose a class"
                />
                <div className="flex justify-end">
                  <Button variant="primary" size="sm" onClick={handleClassChange} isLoading={isChangingClass} disabled={!selectedClass}>
                    Enroll Student
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Academic History */}
      <Card>
        <CardHeader title="Academic History" description={`${enrollments.length} enrollment(s)`} />
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No enrollment history yet.</p>
          ) : (
            <div className="space-y-2">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-primary">{getClassName(enrollment.classId)}</p>
                    <p className="text-xs text-gray-400">{getSessionName(enrollment.sessionId)} · Enrolled {enrollment.enrollmentDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={enrollment.status === "ACTIVE" ? "success" : "info"} size="sm">{enrollment.status}</Badge>
                    {activeSession && enrollment.sessionId === activeSession.id && (
                      <button
                        onClick={() => setDeleteTarget(allSessions.find((s) => s.id === enrollment.sessionId) || null)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-danger transition-colors"
                        title="Remove from this academic year"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleRemoveFromSession}
        title="Remove Student from Academic Year"
        message={`This will remove ${student ? `${student.firstName} ${student.lastName}` : ""} from ${deleteTarget?.name}. Historical records from other Academic Years will not be affected.`}
        variant="warning"
        confirmLabel="Remove"
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
