"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { subjectService } from "@/services/subject.service";
import { classService } from "@/services/class.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import type { Subject, Class } from "@/types";
import { ArrowLeft, BookOpen, BookCopy, School, CheckCircle2 } from "lucide-react";

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [offeredClassIds, setOfferedClassIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [subjectData, classesData] = await Promise.all([
          subjectService.getSubjectById(params.id as string),
          classService.getClasses(),
        ]);
        if (subjectData) {
          setSubject(subjectData);
          const classIds = await subjectService.getClassIdsForSubject(subjectData.id);
          setOfferedClassIds(classIds);
        }
        setAllClasses(classesData);
      } catch (error) {
        console.error("Failed to load subject:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (isLoading) return <PageSpinner />;
  if (!subject) return <div className="text-center py-12 text-gray-500">Subject not found</div>;

  const offeredClasses = allClasses.filter((c) => offeredClassIds.includes(c.id));

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push("/subjects")}>Back to Subjects</Button>
      <Card>
        <CardHeader title={subject.name} description={`Code: ${subject.code}`} />
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <BookCopy className="h-5 w-5 text-accent" />
              <div>
                <p className="text-xs text-gray-500">Coefficient</p>
                <p className="text-sm font-medium text-primary">{subject.coefficient}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">{subject.description || "No description provided."}</p>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                <School className="h-4 w-4 text-accent" />
                Offered In ({offeredClasses.length} classes)
              </h4>
              {offeredClasses.length === 0 ? (
                <p className="text-sm text-gray-400">Not offered in any class yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {offeredClasses.map((cls) => (
                    <div key={cls.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm text-primary">{cls.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
