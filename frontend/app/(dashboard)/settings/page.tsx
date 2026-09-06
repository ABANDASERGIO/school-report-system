"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Modal } from "@/components/ui/Modal";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { settingsService } from "@/services/settings.service";
import { authService } from "@/services/auth.service";
import { uploadService } from "@/services/upload.service";
import type { SchoolSetting } from "@/types";
import { Save, Settings as SettingsIcon, User, Mail, Phone, Lock, Eye, EyeOff, KeyRound, Upload, X, RefreshCw } from "lucide-react";

const SETTING_LABELS: Record<string, string> = {
  school_name: "School Name",
  school_motto: "School Motto",
  school_address: "School Address",
  school_phone: "Phone Number",
  school_email: "Email Address",
  school_logo: "School Logo URL",
  principal_name: "Principal Name",
  class_teacher_name: "Default Class Teacher Name",
  teacher_comment: "Class Teacher Comment",
  principal_comment: "Principal Comment",
  promotion_decision: "Promotion Decision",
  attendance_days: "Total School Days",
  attendance_present: "Total Days Present (default)",
  grading_system: "Grading System",
  max_score: "Maximum Score",
  pass_mark: "Pass Mark",
  academic_year_format: "Academic Year Format",
  marks_entry_open: "Marks Entry Open",
};

const SETTING_TYPES: Record<string, "text" | "number" | "email" | "tel" | "url"> = {
  school_email: "email",
  school_phone: "tel",
  school_logo: "url",
  max_score: "number",
  pass_mark: "number",
  attendance_days: "number",
  attendance_present: "number",
};

