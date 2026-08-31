"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useAcademicYear } from "@/providers/AcademicYearProvider";
import { APP_NAME } from "@/lib/constants";
import { settingsService } from "@/services/settings.service";
import { Menu, LogOut, User, ChevronDown, CalendarDays } from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

export function Header({ onMenuToggle, title }: HeaderProps) {
  const { user, isProprietor, logout } = useAuth();
  const { activeSession, sessions, setActiveSession, isLoading } = useAcademicYear();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const [schoolName, setSchoolName] = useState("");

  useEffect(() => {
    settingsService.getSchoolName().then(setSchoolName).catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5 text-primary" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-primary truncate max-w-[200px] sm:max-w-none">
              {title || schoolName || APP_NAME}
            </h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {isProprietor && !isLoading && activeSession && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowSessionMenu(!showSessionMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-gray-50 transition-colors"
              >
                <CalendarDays className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-primary">{activeSession.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>
              {showSessionMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSessionMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-surface rounded-lg shadow-lg border border-border py-1 z-20 animate-fade-in">
                    <p className="px-4 py-2 text-xs font-medium text-gray-400 border-b border-border">Switch Academic Year</p>
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setActiveSession(session.id);
                          setShowSessionMenu(false);
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-4 py-2 text-sm transition-colors",
                          session.id === activeSession.id
                            ? "text-accent font-medium bg-accent/5"
                            : "text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <span>{session.name}</span>
                        {session.id === activeSession.id && <span className="text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="h-4 w-4 text-accent" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-primary leading-tight">
                  {isProprietor ? "Proprietor" : "Teacher"}
                </p>
                <p className="text-xs text-gray-400 leading-tight">{user?.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-surface rounded-lg shadow-lg border border-border py-1 z-20 animate-fade-in">
                  <div className="px-4 py-2 border-b border-border sm:hidden">
                    <p className="text-sm font-medium text-primary">
                      {isProprietor ? "Proprietor" : "Teacher"}
                    </p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      window.location.href = "/login";
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
