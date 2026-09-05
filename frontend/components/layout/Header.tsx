"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useAcademicYear } from "@/providers/AcademicYearProvider";
import { useOnlineSync } from "@/providers/OnlineSyncProvider";
import { APP_NAME } from "@/lib/constants";
import { settingsService } from "@/services/settings.service";
import { notificationService, type Notification } from "@/services/notification.service";
import { Menu, LogOut, User, ChevronDown, CalendarDays, Bell, Check, CheckCheck, WifiOff } from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

export function Header({ onMenuToggle, title }: HeaderProps) {
  const router = useRouter();
  const { user, isProprietor, logout } = useAuth();
  const { activeSession, sessions, setActiveSession, isLoading } = useAcademicYear();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    settingsService.getSchoolName().then(setSchoolName).catch(() => {});
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        notificationService.getNotifications(false),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      // Silent: the bell just shows an empty list
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshNotifications();
    // Poll every 60s for new notifications
    const t = setInterval(refreshNotifications, 60_000);
    return () => clearInterval(t);
  }, [user, refreshNotifications]);

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      try {
        await notificationService.markRead(n.id);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    if (n.link) {
      setShowNotifications(false);
      router.push(n.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

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

          {/* Sync Status Pill */}
          <SyncStatusPill />

          {/* User Menu */}
          {user && (
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-80 sm:w-96 bg-surface rounded-lg shadow-lg border border-border z-20 animate-fade-in overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold text-primary">Notifications</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-accent hover:underline flex items-center gap-1"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-400">
                          No notifications
                        </div>
                      ) : (
                        notifications.slice(0, 20).map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={cn(
                              "w-full text-left px-4 py-3 border-b border-border last:border-b-0 transition-colors hover:bg-gray-50",
                              !n.read && "bg-accent/5"
                            )}
                          >
                            <div className="flex items-start gap-2">
                              {!n.read && (
                                <span className="mt-1.5 w-2 h-2 rounded-full bg-accent shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={cn("text-sm", !n.read ? "font-semibold text-primary" : "text-gray-700")}>
                                  {n.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {new Date(n.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    {isProprietor && (
                      <div className="border-t border-border px-4 py-2 text-center">
                        <Link
                          href="/admin/audit"
                          className="text-xs text-accent hover:underline"
                          onClick={() => setShowNotifications(false)}
                        >
                          View audit log
                        </Link>
                      </div>
                    )}
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

function SyncStatusPill() {
  const { online, syncing, pendingSyncs } = useOnlineSync();

  if (online && pendingSyncs === 0) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[11px] font-medium border border-green-200">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Online
      </span>
    );
  }

  if (!online) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200">
        <WifiOff className="h-3 w-3" />
        Offline
        {pendingSyncs > 0 && <span className="ml-1 font-semibold">· {pendingSyncs} pending</span>}
      </span>
    );
  }

  return (
    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-200">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      {syncing ? 'Syncing...' : `${pendingSyncs} pending`}
    </span>
  );
}
