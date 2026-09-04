import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import { OnlineSyncProvider } from "@/providers/OnlineSyncProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduGrade - School Result Management System",
  description:
    "A modern, mobile-first school result management system for secondary schools.",
  keywords: ["school", "results", "grades", "management", "education"],
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: { url: "/favicon.ico", sizes: "any" },
    apple: { url: "/apple-icon.png", type: "image/png" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-primary font-sans">
        <AuthProvider>
          <OnlineSyncProvider>
            {children}
          </OnlineSyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
