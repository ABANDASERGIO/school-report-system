"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full h-11 px-4 pr-10 bg-white border border-border rounded-lg text-sm text-primary appearance-none",
              "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
              "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
              "transition-all duration-150",
              error && "border-danger focus:ring-danger/30 focus:border-danger",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

