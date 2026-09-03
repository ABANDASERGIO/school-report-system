"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sequenceService } from "@/services/sequence.service";
import { termService } from "@/services/term.service";
import { sessionService } from "@/services/session.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { showToast } from "@/components/ui/Toast";
import type { Term, AcademicSession } from "@/types";
import { ArrowLeft, Save } from "lucide-react";

export default function CreateSequencePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ termId: "", name: "", number: 1, startDate: "", endDate: "", isActive: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    sessionService.getSessions().then((data) => {
      setSessions(data);
      const current = data.find((s) => s.isCurrent);
      if (current) {
        termService.getTerms(current.id).then(setTerms);
      }
    });
  }, []);

  const handleSessionChange = (sessionId: string) => {
    setFormData((prev) => ({ ...prev, termId: "" }));
    termService.getTerms(sessionId).then(setTerms);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.termId) newErrors.termId = "Term is required";
    if (!formData.name.trim()) newErrors.name = "Sequence name is required";
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
      await sequenceService.createSequence(formData);
      showToast({ type: "success", title: "Sequence created" });
      router.push("/academic/sequences");
    } catch {
      showToast({ type: "error", title: "Failed to create sequence" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push("/academic/sequences")}>Back</Button>
      <Card>
        <CardHeader title="New Sequence" />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Academic Session" value={""} onChange={(e) => handleSessionChange(e.target.value)} options={sessions.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select session" />
            <Select label="Term" value={formData.termId} onChange={(e) => setFormData({ ...formData, termId: e.target.value })} options={terms.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select term" error={errors.termId} disabled={terms.length === 0} />
            <Input label="Sequence Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} placeholder="e.g., Sequence One" />
            <Input label="Sequence Number" type="number" min={1} max={6} value={formData.number} onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} error={errors.startDate} />
              <Input label="End Date" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} error={errors.endDate} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-border text-accent focus:ring-accent" />
              <span className="text-sm text-primary">Set as active sequence</span>
            </label>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => router.push("/academic/sequences")}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
