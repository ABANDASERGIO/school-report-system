"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { teacherService, mockUploadToCloudinary } from "@/services/teacher.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { showToast } from "@/components/ui/Toast";
import { ArrowLeft, Save, UserPlus, Dice5, Upload, X } from "lucide-react";

function generatePassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export default function CreateTeacherPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    specialization: "",
    password: "temp1234",
    photoUrl: "",
    photoPublicId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.specialization.trim()) newErrors.specialization = "Specialization is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      const result = await mockUploadToCloudinary(file, "teachers", tempId);
      setPhotoPreview(result.url);
      setFormData((prev) => ({ ...prev, photoUrl: result.url, photoPublicId: result.publicId }));
    } catch {
      showToast({ type: "error", title: "Failed to upload photo" });
    }
  };

  const clearPhoto = () => {
    setPhotoPreview("");
    setFormData((prev) => ({ ...prev, photoUrl: "", photoPublicId: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const teacher = await teacherService.createTeacher(formData);
      showToast({
        type: "success",
        title: "Teacher created!",
        message: `Login credentials: ${formData.email} / ${formData.password}`,
      });
      router.push(`/teachers/${teacher.id}`);
    } catch (error) {
      showToast({ type: "error", title: "Failed to create teacher" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push("/teachers")}>
        Back to Teachers
      </Button>

      <Card>
        <CardHeader title="Add New Teacher" description="Create a teacher account. The teacher will use these credentials to log in." />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} error={errors.firstName} placeholder="John" />
              <Input label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} error={errors.lastName} placeholder="Doe" />
              <Input label="Email Address" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={errors.email} placeholder="teacher@school.com" />
              <Input label="Phone Number" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+237 670 000 000" />
              <Input label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="City, Street" />
              <div className="sm:col-span-2">
                <Input label="Specialization / Subject" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} error={errors.specialization} placeholder="e.g., Mathematics, Physics, English" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-primary mb-1">Profile Photo</label>
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
                    <p className="text-xs text-gray-400 mt-1">Teacher profile picture</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Auto-generated password:</strong> {formData.password}
                <br />
                The teacher should change this on first login.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => router.push("/teachers")}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<UserPlus className="h-4 w-4" />}>
                Create Teacher
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
