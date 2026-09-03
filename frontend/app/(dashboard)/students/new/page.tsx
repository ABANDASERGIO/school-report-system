"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { studentService, uploadStudentPhoto } from "@/services/student.service";
import { uploadService } from "@/services/upload.service";
import { classService } from "@/services/class.service";
import { sessionService } from "@/services/session.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { showToast } from "@/components/ui/Toast";
import { Gender } from "@/types/enums";
import type { Class as ClassType, AcademicSession } from "@/types";
import { ArrowLeft, Save, Upload, X } from "lucide-react";

export default function NewStudentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    classId: "",
    sessionId: "",
    photoUrl: "",
    photoPublicId: "",
  });

  useEffect(() => {
    Promise.all([
      classService.getClasses(),
      sessionService.getSessions(),
    ]).then(([clsData, sesData]) => {
      setClasses(clsData);
      setSessions(sesData);
      const current = sesData.find((s: AcademicSession) => s.isCurrent);
      if (current) {
        setFormData((prev) => ({ ...prev, sessionId: current.id }));
      }
    });
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast({ type: "error", title: "Invalid file", message: "Please select an image file." });
      return;
    }
    try {
      const tempId = `temp-${Date.now()}`;
      const result = await uploadStudentPhoto(file, tempId);
      setPhotoPreview(result.url);
      setFormData((prev) => ({ ...prev, photoUrl: result.url, photoPublicId: result.publicId }));
    } catch (err: any) {
      showToast({ type: "error", title: "Failed to upload photo", message: err.message });
    }
  };

  const clearPhoto = () => {
    setPhotoPreview("");
    setFormData((prev) => ({ ...prev, photoUrl: "", photoPublicId: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.gender) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "First name, last name, gender, and class are required.",
      });
      return;
    }

    if (!formData.classId) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please select a class for the student.",
      });
      return;
    }

    if (!formData.sessionId) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please select an academic session.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const student = await studentService.createStudent({
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        placeOfBirth: formData.placeOfBirth,
        gender: formData.gender,
        address: formData.address,
        phone: formData.phone,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        photoUrl: formData.photoUrl || undefined,
        photoPublicId: formData.photoPublicId || undefined,
        enrollment: {
          classId: formData.classId,
          sessionId: formData.sessionId,
        },
      });

      // Re-key the photo from the temp publicId to the student's real id
      // so the Cloudinary asset lives under the canonical path.
      if (formData.photoPublicId && formData.photoPublicId.includes("/temp-")) {
        const rebind = await uploadService.rebindPhoto("student", formData.photoPublicId, student.id);
        if (rebind) {
          await studentService.updateStudent(student.id, {
            photoUrl: rebind.url || formData.photoUrl,
            photoPublicId: rebind.publicId,
          });
        }
      }

      const className = classes.find((c) => c.id === formData.classId)?.name || "";
      showToast({
        type: "success",
        title: "Student Registered",
        message: `${formData.firstName} ${formData.lastName} has been enrolled in ${className}.`,
      });

      router.push("/students");
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to Register",
        message: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-primary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-primary">Register Student</h1>
          <p className="text-sm text-gray-500">Add a new student to the system</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader title="Personal Information" />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
              />
              <Input
                label="Last Name *"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              />
              <Input
                label="Place of Birth"
                placeholder="City of birth"
                value={formData.placeOfBirth}
                onChange={(e) => handleChange("placeOfBirth", e.target.value)}
              />
              <Select
                label="Gender *"
                placeholder="Select gender"
                options={[
                  { value: Gender.MALE, label: "Male" },
                  { value: Gender.FEMALE, label: "Female" },
                ]}
                value={formData.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                required
              />
            </div>

            <Input
              label="Address"
              placeholder="Enter home address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+237 6XX XXX XXX"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />

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
                  Upload Photo
                </Button>
                {photoPreview && (
                  <button type="button" onClick={clearPhoto} className="text-xs text-danger hover:underline ml-2">Remove</button>
                )}
                <p className="text-xs text-gray-400 mt-1">Student photo for report card</p>
              </div>
            </div>

            <hr className="border-border" />
            <h4 className="text-sm font-semibold text-primary">Parent / Guardian</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Parent Name"
                placeholder="Enter parent/guardian name"
                value={formData.parentName}
                onChange={(e) => handleChange("parentName", e.target.value)}
              />
              <Input
                label="Parent Phone"
                type="tel"
                placeholder="+237 6XX XXX XXX"
                value={formData.parentPhone}
                onChange={(e) => handleChange("parentPhone", e.target.value)}
              />
            </div>

            <hr className="border-border" />
            <h4 className="text-sm font-semibold text-primary">Enrollment</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Academic Session *"
                placeholder="Select session"
                value={formData.sessionId}
                onChange={(e) => handleChange("sessionId", e.target.value)}
                options={sessions.map((s) => ({ value: s.id, label: s.name }))}
              />
              <Select
                label="Class *"
                placeholder="Select class"
                value={formData.classId}
                onChange={(e) => handleChange("classId", e.target.value)}
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" variant="primary" size="lg" isLoading={isLoading} leftIcon={<Save className="h-4 w-4" />}>
                Register Student
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
