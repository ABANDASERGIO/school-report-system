"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-light active:bg-primary-dark focus:ring-2 focus:ring-primary/30",
  secondary:
    "bg-white text-primary border border-border hover:bg-gray-50 active:bg-gray-100 focus:ring-2 focus:ring-border",
  destructive:
    "bg-danger text-white hover:bg-red-600 active:bg-red-700 focus:ring-2 focus:ring-danger/30",
  ghost:
    "bg-transparent text-primary hover:bg-gray-100 active:bg-gray-200",
  outline:
    "bg-transparent text-primary border border-primary hover:bg-primary hover:text-white active:bg-primary-dark",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150",
        "focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
        "min-h-[44px]",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}

