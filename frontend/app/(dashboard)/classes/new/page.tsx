"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { classService } from "@/services/class.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { showToast } from "@/components/ui/Toast";
import { ArrowLeft, Save } from "lucide-react";

export default function CreateClassPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Class name is required";
    if (!formData.code.trim()) newErrors.code = "Class code is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      const cls = await classService.createClass(formData);
      showToast({ type: "success", title: "Class created" });
      router.push(`/classes/${cls.id}`);
    } catch {
      showToast({ type: "error", title: "Failed to create class" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push("/classes")}>Back to Classes</Button>
      <Card>
        <CardHeader title="Add New Class" description="Create a new class for the school." />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Class Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} placeholder="e.g., Form 1" />
            <Input label="Class Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} error={errors.code} placeholder="e.g., F1" helperText="A short unique code for the class." />
            <Input label="Description (optional)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the class" />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => router.push("/classes")}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>Create Class</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
