import type { Metadata } from "next";
import { DM_Serif_Display, DM_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import AppShell from "@/components/layout/AppShell";

const serif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "FlowDesk — Zero-Cost Business OS",
  description: "A fast, beautiful, self-hosted OS for your solo business. CRM, Invoicing, Time Tracking, Expenses, and multi-currency support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-base text-text-primary antialiased font-sans",
          serif.variable,
          mono.variable,
          sans.variable
        )}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
