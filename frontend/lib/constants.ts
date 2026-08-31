import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  BookCopy,
  CalendarDays,
  UserCheck,
  ClipboardList,
  Settings,
  FileText,
  ClipboardPen,
  School,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const proprietorNavItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: GraduationCap },
  { label: "Teachers", href: "/teachers", icon: Users },
  { label: "Classes", href: "/classes", icon: School },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Academic", href: "/academic/sessions", icon: CalendarDays },
  { label: "Assignments", href: "/assignments", icon: UserCheck },
  { label: "Results", href: "/results", icon: ClipboardList },
  { label: "Report Cards", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const teacherNavItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "My Classes", href: "/results/entry", icon: ClipboardPen },
  { label: "My Results", href: "/results", icon: ClipboardList },
];

export const bottomNavItems: NavItem[] = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: GraduationCap },
  { label: "Teachers", href: "/teachers", icon: Users },
  { label: "Results", href: "/results", icon: ClipboardList },
  { label: "More", href: "/settings", icon: Settings },
];

export const APP_NAME = "EduGrade";
export const APP_TAGLINE = "School Result Management System";

export const SEQUENCE_NAMES = [
  "Sequence One",
  "Sequence Two",
  "Sequence Three",
  "Sequence Four",
  "Sequence Five",
  "Sequence Six",
];

export const TERM_NAMES = [
  "First Term",
  "Second Term",
  "Third Term",
];

export const ITEMS_PER_PAGE = 10;

export const SCORE_MIN = 0;
export const SCORE_MAX = 20;
export const PASS_MARK = 10;

