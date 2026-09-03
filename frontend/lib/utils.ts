import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with proper conflict resolution.
 * Uses clsx for conditional classes and tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a score with 1 decimal place.
 */
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return "-";
  return score.toFixed(1);
}

/**
 * Format a date string to a human-readable format.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a date string to a shorter format.
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get initials from first and last name.
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Generate a full name from first and last name.
 */
export function getFullName(
  firstName: string,
  lastName: string
): string {
  return `${firstName} ${lastName}`;
}

/**
 * Get a color class based on result status.
 */
export function getStatusColor(
  status: string
): "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "SUBMITTED":
      return "success";
    case "DRAFT":
      return "warning";
    case "LOCKED":
      return "info";
    case "ACTIVE":
      return "success";
    case "WITHDRAWN":
      return "warning";
    case "GRADUATED":
      return "info";
    case "TRANSFERRED":
      return "warning";
    case "REPEATER":
      return "danger";
    default:
      return "info";
  }
}

/**
 * Format a status string for display.
 */
export function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Truncate text to a max length.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

