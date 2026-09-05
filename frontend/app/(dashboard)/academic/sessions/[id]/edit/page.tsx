"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sessionService } from "@/services/session.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { showToast } from "@/components/ui/Toast";
import type { AcademicSession } from "@/types";
import { ArrowLeft, Save } from "lucide-react";

export default function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", startDate: "", endDate: "", isCurrent: false, isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const resolvedParams = React.use(params);
  const sessionId = resolvedParams.id;

  useEffect(() => {
    async function load() {
      try {
        const session = await sessionService.getSessionById(sessionId);
        if (session) {
          setFormData({
            name: session.name,
            startDate: session.startDate,
            endDate: session.endDate,
            isCurrent: session.isCurrent,
            isActive: session.isActive,
          });
        } else {
          showToast({ type: "error", title: "Session not found" });
          router.push("/academic/sessions");
        }
      } catch {
        showToast({ type: "error", title: "Failed to load session" });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [sessionId, router]);

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
      await sessionService.updateSession(sessionId, {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isCurrent: formData.isCurrent,
        isActive: formData.isActive,
      });
      showToast({ type: "success", title: "Session updated" });
      router.push("/academic/sessions");
    } catch {
      showToast({ type: "error", title: "Failed to update session" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
        <Card><CardContent><div className="space-y-4">{[1,2,3].map((i) => (<div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />))}</div></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push("/academic/sessions")}>Back</Button>
      <Card>
        <CardHeader title="Edit Academic Session" />
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
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-border text-accent focus:ring-accent" />
              <span className="text-sm text-primary">Active</span>
            </label>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => router.push("/academic/sessions")}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
