"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { subjectService } from "@/services/subject.service";
import { classService } from "@/services/class.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { showToast } from "@/components/ui/Toast";
import { ArrowLeft, Save } from "lucide-react";

export default function CreateSubjectPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({ name: "", code: "", description: "", coefficient: 1 });
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    classService.getClasses().then((data) => setClasses(data.map((c) => ({ id: c.id, name: c.name }))));
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Subject name is required";
    if (!formData.code.trim()) newErrors.code = "Subject code is required";
    if (formData.coefficient < 1) newErrors.coefficient = "Coefficient must be at least 1";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      const subject = await subjectService.createSubject(formData);
      const { subjectClassService } = await import("@/services/subject-class.service");
      await subjectClassService.setClassesForSubject(subject.id, selectedClasses);
      showToast({ type: "success", title: "Subject created" });
      router.push(`/subjects/${subject.id}`);
    } catch {
      showToast({ type: "error", title: "Failed to create subject" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleClass = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const toggleAll = () => {
    if (selectedClasses.length === classes.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(classes.map((c) => c.id));
    }
  };

  const allSelected = selectedClasses.length === classes.length && classes.length > 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push("/subjects")}>Back to Subjects</Button>
      <Card>
        <CardHeader title="Add New Subject" />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Subject Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} placeholder="e.g., Mathematics" />
            <Input label="Subject Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} error={errors.code} placeholder="e.g., MATH" />
            <Input label="Coefficient" type="number" min={1} max={10} value={formData.coefficient} onChange={(e) => setFormData({ ...formData, coefficient: parseInt(e.target.value) || 1 })} error={errors.coefficient} />
            <Input label="Description (optional)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description" />

            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className="text-sm font-medium text-primary">All Classes</span>
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto border border-border rounded-lg p-3">
                {classes.map((cls) => (
                  <label key={cls.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(cls.id)}
                      onChange={() => toggleClass(cls.id)}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="text-sm text-primary">{cls.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => router.push("/subjects")}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>Create Subject</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
