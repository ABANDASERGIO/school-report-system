"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "@/types";
import { UserRole } from "@/types/enums";
import { authService } from "@/services/auth.service";
import { apiClient } from "@/lib/api-client";

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
    // Restore session by calling the backend
    const restoreSession = async () => {
      if (!apiClient.isAuthenticated()) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const me = await authService.getCurrentUser();
        setUser(me);
      } catch {
        apiClient.clearAuth();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback((userData: User, token: string) => {
    setUser(userData);
    apiClient.setToken(token);
    apiClient.setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
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
