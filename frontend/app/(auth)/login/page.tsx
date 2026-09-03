"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/providers/AuthProvider";
import { showToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSignupLink, setShowSignupLink] = useState(false);

  useEffect(() => {
    authService.hasProprietor().then((exists) => {
      setShowSignupLink(!exists);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });

      // Fetch user details and set auth context
      login(
        {
          id: response.user.id,
          email: response.user.email,
          role: response.user.role as any,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        response.accessToken
      );

      showToast({
        type: "success",
        title: "Welcome back!",
        message: "You have been logged in successfully.",
      });

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardContent>
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto mb-4 shadow-lg rounded-2xl overflow-hidden bg-white">
            <Image src="/logo.png" alt={`${APP_NAME} logo`} fill sizes="64px" className="object-contain p-1" priority />
          </div>
          <h1 className="text-2xl font-bold text-primary">{APP_NAME}</h1>
          <p className="text-sm text-gray-500 mt-1">{APP_TAGLINE}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="you@school.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
            autoComplete="email"
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
          >
            Sign In
          </Button>

          <div className="text-center">
            <Link href="/forgot-password" className="text-xs text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
        </form>

        {showSignupLink && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              No proprietor account yet?{" "}
              <Link href="/signup" className="text-accent hover:underline">
                Create one here
              </Link>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

