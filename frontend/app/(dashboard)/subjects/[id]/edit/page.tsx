"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { subjectService } from "@/services/subject.service";
import { classService } from "@/services/class.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { showToast } from "@/components/ui/Toast";
import type { Subject, Class } from "@/types";
import { ArrowLeft, Save } from "lucide-react";

export default function EditSubjectPage() {
  const params = useParams();
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", description: "", coefficient: 1 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const [subjectData, classesData] = await Promise.all([
          subjectService.getSubjectById(params.id as string),
          classService.getClasses(),
        ]);
        if (subjectData) {
          setSubject(subjectData);
          setFormData({ name: subjectData.name, code: subjectData.code, description: subjectData.description, coefficient: subjectData.coefficient });
          const classIds = await subjectService.getClassIdsForSubject(subjectData.id);
          setSelectedClasses(classIds);
        }
        setClasses(classesData);
      } catch (error) {
        console.error("Failed to load subject:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.id]);

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
      await subjectService.updateSubject(params.id as string, formData);
      const { subjectClassService } = await import("@/services/subject-class.service");
      await subjectClassService.setSubjectClasses(params.id as string, selectedClasses);
      showToast({ type: "success", title: "Subject updated" });
      router.push(`/subjects/${params.id}`);
    } catch {
      showToast({ type: "error", title: "Failed to update subject" });
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

  if (isLoading) return <PageSpinner />;
  if (!subject) return <div className="text-center py-12 text-gray-500">Subject not found</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push(`/subjects/${params.id}`)}>Back</Button>
      <Card>
        <CardHeader title={`Edit ${subject.name}`} description="Update subject information" />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Subject Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} />
            <Input label="Subject Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} error={errors.code} />
            <Input label="Coefficient" type="number" min={1} max={10} value={formData.coefficient} onChange={(e) => setFormData({ ...formData, coefficient: parseInt(e.target.value) || 1 })} error={errors.coefficient} />
            <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

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
              <Button variant="secondary" onClick={() => router.push(`/subjects/${params.id}`)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
