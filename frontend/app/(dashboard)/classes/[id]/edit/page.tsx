"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { classService } from "@/services/class.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { showToast } from "@/components/ui/Toast";
import type { Class } from "@/types";
import { ArrowLeft, Save } from "lucide-react";

export default function EditClassPage() {
  const params = useParams();
  const router = useRouter();
  const [cls, setCls] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    classService.getClassById(params.id as string).then((data) => {
      if (data) {
        setCls(data);
        setFormData({ name: data.name, code: data.code, description: data.description });
      }
    }).finally(() => setIsLoading(false));
  }, [params.id]);

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
      await classService.updateClass(params.id as string, formData);
      showToast({ type: "success", title: "Class updated" });
      router.push(`/classes/${params.id}`);
    } catch {
      showToast({ type: "error", title: "Failed to update class" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <PageSpinner />;
  if (!cls) return <div className="text-center py-12 text-gray-500">Class not found</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push(`/classes/${params.id}`)}>Back</Button>
      <Card>
        <CardHeader title={`Edit ${cls.name}`} description="Update class information" />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Class Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} />
            <Input label="Class Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} error={errors.code} />
            <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => router.push(`/classes/${params.id}`)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
