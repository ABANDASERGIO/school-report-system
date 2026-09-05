"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { sessionService } from "@/services/session.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { showToast } from "@/components/ui/Toast";
import type { AcademicSession } from "@/types";
import { ArrowLeft, Save, Users } from "lucide-react";

export default function CreateSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", startDate: "", endDate: "", isCurrent: false, carryForward: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const carryForward = searchParams.get('carryForward') === 'true';
    setFormData((prev) => ({ ...prev, carryForward }));
  }, [searchParams]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Session name is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      await sessionService.createSessionWithCarryForward(formData, formData.carryForward);
      showToast({ type: "success", title: "Session created" });
      router.push("/academic/sessions");
    } catch {
      showToast({ type: "error", title: "Failed to create session" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push("/academic/sessions")}>Back</Button>
      <Card>
        <CardHeader title="New Academic Session" />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Session Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} placeholder="e.g., 2026/2027" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} error={errors.startDate} />
              <Input label="End Date" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} error={errors.endDate} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.isCurrent} onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })} className="w-4 h-4 rounded border-border text-accent focus:ring-accent" />
              <span className="text-sm text-primary">Set as current session</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.carryForward} onChange={(e) => setFormData({ ...formData, carryForward: e.target.checked })} className="w-4 h-4 rounded border-border text-accent focus:ring-accent" />
              <div>
                <span className="text-sm text-primary">Carry forward teacher assignments</span>
                <p className="text-xs text-gray-400">Copy assignments from the previous academic year so teachers keep their classes.</p>
              </div>
            </label>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => router.push("/academic/sessions")}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
