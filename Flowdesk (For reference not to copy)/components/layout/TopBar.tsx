"use client";

import { usePathname, useRouter } from "next/navigation";

interface TopBarProps {
  title?: string;
  actions?: React.ReactNode;
}

export default function TopBar({ title, actions }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine default page title based on path
  const getDefaultTitle = () => {
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname.startsWith("/invoices")) return "Invoices";
    if (pathname.startsWith("/clients")) return "Clients";
    if (pathname.startsWith("/expenses")) return "Expenses";
    if (pathname.startsWith("/documents")) return "Documents";
    if (pathname.startsWith("/time")) return "Time";
    if (pathname.startsWith("/currencies")) return "Currencies";
    return "FlowDesk";
  };

  const displayTitle = title ?? getDefaultTitle();

  return (
    <header className="h-[64px] bg-surface border-b border-border px-6 flex items-center justify-between shrink-0">
      <h1 className="font-display text-[22px] text-text-primary font-normal">
        {displayTitle}
      </h1>
      <div className="flex gap-2 items-center">
        {actions ? (
          actions
        ) : (
          <>
            {pathname.startsWith("/dashboard") && (
              <>
                <button
                  onClick={() => router.push("/expenses")}
                  className="bg-transparent border border-border-strong text-text-primary text-[11px] font-medium px-3.5 py-1.5 rounded-md hover:bg-subtle transition-all duration-150"
                >
                  + Expense
                </button>
                <button
                  onClick={() => router.push("/invoices/new")}
                  className="bg-accent text-[#0C0C0E] text-[11px] font-semibold px-3.5 py-1.5 rounded-md hover:brightness-110 active:scale-[0.98] transition-all duration-150"
                >
                  + New Invoice
                </button>
              </>
            )}
            {pathname.startsWith("/invoices") && !pathname.endsWith("/new") && (
              <button
                onClick={() => router.push("/invoices/new")}
                className="bg-accent text-[#0C0C0E] text-[11px] font-semibold px-3.5 py-1.5 rounded-md hover:brightness-110 active:scale-[0.98] transition-all duration-150"
              >
                + New Invoice
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
