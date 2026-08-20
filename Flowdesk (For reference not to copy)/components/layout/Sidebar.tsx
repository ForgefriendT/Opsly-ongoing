"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  FilePen,
  Clock,
  Globe,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Expenses", href: "/expenses", icon: CreditCard },
  { label: "Documents", href: "/documents", icon: FilePen },
  { label: "Time", href: "/time", icon: Clock },
  { label: "Currencies", href: "/currencies", icon: Globe },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] h-screen bg-surface border-r border-border p-5 flex flex-col shrink-0">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-2 pb-6 pt-1">
        <div className="w-[32px] h-[32px] bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center text-accent">
          <Layers className="w-5 h-5" />
        </div>
        <span className="font-display text-[16px] text-text-primary tracking-wide font-semibold">
          Webyte Designs
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 flex flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 text-sm font-medium",
                isActive
                  ? "bg-accent-glow border border-border-accent text-accent"
                  : "text-text-secondary hover:text-text-primary hover:bg-subtle"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Version Info */}
      <div className="pt-3 border-t border-border mt-auto">
        <div className="px-3 py-1.5 text-[10px] text-text-tertiary font-medium uppercase tracking-wider font-mono">
          v0.1.0 · personal
        </div>
      </div>
    </aside>
  );
}
