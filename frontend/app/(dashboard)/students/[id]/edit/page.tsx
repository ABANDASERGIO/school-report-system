"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { studentService } from "@/services/student.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PageSpinner } from "@/components/ui/Spinner";
import { showToast } from "@/components/ui/Toast";
import type { Student } from "@/types";
import { Gender } from "@/types/enums";
import { ArrowLeft, Save } from "lucide-react";

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    studentService.getStudentById(params.id as string).then((data) => {
      if (data) {
        setStudent(data);
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          placeOfBirth: (data as any).placeOfBirth || "",
          gender: data.gender,
          address: data.address,
          phone: data.phone,
          parentName: data.parentName,
          parentPhone: data.parentPhone,
        });
      }
    }).finally(() => setIsLoading(false));
  }, [params.id]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      await studentService.updateStudent(params.id as string, formData as any);
      showToast({ type: "success", title: "Student updated" });
      router.push(`/students/${params.id}`);
    } catch {
      showToast({ type: "error", title: "Failed to update student" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <PageSpinner />;
  if (!student) return <div className="text-center py-12 text-gray-500">Student not found</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push(`/students/${params.id}`)}>Back</Button>
      <Card>
        <CardHeader title={`Edit ${student.firstName} ${student.lastName}`} description="Update personal information" />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} error={errors.firstName} />
              <Input label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} error={errors.lastName} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
              <Input label="Place of Birth" value={formData.placeOfBirth} onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })} />
            </div>
            <Select label="Gender" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} options={[{ value: Gender.MALE, label: "Male" }, { value: Gender.FEMALE, label: "Female" }]} error={errors.gender} />
            <Input label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Parent/Guardian Name" value={formData.parentName} onChange={(e) => setFormData({ ...formData, parentName: e.target.value })} />
              <Input label="Parent/Guardian Phone" value={formData.parentPhone} onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => router.push(`/students/${params.id}`)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
