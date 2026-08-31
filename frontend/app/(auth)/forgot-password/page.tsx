"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import { showToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "password">("email");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your registered email.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await authService.findUserByEmail(email.trim());
      if (!user) {
        setError("No account found with that email.");
        return;
      }
      if (user.role !== "PROPRIETOR") {
        setError("This recovery page is for proprietor accounts only.");
        return;
      }
      setResetStep("password");
      setError("");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPasswordByEmail(email.trim(), password);
      setSuccess(true);
      showToast({
        type: "success",
        title: "Password reset successful",
        message: "You can now log in with your new password.",
      });
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardContent>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary">{APP_NAME}</h1>
          <p className="text-sm text-gray-500 mt-1">{APP_TAGLINE}</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-sm text-green-700 font-medium">Password has been reset.</p>
              <p className="text-xs text-green-600 mt-1">You can now sign in with your new password.</p>
            </div>
            <Button variant="primary" size="lg" fullWidth onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={resetStep === "email" ? handleEmailSubmit : handlePasswordSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {resetStep === "email" ? (
              <>
                <p className="text-xs text-gray-500 text-center">
                  Enter the email used for the proprietor account. We&apos;ll let you set a new password if it matches.
                </p>
                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="proprietor@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  autoComplete="email"
                />
                <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
                  Continue
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500 text-center">
                  Account found: <span className="font-medium">{email}</span>
                </p>
                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                  autoComplete="new-password"
                />
                <Input
                  label="Confirm Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                  autoComplete="new-password"
                />
                <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
                  Reset Password
                </Button>
              </>
            )}
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Remember your password?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
