"use client";

import { useEffect, useState } from "react";
import { Invoice } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Search, Loader2, Download, Mail, CheckCircle, Copy, Trash2 } from "lucide-react";

type FilterStatus = "all" | "draft" | "sent" | "paid" | "overdue";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-success/10 text-success",
  overdue: "bg-danger/10 text-danger",
  pending: "bg-warning/10 text-warning",
  sent: "bg-info/10 text-info",
  draft: "bg-subtle text-text-secondary",
  cancelled: "bg-subtle text-text-tertiary",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices");
      if (res.ok) setInvoices(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleMarkPaid = async (invoice: Invoice) => {
    await fetch(`/api/invoices/${invoice.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    fetchInvoices();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/invoices/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    fetchInvoices();
  };

  const filtered = invoices.filter(inv => {
    const matchSearch =
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.client?.name && inv.client.name.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "all" || inv.status === filter;
    return matchSearch && matchFilter;
  });

  const FILTERS: { key: FilterStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "draft", label: "Draft" },
    { key: "sent", label: "Sent" },
    { key: "paid", label: "Paid" },
    { key: "overdue", label: "Overdue" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Topbar Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search invoice # or client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface border border-border focus:border-border-accent rounded-md pl-9 pr-3 py-2.5 text-xs text-text-primary placeholder:text-text-tertiary outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex gap-0.5 bg-subtle p-1 rounded-md">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${filter === f.key ? "bg-elevated text-text-primary" : "text-text-secondary hover:text-text-primary"}`}>
                {f.label}
              </button>
            ))}
          </div>
          <Link href="/invoices/new"
            className="bg-accent text-[#0C0C0E] text-[11px] font-semibold px-4 py-2.5 rounded-md hover:brightness-110 active:scale-[0.98] transition-all whitespace-nowrap">
            + New Invoice
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-12 h-12 bg-subtle rounded-lg flex items-center justify-center text-[18px]">📄</div>
            <p className="text-sm text-text-primary font-medium">No invoices found</p>
            <p className="text-xs text-text-secondary">Create your first invoice to start tracking billing.</p>
            <Link href="/invoices/new" className="mt-1 bg-accent text-[#0C0C0E] text-[11px] font-semibold px-4 py-2 rounded-md hover:brightness-110 transition-all">
              + New Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Invoice #", "Client", "Issue Date", "Due Date", "Amount", "Status", "Actions"].map(h => (
                    <th key={h} className={`text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-4 py-3 ${h === "Amount" ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-subtle/40 transition-colors group">
                    <td className="px-4 py-3.5">
                      <Link href={`/invoices/${inv.id}`} className="font-mono text-xs text-accent hover:underline">{inv.invoice_number}</Link>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-text-primary">{inv.client?.name || "—"}</td>
                    <td className="px-4 py-3.5 text-xs text-text-secondary">{formatDate(inv.issue_date)}</td>
                    <td className="px-4 py-3.5 text-xs text-text-secondary">{formatDate(inv.due_date)}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs text-text-primary">{formatCurrency(Number(inv.total), inv.currency)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[inv.status] || STATUS_STYLES.draft}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/invoices/${inv.id}`} className="p-1.5 rounded-md hover:bg-subtle text-text-secondary hover:text-text-primary transition-colors" title="View">
                          <Download className="w-3.5 h-3.5" />
                        </Link>
                        {inv.status !== "paid" && (
                          <button onClick={() => handleMarkPaid(inv)} title="Mark Paid"
                            className="p-1.5 rounded-md hover:bg-success/10 text-text-secondary hover:text-success transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setDeleteTarget(inv)} title="Delete"
                          className="p-1.5 rounded-md hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-elevated border border-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-display text-[18px] text-text-primary mb-2">Delete Invoice</h3>
            <p className="text-sm text-text-secondary mb-5">
              Delete <strong className="font-mono text-text-primary">{deleteTarget.invoice_number}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="border border-border-strong text-text-primary text-[11px] font-semibold px-4 py-2 rounded-md hover:bg-subtle transition-all">Cancel</button>
              <button onClick={handleDelete} className="bg-danger/10 border border-danger/30 text-danger text-[11px] font-semibold px-4 py-2 rounded-md hover:bg-danger/20 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
