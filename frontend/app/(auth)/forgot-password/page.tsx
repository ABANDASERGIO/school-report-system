"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authService } from "@/services/auth.service";
import { showToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { Mail, Lock, ShieldCheck, ArrowLeft, RotateCw } from "lucide-react";

type Step = "email" | "code" | "password" | "done";

const RESEND_COOLDOWN_SECONDS = 30;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>(undefined);
  const [resendIn, setResendIn] = useState(0);

  // Auto-fill the code in dev when the server returns it (no SMTP).
  // Keeps the local recovery flow testable without an inbox.
  useEffect(() => {
    if (devCode) setCode(devCode);
  }, [devCode]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const codeInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (step === "code") codeInputRef.current?.focus();
  }, [step]);

  const sendCode = async (resend = false) => {
    setError("");
    if (!email.trim()) {
      setError("Please enter your registered email.");
      return false;
    }
    setIsLoading(true);
    try {
      const res = await authService.requestCode(email.trim(), "FORGOT_PASSWORD");
      setDevCode(res.devCode);
      if (!resend) setStep("code");
      setResendIn(RESEND_COOLDOWN_SECONDS);
      showToast({
        type: "success",
        title: res.devCode ? "Dev code ready" : "Code sent",
        message: res.devCode
          ? `Dev code: ${res.devCode} (no SMTP configured)`
          : `Check ${email.trim()} for a 6-digit code.`,
      });
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to send verification code.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendCode(false);
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setIsLoading(true);
    try {
      const ok = await authService.verifyCode(email.trim(), code, "FORGOT_PASSWORD");
      if (!ok) {
        setError("Invalid or expired code. Please try again.");
        return;
      }
      setStep("password");
    } catch (err: any) {
      setError(err.message || "Invalid code.");
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
      await authService.resetPasswordByCode(email.trim(), code, password);
      setStep("done");
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

  const stepTitle: Record<Step, string> = {
    email: "Recover your account",
    code: "Enter verification code",
    password: "Set a new password",
    done: "All set!",
  };

  return (
    <Card className="shadow-lg">
      <CardContent>
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto mb-4 shadow-lg rounded-2xl overflow-hidden bg-white">
            <Image src="/logo.png" alt={`${APP_NAME} logo`} fill sizes="64px" className="object-contain p-1" priority />
          </div>
          <h1 className="text-2xl font-bold text-primary">{APP_NAME}</h1>
          <p className="text-sm text-gray-500 mt-1">{APP_TAGLINE}</p>
        </div>

        <h2 className="text-base font-semibold text-gray-800 mb-1 text-center">
          {stepTitle[step]}
        </h2>
        <p className="text-xs text-gray-500 mb-6 text-center">
          {step === "email" && "Enter the email for the proprietor account."}
          {step === "code" && (
            <>We sent a 6-digit code to <span className="font-medium">{email}</span></>
          )}
          {step === "password" && "Choose a new password for your account."}
          {step === "done" && "Your password has been updated."}
        </p>

        {step === "done" ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-sm text-green-700 font-medium">
                Password has been reset.
              </p>
              <p className="text-xs text-green-600 mt-1">
                You can now sign in with your new password.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push("/login")}
            >
              Go to Login
            </Button>
          </div>
        ) : (
          <form
            onSubmit={
              step === "email"
                ? handleEmailSubmit
                : step === "code"
                ? handleCodeSubmit
                : handlePasswordSubmit
            }
            className="space-y-4"
          >
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {step === "email" && (
              <>
                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="proprietor@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  autoComplete="email"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                >
                  Send verification code
                </Button>
              </>
            )}

            {step === "code" && (
              <>
                <Input
                  ref={codeInputRef as any}
                  label="Verification Code"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  leftIcon={<ShieldCheck className="h-4 w-4" />}
                />
                {devCode && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
                    Dev mode (no SMTP): your code is <span className="font-mono font-semibold">{devCode}</span>
                  </p>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                >
                  Verify code
                </Button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
                    onClick={() => setStep("email")}
                  >
                    <ArrowLeft className="h-3 w-3" /> Change email
                  </button>
                  <button
                    type="button"
                    disabled={resendIn > 0 || isLoading}
                    onClick={() => sendCode(true)}
                    className="text-accent hover:underline disabled:text-gray-400 disabled:no-underline inline-flex items-center gap-1"
                  >
                    <RotateCw className="h-3 w-3" />
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                  </button>
                </div>
              </>
            )}

            {step === "password" && (
              <>
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-gray-600">Show passwords</span>
                </label>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                >
                  Reset password
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
