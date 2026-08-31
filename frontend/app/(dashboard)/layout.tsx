"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageSpinner } from "@/components/ui/Spinner";
import { AcademicYearProvider, useAcademicYear } from "@/providers/AcademicYearProvider";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { showToast } from "@/components/ui/Toast";
import { CalendarDays, Plus } from "lucide-react";

function FirstTimeSetup() {
  const router = useRouter();
  const { activeSession, setActiveSession, isLoading } = useAcademicYear();
  const [name, setName] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (activeSession) {
      router.replace("/");
    }
  }, [activeSession, router]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Academic Year name is required";
    if (!startDate) newErrors.startDate = "Start date is required";
    if (!endDate) newErrors.endDate = "End date is required";
    if (startDate && endDate && endDate <= startDate) newErrors.endDate = "End date must be after start date";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      const { sessionService } = await import("@/services/session.service");
      const session = await sessionService.createSession({
        name: name.trim(),
        startDate,
        endDate,
        isCurrent: true,
      });
      await setActiveSession(session.id);
      showToast({ type: "success", title: "Academic Year created", message: `${session.name} is now active.` });
      router.replace("/");
    } catch {
      showToast({ type: "error", title: "Failed to create academic year" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageSpinner />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardContent>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CalendarDays className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Welcome</h1>
            <p className="text-sm text-gray-500 mt-1">Let&apos;s set up your first Academic Year to get started.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            <Input
              label="Academic Year Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="e.g., 2026/2027"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                error={errors.startDate}
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                error={errors.endDate}
              />
            </div>
            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isSaving} leftIcon={<Plus className="h-4 w-4" />}>
              Create Academic Year
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasSessions, isLoading: ayLoading } = useAcademicYear();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || ayLoading) {
    return <PageSpinner />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!hasSessions) {
    return <FirstTimeSetup />;
  }

  return <DashboardShell>{children}</DashboardShell>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AcademicYearProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </AcademicYearProvider>
  );
}

export { FirstTimeSetup };
