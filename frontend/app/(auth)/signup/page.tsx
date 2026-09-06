"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/providers/AuthProvider";
import { showToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { UserPlus } from "lucide-react";
import type { RegisterRequest } from "@/types";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    schoolName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    authService.hasProprietor().then((exists) => {
      if (exists) {
        setIsLocked(true);
      }
    });
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      const response = await authService.registerProprietor({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        schoolName: formData.schoolName.trim() || undefined,
      });

      login(
        {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          role: response.user.role as any,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        response.accessToken
      );

      showToast({
        type: "success",
        title: "Account created!",
        message: "Your proprietor account is ready.",
      });

      router.push("/dashboard");
    } catch (err: any) {
      setErrors({ _form: err.message || "Signup failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLocked) {
    return (
      <Card className="shadow-lg">
        <CardContent>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary">{APP_NAME}</h1>
            <p className="text-sm text-gray-500 mt-1">{APP_TAGLINE}</p>
          </div>
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-4">
              A proprietor account has already been created.
            </p>
            <Button variant="primary" onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardContent>
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto mb-4 shadow-lg rounded-2xl overflow-hidden bg-white">
            <Image src="/logo.png" alt={`${APP_NAME} logo`} fill sizes="64px" className="object-contain p-1" priority />
          </div>
          <h1 className="text-2xl font-bold text-primary">Create Proprietor Account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Set up the first administrator for your school.
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors._form && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors._form}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              error={errors.firstName}
              placeholder="John"
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              error={errors.lastName}
              placeholder="Doe"
            />
          </div>

          <Input
            label="School Name"
            value={formData.schoolName}
            onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
            placeholder="e.g., Government High School Buea"
            helperText="This can be changed later in Settings."
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="you@school.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            type={showPassword ? "text" : "password"}
            placeholder="Repeat your password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
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
            Create Proprietor Account
          </Button>
        </form>

        {/* Security Note */}
     
      </CardContent>
    </Card>
  );
}