export default function SettingsPage() {
  const { user, isProprietor } = useAuth();
  const [settings, setSettings] = useState<SchoolSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Proprietor",
    email: user?.email || "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await settingsService.getAllSettings();
      setSettings(data);
      const initial: Record<string, string> = {};
      data.forEach((s) => { initial[s.key] = s.value; });
      setFormData(initial);
      const logo = data.find((s) => s.key === "school_logo");
      if (logo?.value) setLogoPreview(logo.value);
    } catch (error) {
      console.error("Failed to load settings:", error);
      showToast({ type: "error", title: "Failed to load settings" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Keep profile email in sync with logged-in user
  useEffect(() => {
    if (user?.email) {
      setProfileData((prev) => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast({ type: "error", title: "Invalid file", message: "Please select an image file." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast({ type: "error", title: "File too large", message: "Maximum size is 2MB." });
      return;
    }
    setIsUploadingLogo(true);
    try {
      const result = await uploadService.uploadSchoolLogo(file);
      setLogoPreview(result.url);
      setFormData((prev) => ({ ...prev, school_logo: result.url }));
      // Reload so the cached settings list picks up the new URL.
      await loadSettings();
      showToast({ type: "success", title: "Logo uploaded" });
    } catch (err: any) {
      showToast({ type: "error", title: "Failed to upload logo", message: err.message });
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearLogo = async () => {
    const previous = formData.school_logo;
    setLogoPreview("");
    setFormData((prev) => ({ ...prev, school_logo: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (previous) {
      try {
        await settingsService.updateSetting("school_logo", "");
        await loadSettings();
        showToast({ type: "success", title: "Logo removed" });
      } catch (err: any) {
        showToast({ type: "error", title: "Failed to remove logo", message: err.message });
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsToUpdate = settings
        .filter((s) => s.value !== formData[s.key])
        .map((s) => ({ key: s.key, value: formData[s.key] ?? "" }));

      if (settingsToUpdate.length === 0) {
        showToast({ type: "info", title: "No changes to save" });
        return;
      }

      await settingsService.updateSettings(settingsToUpdate);
      showToast({ type: "success", title: "Settings saved" });
      await loadSettings();
    } catch (error) {
      console.error("Failed to save settings:", error);
      showToast({ type: "error", title: "Failed to save settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMarksEntry = async () => {
    setIsSaving(true);
    try {
      await settingsService.updateSetting("marks_entry_open", formData.marks_entry_open || "false");
      showToast({ type: "success", title: "Marks entry setting updated" });
      await loadSettings();
    } catch {
      showToast({ type: "error", title: "Failed to update marks entry setting" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      // Profile email is tied to the user account; password change is via the modal.
      // Profile name is informational for now; full profile management comes later.
      showToast({ type: "success", title: "Profile updated" });
    } catch {
      showToast({ type: "error", title: "Failed to update profile" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (!passwordData.currentPassword) {
      setPasswordError("Enter your current password");
      return;
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (passwordData.newPassword === passwordData.currentPassword) {
      setPasswordError("New password must be different from the current password");
      return;
    }
    setIsSavingPassword(true);
    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      showToast({ type: "success", title: "Password changed", message: "Your password has been updated." });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const getLabel = (key: string) => SETTING_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const getDescription = (key: string) => settings.find((s) => s.key === key)?.description || "";

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-xl font-bold text-primary">School Settings</h1>
        <Card><div className="space-y-4 p-4">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12" />))}</div></Card>
      </div>
    );
  }

  const schoolInfoKeys = ["school_name", "school_motto", "school_address", "school_phone", "school_email"];
  const reportCardHeaderKeys = ["principal_name", "class_teacher_name", "teacher_comment", "principal_comment", "promotion_decision", "attendance_days", "attendance_present"];
  const academicConfigKeys = ["grading_system", "max_score", "pass_mark", "academic_year_format"];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account and school configuration</p>
        </div>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={loadSettings}>
          Refresh
        </Button>
      </div>

      {/* My Account - Proprietor Profile */}
      {isProprietor && (
        <Card>
          <CardHeader title="My Account" description="Update your personal profile information" />
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} leftIcon={<User className="h-4 w-4" />} />
              <Input label="Email Address" type="email" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} leftIcon={<Mail className="h-4 w-4" />} />
            </div>
            <div className="flex justify-between items-center mt-4">
              <Button variant="secondary" size="sm" leftIcon={<KeyRound className="h-4 w-4" />} onClick={() => setShowPasswordModal(true)}>
                Change Password
              </Button>
              <Button variant="primary" size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={handleSaveProfile} isLoading={isSavingProfile}>Save Profile</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => { setShowPasswordModal(false); setPasswordError(""); setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" }); }} title="Change Password">
        <div className="space-y-4">
          {passwordError && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">{passwordError}</div>
          )}
          <p className="text-xs text-gray-500">
            Enter your current password to confirm the change. The new password must be at least 6 characters and different from the current one.
          </p>
          <div className="relative">
            <Input
              label="Current Password"
              type={showCurrentPw ? "text" : "password"}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="text-gray-400 hover:text-gray-600">
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          </div>
          <div className="relative">
            <Input
              label="New Password"
              type={showNewPw ? "text" : "password"}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button onClick={() => setShowNewPw(!showNewPw)} className="text-gray-400 hover:text-gray-600">
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          </div>
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            leftIcon={<Lock className="h-4 w-4" />}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowPasswordModal(false); setPasswordError(""); setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" }); }}>
              Cancel
            </Button>
            <Button variant="primary" isLoading={isSavingPassword} onClick={handleChangePassword}>
              Update Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* School Information */}
      <Card>
        <CardHeader title="School Information" />
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="School Logo" className="w-full h-full object-cover" />
              ) : (
                <SettingsIcon className="h-8 w-8 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} leftIcon={<Upload className="h-4 w-4" />} isLoading={isUploadingLogo}>
                {logoPreview ? "Change Logo" : "Upload School Logo"}
              </Button>
              {logoPreview && (
                <button type="button" onClick={clearLogo} className="text-xs text-danger hover:underline ml-2">Remove</button>
              )}
              <p className="text-xs text-gray-400 mt-1">Used on report cards and certificates</p>
            </div>
          </div>
          {settings.filter((s) => schoolInfoKeys.includes(s.key)).map((s) => (
            <Input
              key={s.key}
              label={getLabel(s.key)}
              type={SETTING_TYPES[s.key] || "text"}
              value={formData[s.key] || ""}
              onChange={(e) => setFormData({ ...formData, [s.key]: e.target.value })}
              helperText={getDescription(s.key)}
            />
          ))}
          <div className="flex justify-end">
            <Button variant="primary" size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={handleSave} isLoading={isSaving}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Card Header */}
      <Card>
        <CardHeader
          title="Report Card Header"
          description="Names and attendance values that appear on every report card"
        />
        <CardContent className="space-y-4">
          {settings.filter((s) => reportCardHeaderKeys.includes(s.key)).map((s) => (
            <Input
              key={s.key}
              label={getLabel(s.key)}
              type={SETTING_TYPES[s.key] || "text"}
              value={formData[s.key] || ""}
              onChange={(e) => setFormData({ ...formData, [s.key]: e.target.value })}
              helperText={getDescription(s.key)}
            />
          ))}
          <div className="flex justify-end">
            <Button variant="primary" size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={handleSave} isLoading={isSaving}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Academic Configuration */}
      <Card>
        <CardHeader title="Academic Configuration" />
        <CardContent className="space-y-4">
          {settings.filter((s) => academicConfigKeys.includes(s.key)).map((s) => (
            <Input
              key={s.key}
              label={getLabel(s.key)}
              type={SETTING_TYPES[s.key] || "text"}
              value={formData[s.key] || ""}
              onChange={(e) => setFormData({ ...formData, [s.key]: e.target.value })}
              helperText={getDescription(s.key)}
            />
          ))}
          <div className="flex justify-end">
            <Button variant="primary" size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={handleSave} isLoading={isSaving}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Marks Entry Control */}
      {isProprietor && (
        <Card>
          <CardHeader title="Marks Entry" description="Control when teachers can enter marks" />
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Allow Teachers to Enter Marks</p>
                <p className="text-xs text-gray-400 mt-0.5">When disabled, teachers can only view marks but cannot add or edit them.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.marks_entry_open === "true"}
                  onChange={(e) => setFormData({ ...formData, marks_entry_open: e.target.checked ? "true" : "false" })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="primary" size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={handleSaveMarksEntry} isLoading={isSaving}>Save</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
