import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Vortex AI — Your AI-Powered Fitness Coach",
  description: "Transform your fitness journey with Vortex AI. AI-powered calorie tracking, personalized workout plans, smart meal planning, and an intelligent fitness coach — all in one premium platform.",
  keywords: "fitness, AI, calorie tracker, workout planner, meal planner, BMI calculator, fitness coach",
  other: {
    "google-adsense-account": "ca-pub-4207181866314383",
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
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
