"use client";

import React, { useState, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { SearchInput } from "@/components/ui/SearchInput";
import { Spinner } from "@/components/ui/Spinner";
import { showToast } from "@/components/ui/Toast";
import { PrintableReportCard } from "@/components/report-card/PrintableReportCard";
import { reportCardService } from "@/services/report-card.service";
import { studentService } from "@/services/student.service";
import { sessionService } from "@/services/session.service";
import { classService } from "@/services/class.service";
import { buildSampleReportCard } from "@/lib/sample-report-card";
import type { ReportCardData, ReportCardType, Student, AcademicSession, Class as ClassType } from "@/types";
import { FileText, Printer, GraduationCap, Search, User, Users, ChevronRight } from "lucide-react";

type Mode = "single" | "bulk";

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportCardData | null>(null);
  const [bulkReports, setBulkReports] = useState<ReportCardData[]>([]);
  const [mode, setMode] = useState<Mode>("single");
  const [reportType, setReportType] = useState<ReportCardType>("first-term");
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  React.useEffect(() => {
    Promise.all([
      studentService.getStudents(),
      sessionService.getSessions(),
      classService.getClasses(),
    ]).then(([stu, ses, cls]) => {
      setStudents(stu);
      setSessions(ses);
      setClasses(cls);
      const current = ses.find((s) => s.isCurrent);
      if (current) setSelectedSessionId(current.id);
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (mode === "single") {
      if (!selectedStudentId) {
        showToast({ type: "error", title: "Select Student", message: "Please select a student to generate the report card." });
        return;
      }
      if (!selectedSessionId) {
        showToast({ type: "error", title: "Select Session", message: "Please select an academic session." });
        return;
      }

      setIsGenerating(true);
      try {
        const data = await reportCardService.generateReportCard(reportType, selectedStudentId, selectedClassId || undefined, selectedSessionId);
        setReportData(data);
      } catch {
        showToast({ type: "error", title: "Generation Failed", message: "Failed to generate report card." });
      } finally {
        setIsGenerating(false);
      }
    } else {
      if (!selectedClassId) {
        showToast({ type: "error", title: "Select Class", message: "Please select a class." });
        return;
      }
      if (!selectedSessionId) {
        showToast({ type: "error", title: "Select Session", message: "Please select an academic session." });
        return;
      }

      setIsGenerating(true);
      try {
        const data = await reportCardService.generateBulkReportCards(reportType, selectedClassId, selectedSessionId);
        setBulkReports(data);
        showToast({ type: "success", title: "Generation Complete", message: `Generated ${data.length} report cards.` });
      } catch {
        showToast({ type: "error", title: "Bulk Generation Failed" });
      } finally {
        setIsGenerating(false);
      }
    }
  }, [mode, selectedStudentId, selectedSessionId, selectedClassId, reportType]);

  const handleViewSingle = useCallback((report: ReportCardData) => {
    setReportData(report);
  }, []);

  const filteredStudents = studentSearch
    ? students.filter((s) =>
        `${s.firstName} ${s.lastName} ${s.studentNumber}`.toLowerCase().includes(studentSearch.toLowerCase())
      )
    : students;

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || "";

  if (reportData) {
    return <PrintableReportCard data={reportData} onBack={() => setReportData(null)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-primary">Report Cards</h1>
        <p className="text-sm text-gray-500 mt-1">Generate termly and annual report cards for individual students or entire classes.</p>
      </div>

      {/* Mode Toggle */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode("single")}
              className={`p-4 rounded-xl border-2 text-center transition-all ${mode === "single" ? "border-accent bg-accent/5 shadow-sm" : "border-border hover:border-accent/40 hover:bg-gray-50"}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${mode === "single" ? "bg-accent text-white" : "bg-gray-100 text-gray-500"}`}>
                <User className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-primary">Single Student</h3>
              <p className="text-xs text-gray-500 mt-1">Generate for one student</p>
            </button>
            <button
              onClick={() => setMode("bulk")}
              className={`p-4 rounded-xl border-2 text-center transition-all ${mode === "bulk" ? "border-accent bg-accent/5 shadow-sm" : "border-border hover:border-accent/40 hover:bg-gray-50"}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${mode === "bulk" ? "bg-accent text-white" : "bg-gray-100 text-gray-500"}`}>
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-primary">Whole Class</h3>
              <p className="text-xs text-gray-500 mt-1">Generate for all students</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Report Type Selection */}
      <Card>
        <CardHeader title="Report Type" description="Choose the type of report card to generate" />
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              { value: "first-term" as ReportCardType, label: "First Term", seqLabel: "Seq 1 & 2" },
              { value: "second-term" as ReportCardType, label: "Second Term", seqLabel: "Seq 3 & 4" },
              { value: "final" as ReportCardType, label: "Annual (Final)", seqLabel: "All Sequences" },
            ]).map((option) => (
              <button
                key={option.value}
                onClick={() => setReportType(option.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${reportType === option.value ? "border-accent bg-accent/5 shadow-sm" : "border-border hover:border-accent/40 hover:bg-gray-50"}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${reportType === option.value ? "bg-accent text-white" : "bg-gray-100 text-gray-500"}`}>
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-primary">{option.label}</h3>
                <p className="text-xs text-gray-500 mt-1">{option.seqLabel}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selection Form */}
      <Card>
        <CardHeader title={mode === "single" ? "Select Student & Session" : "Select Class & Session"} />
        <CardContent className="space-y-4">
          <Select
            label="Academic Session"
            placeholder="Select session"
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            options={sessions.map((s) => ({ value: s.id, label: `${s.name}${s.isCurrent ? " (Current)" : ""}` }))}
          />

          {mode === "single" ? (
            <>
              <Select
                label="Filter by Class (optional)"
                placeholder="All classes"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-primary">Student *</label>
                  <button onClick={() => setShowSearch(!showSearch)} className="text-xs text-accent hover:underline flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    {showSearch ? "Hide search" : "Search students"}
                  </button>
                </div>
                {showSearch && <SearchInput value={studentSearch} onChange={setStudentSearch} placeholder="Search by name or student number..." />}
                <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-400">No students found</div>
                  ) : (
                    filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-gray-50 ${selectedStudentId === s.id ? "bg-accent/5 border-l-2 border-accent" : ""}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary truncate">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-gray-400">{s.studentNumber}</p>
                        </div>
                        {selectedStudentId === s.id && <div className="w-2 h-2 rounded-full bg-accent" />}
                      </button>
                    ))
                  )}
                </div>
              {selectedStudent && (
                 <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                       <User className="h-5 w-5 text-accent" />
                     </div>
                     <div>
                       <p className="text-sm font-semibold text-primary">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                       <p className="text-xs text-gray-500">{selectedStudent.studentNumber} | {selectedStudent.gender}</p>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           </>
         ) : (
            <Select
              label="Class *"
              placeholder="Select class"
              value={selectedClassId}
              onChange={(e) => { setSelectedClassId(e.target.value); setBulkReports([]); }}
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
            />
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={isGenerating ? <Spinner className="h-4 w-4" /> : mode === "bulk" ? <Users className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            onClick={handleGenerate}
            isLoading={isGenerating}
            disabled={mode === "single" ? !selectedStudentId || !selectedSessionId : !selectedClassId || !selectedSessionId}
          >
            {isGenerating ? "Generating..." : mode === "bulk" ? `Generate All Report Cards${selectedClassName ? ` (${selectedClassName})` : ""}` : "Generate Report Card"}
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Results List */}
      {mode === "bulk" && bulkReports.length > 0 && (
        <Card>
          <CardHeader title={`Generated Report Cards (${bulkReports.length})`} description="Click any student to view their full report card" />
          <CardContent>
            <div className="space-y-2">
            {bulkReports.map((report) => (
              <button
                key={report.studentId}
                onClick={() => handleViewSingle(report)}
                className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{report.studentName}</p>
                  <p className="text-xs text-gray-400 truncate">{report.studentNumber} | {report.studentClass}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary">{report.average}</p>
                  <p className="text-[10px] text-gray-400">Avg</p>
                </div>
                <div className="text-right shrink-0 mr-1">
                  <p className="text-sm font-semibold text-gray-700">{report.classPosition}<span className="text-xs text-gray-400">/{report.totalStudentsInClass}</span></p>
                  <p className="text-[10px] text-gray-400">Pos</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
            <div className="mt-4 text-center">
              <Button variant="secondary" size="md" leftIcon={<Printer className="h-4 w-4" />} onClick={() => { if (bulkReports.length > 0) handleViewSingle(bulkReports[0]); }}>
                View & Print Individual Cards
              </Button>
              <p className="text-xs text-gray-400 mt-2">Click a student above to view their full report card</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Button */}
      <div className="text-center">
        <Button
          variant="secondary"
          size="md"
          leftIcon={<FileText className="h-4 w-4" />}
          onClick={async () => {
            setIsGenerating(true);
            try {
              // Local sample — no backend call. Lets the proprietor preview
              // the layout without selecting a real student.
              const data = buildSampleReportCard(reportType);
              setReportData(data);
            } catch {
              showToast({ type: "error", title: "Preview Failed" });
            } finally {
              setIsGenerating(false);
            }
          }}
          isLoading={isGenerating}
        >
          Preview Sample Report Card
        </Button>
        <p className="text-xs text-gray-400 mt-2">Generate a sample report card with placeholder data to test the layout</p>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader title="About Report Card Generation" />
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-accent">1</span>
              </div>
              <div>
                <p className="font-medium text-primary">Single Student</p>
                 <p className="text-xs text-gray-500">Search and select a student, then generate their individual report card.</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                 <span className="text-xs font-bold text-accent">2</span>
               </div>
               <div>
                 <p className="font-medium text-primary">Whole Class (Bulk)</p>
                 <p className="text-xs text-gray-500">Select a class and generate report cards for all enrolled students at once. Click any card to view and print individual reports.</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                 <span className="text-xs font-bold text-accent">3</span>
               </div>
               <div>
                <p className="font-medium text-primary">Print & Download</p>
                 <p className="text-xs text-gray-500">Each report card has Print and Download PDF buttons. Download uses your browser's Save as PDF feature for a professional document.</p>
               </div>
             </div>
           </div>
         </CardContent>
      </Card>
    </div>
  );
}
