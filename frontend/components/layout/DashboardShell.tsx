"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { ToastContainer } from "@/components/ui/Toast";

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardShell({ children, title }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - Desktop only */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title={title}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}

