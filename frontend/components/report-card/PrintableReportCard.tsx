"use client";

import React, { useRef, useState } from "react";
import type { ReportCardData } from "@/types";
import { Button } from "@/components/ui/Button";
import { Printer, Download, ChevronLeft } from "lucide-react";

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-[11px] sm:text-sm font-semibold text-gray-800 truncate">{value}</p>
    </div>
  );
}

export function PrintableReportCard({ data, onBack }: { data: ReportCardData; onBack: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);
  const [logoError, setLogoError] = useState(false);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules || [])
            .map((rule) => rule.cssText)
            .join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report Card - ${data.studentName}</title>
          <style>${styles}</style>
          <style>
            @page { size: A4; margin: 15mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          </style>
        </head>
        <body>
          ${printRef.current?.outerHTML || ""}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const isFinal = data.type === "final";
  const isFirstTerm = data.type === "first-term";
  const isSecondTerm = data.type === "second-term";

  const totalPoints = Math.round(data.totalScore * 10) / 10;
  const totalCoeff = Math.round(data.totalMaxScore / 20);
  const averageValue = data.average;
  const absences = data.totalDays - data.attendance;
  const subjectsWritten = data.subjects.filter((s) => {
    const score = isFinal ? s.annualTotal : isFirstTerm ? s.term1Total : s.term2Total;
    return score !== null && score !== undefined;
  }).length;
  const numberPassed = data.subjects.filter((s) => {
    const score = isFinal
      ? s.annualTotal
      : isFirstTerm
      ? s.term1Total
      : s.term2Total;
    return score !== null && score !== undefined && score >= 10;
  }).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" size="sm" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={onBack}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Printer className="h-4 w-4" />} onClick={handlePrint}>
            Print
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={handlePrint}>
            Download PDF
          </Button>
        </div>
      </div>

      <div ref={printRef} className="bg-white rounded-xl border-2 border-primary/20 overflow-hidden shadow-lg max-w-[210mm] mx-auto">
        {/* Official Header - Cameroon Flag | School Info | French Info */}
        <div className="border-b-2 border-primary/20">
          <div className="flex items-start justify-between gap-2 px-3 sm:px-5 py-3 sm:py-4">
            {/* Left - Cameroon Flag + English Text */}
            <div className="flex items-start gap-2 sm:gap-3 flex-1">
              <div className="w-14 h-10 sm:w-20 sm:h-14 rounded overflow-hidden shrink-0 border border-gray-200">
                <img src="/cameroon-flag.webp" alt="Cameroon Flag" className="w-full h-full object-cover" />
              </div>
              <div className="text-[10px] sm:text-xs leading-tight text-gray-700 uppercase tracking-wide">
                <p className="font-bold">Republic of Cameroon</p>
                <p>Ministry of Secondary Education</p>
                <p>Regional Delegation for South-West</p>
                <p>Divisional Delegation of Meme</p>
              </div>
            </div>

            {/* Center - School Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center shrink-0 overflow-hidden mx-2 sm:mx-4">
              {!logoError && data.schoolLogo ? (
                <img src={data.schoolLogo} alt="School Logo" className="w-full h-full object-cover" onError={() => setLogoError(true)} />
              ) : (
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-primary">GHS</div>
                  <div className="text-[7px] sm:text-[8px] text-gray-500 leading-tight">Buea</div>
                </div>
              )}
            </div>

            {/* Right - French Text */}
            <div className="flex-1 text-right">
              <div className="text-[10px] sm:text-xs leading-tight text-gray-700 uppercase tracking-wide">
                <p className="font-bold">République du Cameroun</p>
                <p>Ministère des Enseignements Secondaires</p>
                <p>Délégation Régionale du Sud-Ouest</p>
                <p>Délégation Départementale de la Mème</p>
              </div>
            </div>
          </div>

          {/* School Name Below */}
          <div className="text-center px-4 pb-3">
            <h1 className="text-sm sm:text-lg font-bold text-primary uppercase tracking-wide">{data.schoolName}</h1>
            <p className="text-[9px] sm:text-xs text-gray-500 italic mt-0.5">&ldquo;{data.schoolMotto}&rdquo;</p>
          </div>
        </div>

        {/* Report Title */}
        <div className="border-b-2 border-primary/20 px-4 sm:px-6 py-2 sm:py-3 text-center bg-gray-50">
          <h2 className="text-sm sm:text-lg font-bold text-primary uppercase tracking-wide">
            {isFinal ? "Annual Report Card" : "Terminal Report Card"}
          </h2>
          <p className="text-[10px] sm:text-xs text-gray-500">
            Academic Year: {data.academicYear} | {data.termName} | {data.termSequenceLabel}
          </p>
        </div>

        {/* Student Info */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 border-gray-200 flex items-center justify-center bg-gray-50 shrink-0 overflow-hidden">
              {data.studentPhotoUrl ? (
                <img src={data.studentPhotoUrl} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <div className="text-2xl sm:text-3xl font-bold text-gray-400">
                  {data.studentName.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                </div>
              )}
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-1.5 text-[11px] sm:text-sm">
              <InfoItem label="Student Name" value={data.studentName} />
              <InfoItem label="Student Number" value={data.studentNumber} />
              <InfoItem label="Class" value={data.studentClass} />
              <InfoItem label="Gender" value={data.studentGender} />
              <InfoItem label="Attendance" value={`${data.attendance} / ${data.totalDays} days`} />
              <InfoItem label="Position" value={`${data.classPosition} of ${data.totalStudentsInClass}`} />
            </div>
          </div>
        </div>

        {/* Subject Results Table */}
        <div className="px-4 sm:px-6 py-3">
          <h3 className="text-xs sm:text-sm font-bold text-primary mb-2 uppercase tracking-wide">Subject Results</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] sm:text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-1 sm:p-2 border border-gray-200 font-semibold">Subject</th>
                  {isFirstTerm && (
                    <>
                      <th className="text-center p-1 sm:p-2 border border-gray-200 font-semibold">Seq 1</th>
                      <th className="text-center p-1 sm:p-2 border border-gray-200 font-semibold">Seq 2</th>
                    </>
                  )}
                  {isSecondTerm && (
                    <>
                      <th className="text-center p-1 sm:p-2 border border-gray-200 font-semibold">Seq 3</th>
                      <th className="text-center p-1 sm:p-2 border border-gray-200 font-semibold">Seq 4</th>
                    </>
                  )}
                  {isFinal && (
                    <>
                      <th className="text-center p-1 sm:p-2 border border-gray-200 font-semibold">1st Term</th>
                      <th className="text-center p-1 sm:p-2 border border-gray-200 font-semibold">2nd Term</th>
                      <th className="text-center p-1 sm:p-2 border border-gray-200 font-semibold">3rd Term</th>
                    </>
                  )}
                  <th className="text-center p-1 sm:p-2 border border-gray-200 font-semibold">Coeff</th>
                  <th className="text-center p-1 sm:p-2 border border-gray-200 font-semibold">Total</th>
                  <th className="text-center p-1 sm:p-2 border border-gray-200 font-semibold">Pos</th>
                  <th className="text-center p-1.5 sm:p-2 border border-gray-200 font-semibold">Teacher</th>
                  <th className="text-center p-1.5 sm:p-2 border border-gray-200 font-semibold">Remark</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((s, idx) => {
                  const displayScore = isFinal
                    ? s.annualTotal
                    : isFirstTerm
                    ? s.term1Total
                    : s.term2Total
                    ? s.term2Total
                    : s.annualTotal;

                  const maxScore = s.maxScore || 20;

                  return (
                    <tr key={s.subjectId} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="p-1 sm:p-2 border border-gray-200 font-medium">{s.subjectName}</td>

                      {isFirstTerm && (
                        <>
                          <td className="p-1 sm:p-2 border border-gray-200 text-center">{s.seq1Score ?? "-"}</td>
                          <td className="p-1 sm:p-2 border border-gray-200 text-center">{s.seq2Score ?? "-"}</td>
                        </>
                      )}
                      {isSecondTerm && (
                        <>
                          <td className="p-1 sm:p-2 border border-gray-200 text-center">{s.seq3Score ?? "-"}</td>
                          <td className="p-1 sm:p-2 border border-gray-200 text-center">{s.seq4Score ?? "-"}</td>
                        </>
                      )}
                      {isFinal && (
                        <>
                          <td className="p-1 sm:p-2 border border-gray-200 text-center">{s.term1Total ?? "-"}</td>
                          <td className="p-1 sm:p-2 border border-gray-200 text-center">{s.term2Total ?? "-"}</td>
                          <td className="p-1 sm:p-2 border border-gray-200 text-center">{s.term3Total ?? "-"}</td>
                        </>
                      )}

                      <td className="p-1 sm:p-2 border border-gray-200 text-center font-semibold">{s.coefficient}</td>
                      <td className="p-1 sm:p-2 border border-gray-200 text-center font-bold">
                        {displayScore ?? "-"}
                      </td>
                      <td className="p-1 sm:p-2 border border-gray-200 text-center font-bold">{s.position ?? "-"}</td>
                      <td className="p-1 sm:p-2 border border-gray-200 text-center">{s.teacherName || "-"}</td>
                      <td className="p-1 sm:p-2 border border-gray-200 text-center italic">{s.remark || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Row */}
        <div className="px-4 sm:px-6 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
            <span className="text-primary">Total Score: <span className="text-gray-800">{totalPoints}</span></span>
            <span className="text-primary">Total Coefficient: <span className="text-gray-800">{totalCoeff}</span></span>
          </div>
        </div>

        {/* Bottom Summary Boxes */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 text-center">
              <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Average /20</p>
              <p className="text-xs sm:text-sm font-bold text-primary">{averageValue}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 text-center">
              <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Total Score</p>
              <p className="text-xs sm:text-sm font-bold text-primary">{totalPoints}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 text-center">
              <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Position</p>
              <p className="text-xs sm:text-sm font-bold text-primary">{data.classPosition} / {data.totalStudentsInClass}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 text-center">
              <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Class Total</p>
              <p className="text-xs sm:text-sm font-bold text-primary">{data.totalStudentsInClass}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 text-center">
              <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Class Average</p>
              <p className="text-xs sm:text-sm font-bold text-primary">{averageValue}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 text-center">
              <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Subjects Written</p>
              <p className="text-xs sm:text-sm font-bold text-primary">{subjectsWritten}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 text-center">
              <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Number Passed</p>
              <p className="text-xs sm:text-sm font-bold text-primary">{numberPassed}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 text-center">
              <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Absence</p>
              <p className="text-xs sm:text-sm font-bold text-primary">{absences} day{absences !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {/* Teacher & Principal Remarks */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 space-y-3">
          <div>
            <h4 className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wide mb-1">Class Teacher&apos;s Remark</h4>
            <div className="p-2 sm:p-3 border border-gray-200 rounded-lg min-h-[48px] text-[10px] sm:text-xs text-gray-600 italic">
              {data.teacherComment || "No comment provided."}
            </div>
            <p className="text-[10px] text-right text-gray-400 mt-0.5">
              {data.classTeacherName || "Class Teacher"}
            </p>
          </div>
          <div>
            <h4 className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wide mb-1">Principal&apos;s Remark</h4>
            <div className="p-2 sm:p-3 border border-gray-200 rounded-lg min-h-[48px] text-[10px] sm:text-xs text-gray-600 italic">
              {data.principalComment || "No comment provided."}
            </div>
            <p className="text-[10px] text-right text-gray-400 mt-0.5">
              {data.principalName || "Principal"}
            </p>
          </div>

          {isFinal && data.promotionDecision && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-2 sm:p-3 text-center">
              <span className="text-xs sm:text-sm font-bold text-success uppercase">{data.promotionDecision}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 sm:px-6 py-2 border-t border-gray-200 text-center text-[9px] sm:text-[10px] text-gray-400">
          <p>Generated by EduGrade School Management System | {new Date(data.generatedAt).toLocaleDateString()}</p>
          <p className="mt-0.5">This is a computer-generated document. Signature not required.</p>
        </div>
      </div>
    </div>
  );
}
