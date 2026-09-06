"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  Users,
  School,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Wifi,
  WifiOff,
  Shield,
  Lock,
  ChevronRight,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  UserCheck,
  Settings,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Student Management",
    description: "Register, track, and manage student profiles with photos and enrollment history.",
  },
  {
    icon: UserCheck,
    title: "Teacher Management",
    description: "Manage teacher profiles, assignments, and subject allocations across classes.",
  },
  {
    icon: School,
    title: "Classes & Subjects",
    description: "Organize classes and assign subjects with customizable coefficients and grading scales.",
  },
  {
    icon: CalendarDays,
    title: "Academic Sessions & Terms",
    description: "Structure your academic year with sessions, terms, and sequences that auto-create.",
  },
  {
    icon: ClipboardList,
    title: "Marks & Results",
    description: "Enter, edit, and lock results with support for multiple sequences per term.",
  },
  {
    icon: FileText,
    title: "Automated Report Cards",
    description: "Generate professional report cards with grades, remarks, and class positions instantly.",
  },
  {
    icon: Shield,
    title: "Secure Authentication",
    description: "Role-based access for proprietors and teachers with JWT-secured sessions.",
  },
  {
    icon: WifiOff,
    title: "Offline Marks Entry",
    description: "Teachers can enter marks without internet. Data syncs automatically when back online.",
  },
];

const steps = [
  {
    step: "1",
    title: "Set Up Academic Session",
    description: "Create the academic year, terms, and sequences. Classes and subjects are assigned once.",
  },
  {
    step: "2",
    title: "Teachers Enter Marks",
    description: "Teachers enter marks per sequence. Offline mode ensures uninterrupted work.",
  },
  {
    step: "3",
    title: "Generate Report Cards",
    description: "EduGrade computes grades, averages, positions, and produces final report cards.",
  },
];

const whyItems = [
  "Saves teachers and administrators hours of manual calculation and record-keeping.",
  "Reduces errors from manual grade computation and report card preparation.",
  "Keeps academic records organized and easily accessible across sessions.",
  "Supports students offering different subjects within the same class.",
  "Works reliably even when school internet connectivity is unstable.",
  "Preserves previous academic sessions and records for historical reference.",
];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-primary">EduGrade</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-600 hover:text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-primary transition-colors">How It Works</a>
              <a href="#why" className="text-sm text-gray-600 hover:text-primary transition-colors">Why EduGrade</a>
              <Link href="/login">
                <Button variant="primary" size="sm">Sign In</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
              <div className="flex flex-col gap-3">
                <a href="#features" className="text-sm text-gray-600 hover:text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#how-it-works" className="text-sm text-gray-600 hover:text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                <a href="#why" className="text-sm text-gray-600 hover:text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Why EduGrade</a>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" fullWidth>Sign In</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="text-center lg:text-left animate-slide-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
                <CheckCircle2 className="h-3.5 w-3.5" />
                School Result Management System
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary leading-tight mb-6">
                Manage Results.
                <br />
                <span className="text-accent">Generate Report Cards.</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                EduGrade helps schools manage students, teachers, classes, and academic results with automated report card generation — even when offline.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/login">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Get Started
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="secondary" size="lg">
                    Learn More
                  </Button>
                </a>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative animate-slide-in-right">
              <div className="bg-white rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
                {/* Mock browser header */}
                <div className="bg-gray-50 border-b border-border/50 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-md border border-border/50 text-xs text-gray-500">
                      <Lock className="h-3 w-3" />
                      edugrade.app/dashboard
                    </div>
                  </div>
                </div>

                {/* Mock dashboard content */}
                <div className="p-4 sm:p-6 bg-background">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="h-6 w-32 bg-primary/10 rounded mb-2" />
                      <div className="h-3 w-48 bg-gray-200 rounded" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-20 bg-primary/10 rounded" />
                      <div className="h-8 w-20 bg-accent/10 rounded" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: "Students", value: "1,248", color: "bg-blue-50 text-blue-600" },
                      { label: "Teachers", value: "64", color: "bg-green-50 text-green-600" },
                      { label: "Classes", value: "32", color: "bg-purple-50 text-purple-600" },
                      { label: "Subjects", value: "18", color: "bg-orange-50 text-orange-600" },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white rounded-xl p-4 border border-border/50">
                        <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                        <div className={cn("text-lg font-bold", stat.color)}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/50">
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                    </div>
                    <div className="divide-y divide-border/50">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 text-accent" />
                            </div>
                            <div>
                              <div className="h-3 w-24 bg-gray-200 rounded mb-1" />
                              <div className="h-2 w-16 bg-gray-100 rounded" />
                            </div>
                          </div>
                          <div className="h-6 w-16 bg-primary/10 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">Everything you need to manage school results</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From student registration to final report card generation, EduGrade handles the full academic workflow.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={feature.title} hover className="group">
                <CardContent>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                    <feature.icon className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-base font-semibold text-primary mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to transform your school&apos;s result management.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.step} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why EduGrade */}
      <section id="why" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-6">Why schools choose EduGrade</h2>
              <p className="text-lg text-gray-600 mb-8">
                Built for real schools, EduGrade solves the everyday challenges of result management with reliability and simplicity.
              </p>
              <ul className="space-y-4">
                {whyItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                    <span className="text-gray-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 sm:p-10">
                <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-primary">Report Card</div>
                      <div className="text-xs text-gray-500">Form 5 Science — First Term</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { subject: "English", score: "14.5 / 20", grade: "B", color: "text-blue-600 bg-blue-50" },
                      { subject: "Mathematics", score: "16.0 / 20", grade: "A", color: "text-green-600 bg-green-50" },
                      { subject: "Biology", score: "12.5 / 20", grade: "C", color: "text-yellow-600 bg-yellow-50" },
                    ].map((row) => (
                      <div key={row.subject} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div>
                          <div className="text-sm font-medium text-primary">{row.subject}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">{row.score}</span>
                          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", row.color)}>{row.grade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to modernize your school&apos;s result management?
          </h2>
          <p className="text-lg text-primary-light mb-8 max-w-2xl mx-auto">
            Join schools that have simplified their academic workflow with EduGrade. Get started in minutes.
          </p>
          <Link href="/login">
            <Button variant="secondary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Get Started
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
