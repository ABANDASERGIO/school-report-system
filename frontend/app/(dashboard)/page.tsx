"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { dashboardService } from "@/services/dashboard.service";
import { useAuth } from "@/providers/AuthProvider";
import { useAcademicYear } from "@/providers/AcademicYearProvider";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatsSkeleton } from "@/components/ui/Skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { UserRole } from "@/types/enums";
import {
  Users,
  GraduationCap,
  BookOpen,
  School,
  ClipboardList,
  CalendarDays,
  Clock,
  ArrowRight,
  BookCopy,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeSession } = useAcademicYear();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        if (user?.role === UserRole.PROPRIETOR) {
          const data = await dashboardService.getProprietorDashboard();
          setDashboardData(data);
        } else {
          const data = await dashboardService.getTeacherDashboard(user?.id || "");
          setDashboardData(data);
        }
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        </div>
        <StatsSkeleton />
      </div>
    );
  }

  const currentSessionName = activeSession?.name || dashboardData?.currentSession?.name || "N/A";

  // Teacher Dashboard
  if (user?.role === UserRole.TEACHER && dashboardData) {
    return <TeacherDashboard data={dashboardData} currentSessionName={currentSessionName} />;
  }

  // Proprietor Dashboard
  if (user?.role === UserRole.PROPRIETOR && dashboardData) {
    return <ProprietorDashboard data={dashboardData} currentSessionName={currentSessionName} />;
  }

  return null;
}

function TeacherDashboard({ data, currentSessionName }: { data: any; currentSessionName: string }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-primary">
          Welcome, {data.teacher.firstName}
        </h1>
        <p className="text-gray-500 mt-1">
          Current Session: {currentSessionName}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Classes"
          value={data.assignments.length}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Total Students"
          value={data.totalStudents}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          title="Submitted"
          value={data.submittedResults}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          title="Pending"
          value={data.pendingResults}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* My Assignments */}
      <Card>
        <CardHeader
          title="My Classes & Subjects"
          action={
            <Link href="/results/entry">
              <Button variant="primary" size="sm">
                Enter Marks
              </Button>
            </Link>
          }
        />
        <CardContent>
          <div className="space-y-3">
            {data.assignments.map((assignment: any) => (
              <Link
                key={assignment.id}
                href="/results/entry"
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all group"
              >
                <div>
                  <p className="text-sm font-medium text-primary group-hover:text-accent transition-colors">
                    {assignment.subjectId === "sub-001" ? "Mathematics" : 
                     assignment.subjectId === "sub-002" ? "English" :
                     assignment.subjectId === "sub-004" ? "Physics" :
                     assignment.subjectId === "sub-007" ? "History & Geography" : "Subject"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {assignment.classId === "cls-001" ? "Form 1" : 
                     assignment.classId === "cls-002" ? "Form 2" :
                     assignment.classId === "cls-003" ? "Form 3" :
                     assignment.classId === "cls-005" ? "Form 5 Science" :
                     assignment.classId === "cls-006" ? "Form 5 Arts" : "Class"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-accent transition-colors" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/results/entry"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all text-center"
            >
              <ClipboardList className="h-6 w-6 text-accent" />
              <span className="text-sm font-medium text-primary">Enter Marks</span>
            </Link>
            <Link
              href="/results"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all text-center"
            >
              <BookCopy className="h-6 w-6 text-accent" />
              <span className="text-sm font-medium text-primary">View Results</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProprietorDashboard({ data, currentSessionName }: { data: any; currentSessionName: string }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Current Session: {currentSessionName}
          </p>
        </div>
        <Badge variant="info" size="md">
          <CalendarDays className="h-3.5 w-3.5 mr-1" />
          {currentSessionName || "No active session"}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={data.totalStudents}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          title="Teachers"
          value={`${data.activeTeachers}/${data.totalTeachers}`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Classes"
          value={data.totalClasses}
          icon={<School className="h-5 w-5" />}
        />
        <StatCard
          title="Subjects"
          value={data.totalSubjects}
          icon={<BookOpen className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Submitted Results"
          value={data.submittedResults}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          title="Pending Results"
          value={data.pendingResults}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="Recent Enrollments"
          value={data.recentEnrollments}
          icon={<GraduationCap className="h-5 w-5" />}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { label: "Register Student", href: "/students/new", icon: GraduationCap },
              { label: "Add Teacher", href: "/teachers/new", icon: Users },
              { label: "Manage Classes", href: "/classes", icon: School },
              { label: "Manage Subjects", href: "/subjects", icon: BookOpen },
              { label: "Assignments", href: "/assignments", icon: BookCopy },
              { label: "Academic Sessions", href: "/academic/sessions", icon: CalendarDays },
              { label: "View Results", href: "/results", icon: ClipboardList },
              { label: "School Settings", href: "/settings", icon: Users },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all text-center"
              >
                <action.icon className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-primary">{action.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

