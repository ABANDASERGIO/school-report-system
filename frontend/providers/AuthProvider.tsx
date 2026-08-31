"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "@/types";
import { UserRole } from "@/types/enums";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProprietor: boolean;
  isTeacher: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const stored = localStorage.getItem("edugrade_user");
    const token = localStorage.getItem("edugrade_token");
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("edugrade_user");
        localStorage.removeItem("edugrade_token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem("edugrade_user", JSON.stringify(userData));
    localStorage.setItem("edugrade_token", token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("edugrade_user");
    localStorage.removeItem("edugrade_token");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isProprietor: user?.role === UserRole.PROPRIETOR,
        isTeacher: user?.role === UserRole.TEACHER,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

