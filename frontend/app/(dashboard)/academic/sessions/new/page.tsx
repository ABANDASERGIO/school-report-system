"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { sessionService } from "@/services/session.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { showToast } from "@/components/ui/Toast";
import type { AcademicSession } from "@/types";
import { ArrowLeft, Save, Users, GraduationCap } from "lucide-react";

export default function CreateSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    carryForward: false,
    promoteStudents: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [pendingOptions, setPendingOptions] = useState<{ carryForward: boolean; promoteStudents: boolean } | null>(null);

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
    setShowOptionsModal(true);
  };

  const handleConfirmOptions = async () => {
    if (!pendingOptions) return;
    setIsSaving(true);
    try {
      await sessionService.createSessionWithOptions(formData, pendingOptions);
      showToast({ type: "success", title: "Session created" });
      router.push("/academic/sessions");
    } catch {
      showToast({ type: "error", title: "Failed to create session" });
    } finally {
      setIsSaving(false);
      setShowOptionsModal(false);
      setPendingOptions(null);
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
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => router.push("/academic/sessions")}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Modal isOpen={showOptionsModal} onClose={() => setShowOptionsModal(false)} title="Carry Forward Options" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Choose what to bring forward from the most recent prior academic year:
          </p>
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={formData.carryForward}
                onChange={(e) => setFormData({ ...formData, carryForward: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded border-border text-accent focus:ring-accent"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-primary">Carry forward teacher assignments</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 ml-7">
                  Copy teacher-class-subject assignments from the previous year so teachers keep their classes.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={formData.promoteStudents}
                onChange={(e) => setFormData({ ...formData, promoteStudents: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded border-border text-accent focus:ring-accent"
              />
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-primary">Promote students to next class</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 ml-7">
                  Move all actively enrolled students to their next class (based on class promotion chain).
                  Students in classes without a defined next class will not be promoted.
                </p>
              </div>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setShowOptionsModal(false)}>Back</Button>
            <Button
              variant="primary"
              isLoading={isSaving}
              onClick={() => { setPendingOptions({ carryForward: formData.carryForward, promoteStudents: formData.promoteStudents }); handleConfirmOptions(); }}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Create Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
