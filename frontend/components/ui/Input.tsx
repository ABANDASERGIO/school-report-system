"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-11 px-4 bg-white border border-border rounded-lg text-sm text-primary",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
              "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
              "transition-all duration-150",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-danger focus:ring-danger/30 focus:border-danger",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-gray-400 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

