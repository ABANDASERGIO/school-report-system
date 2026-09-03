"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  isLoading?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  isLoading = false,
  className,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <div className="space-y-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)} hover>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <div className="text-accent">{icon}</div>
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trend.isUp ? "text-success" : "text-danger"
            )}
          >
            {trend.isUp ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-primary">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{title}</p>
      </div>
    </Card>
  );
}

