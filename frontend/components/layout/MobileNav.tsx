"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { bottomNavItems, proprietorNavItems, teacherNavItems } from "@/lib/constants";

export function MobileNav() {
  const pathname = usePathname();
  const { isProprietor } = useAuth();

  // Pick 5 key items for bottom nav
  const items = isProprietor
    ? proprietorNavItems.slice(0, 5)
    : teacherNavItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border lg:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px]",
                isActive
                  ? "text-accent"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium truncate max-w-[56px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

