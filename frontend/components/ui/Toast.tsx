"use client";

import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Global toast state
let addToastFn: ((toast: Omit<ToastData, "id">) => void) | null = null;

export function showToast(toast: Omit<ToastData, "id">) {
  if (addToastFn) {
    addToastFn(toast);
  }
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap: Record<ToastType, string> = {
  success: "border-l-4 border-emerald-500 bg-emerald-50",
  error: "border-l-4 border-red-500 bg-red-50",
  warning: "border-l-4 border-amber-500 bg-amber-50",
  info: "border-l-4 border-blue-500 bg-blue-50",
};

const iconColorMap: Record<ToastType, string> = {
  success: "text-emerald-500",
  error: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, toasts[0].duration || 4000);
    return () => clearTimeout(timer);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full animate-fade-in">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              "relative flex items-start gap-3 p-4 rounded-lg shadow-lg",
              "animate-slide-in-right",
              colorMap[toast.type]
            )}
          >
            <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", iconColorMap[toast.type])} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
              {toast.message && (
                <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

