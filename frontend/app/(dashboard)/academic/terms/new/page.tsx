"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { termService } from "@/services/term.service";
import { sessionService } from "@/services/session.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { showToast } from "@/components/ui/Toast";
import type { AcademicSession } from "@/types";
import { ArrowLeft, Save } from "lucide-react";

export default function CreateTermPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ sessionId: "", name: "", sequenceCount: 2, startDate: "", endDate: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    sessionService.getSessions().then((data) => {
      setSessions(data);
      const current = data.find((s) => s.isCurrent);
      if (current) setFormData((prev) => ({ ...prev, sessionId: current.id }));
    });
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.sessionId) newErrors.sessionId = "Session is required";
    if (!formData.name.trim()) newErrors.name = "Term name is required";
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
      await termService.createTerm(formData);
      showToast({ type: "success", title: "Term created" });
      router.push("/academic/terms");
    } catch {
      showToast({ type: "error", title: "Failed to create term" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push("/academic/terms")}>Back</Button>
      <Card>
        <CardHeader title="New Term" />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Academic Session" value={formData.sessionId} onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })} options={sessions.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select session" error={errors.sessionId} />
            <Input label="Term Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} placeholder="e.g., First Term" />
            <Input label="Number of Sequences" type="number" min={1} max={4} value={formData.sequenceCount} onChange={(e) => setFormData({ ...formData, sequenceCount: parseInt(e.target.value) || 2 })} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} error={errors.startDate} />
              <Input label="End Date" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} error={errors.endDate} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => router.push("/academic/terms")}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
