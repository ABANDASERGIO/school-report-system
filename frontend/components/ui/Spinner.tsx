import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeStyles = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2
        className={cn("animate-spin text-accent", sizeStyles[size], className)}
      />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" label="Loading..." />
    </div>
  );
}

