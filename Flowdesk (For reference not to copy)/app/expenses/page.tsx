"use client";

import { useEffect, useState } from "react";
import { Expense, ExpenseCategory } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Loader2, X } from "lucide-react";

const CATEGORY_STYLES: Record<string, { badge: string; pill: string }> = {
  software:  { badge: "bg-info/10 text-info",     pill: "border-info/30 text-info" },
  travel:    { badge: "bg-warning/10 text-warning", pill: "border-warning/30 text-warning" },
  marketing: { badge: "bg-accent/10 text-accent",  pill: "border-accent/30 text-accent" },
  equipment: { badge: "bg-subtle text-text-secondary", pill: "border-border text-text-secondary" },
  other:     { badge: "bg-subtle text-text-tertiary", pill: "border-border text-text-tertiary" },
};

const expenseFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().default("INR"),
  category: z.enum(["software", "travel", "marketing", "equipment", "other"]).default("other"),
  date: z.string(),
  notes: z.string().optional(),
});

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: "", amount: 0, currency: "INR", category: "other" as ExpenseCategory,
      date: new Date().toISOString().split("T")[0], notes: "",
    },
  });

  const fetchExpenses = async () => {
    setLoading(true);
    const res = await fetch("/api/expenses");
    if (res.ok) setExpenses(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const onSubmit = async (data: any) => {
    const res = await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { setShowForm(false); reset(); fetchExpenses(); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/expenses/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    fetchExpenses();
  };

  const filtered = activeCategory === "all"
    ? expenses
    : expenses.filter(e => e.category === activeCategory);

  // Monthly summary
  const now = new Date();
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Category breakdown
  const categoryTotals = (["software", "travel", "marketing", "equipment", "other"] as ExpenseCategory[]).map(cat => ({
    cat,
    total: thisMonthExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + Number(e.amount), 0),
  })).filter(c => c.total > 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">This Month</p>
          <p className="font-mono text-xl font-medium text-danger">{formatCurrency(thisMonthTotal, "INR")}</p>
          <p className="text-xs text-text-secondary mt-1">{thisMonthExpenses.length} expenses logged</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Top Category</p>
          <p className="font-mono text-xl font-medium text-text-primary capitalize">
            {categoryTotals.sort((a, b) => b.total - a.total)[0]?.cat || "—"}
          </p>
          <p className="text-xs text-text-secondary mt-1">{formatCurrency(categoryTotals.sort((a, b) => b.total - a.total)[0]?.total || 0, "INR")}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">All Expenses</p>
          <p className="font-mono text-xl font-medium text-text-primary">{expenses.length}</p>
          <p className="text-xs text-text-secondary mt-1">Total entries</p>
        </div>
      </div>

      {/* Category Pills + Add Button */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setActiveCategory("all")}
            className={`text-[10px] px-3 py-1 rounded-full border transition-all ${activeCategory === "all" ? "bg-elevated border-border-accent text-accent" : "border-border text-text-secondary hover:text-text-primary"}`}>
            All categories
          </button>
          {(["software", "travel", "marketing", "equipment", "other"] as ExpenseCategory[]).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`text-[10px] px-3 py-1 rounded-full border transition-all capitalize ${
                activeCategory === cat
                  ? `${CATEGORY_STYLES[cat].badge} border-current`
                  : "border-border text-text-secondary hover:text-text-primary"
              }`}>
              {cat}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-accent text-[#0C0C0E] text-[11px] font-semibold px-4 py-2 rounded-md hover:brightness-110 active:scale-[0.98] transition-all">
          + Add Expense
        </button>
      </div>

      {/* Expense Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-14"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-14 gap-3">
            <div className="w-11 h-11 bg-subtle rounded-lg flex items-center justify-center text-lg">💸</div>
            <p className="text-sm text-text-primary font-medium">No expenses recorded</p>
            <p className="text-xs text-text-secondary">Start tracking your business expenses for tax deductions.</p>
            <button onClick={() => setShowForm(true)} className="mt-1 bg-accent text-[#0C0C0E] text-[11px] font-semibold px-4 py-2 rounded-md hover:brightness-110 transition-all">+ Add Expense</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Description", "Category", "Date", "Notes", "Amount", ""].map(h => (
                    <th key={h} className={`text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-4 py-3 ${h === "Amount" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(expense => (
                  <tr key={expense.id} className="border-b border-border last:border-0 hover:bg-subtle/40 transition-colors group">
                    <td className="px-4 py-3.5 text-xs font-medium text-text-primary">{expense.description}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize ${CATEGORY_STYLES[expense.category]?.badge || CATEGORY_STYLES.other.badge}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-text-secondary">{formatDate(expense.date)}</td>
                    <td className="px-4 py-3.5 text-xs text-text-secondary max-w-[180px] truncate">{expense.notes || "—"}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs text-danger">−{formatCurrency(Number(expense.amount), expense.currency)}</td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => setDeleteTarget(expense)} className="p-1.5 opacity-0 group-hover:opacity-100 rounded-md hover:bg-danger/10 text-text-secondary hover:text-danger transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Slide-In Panel */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-elevated border border-border rounded-t-2xl sm:rounded-xl w-full max-w-md animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h2 className="font-display text-[18px] text-text-primary">New Expense</h2>
              <button onClick={() => { setShowForm(false); reset(); }} className="text-text-secondary hover:text-text-primary transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Description *</label>
                <input {...register("description")} placeholder="Figma Pro annual subscription"
                  className={`w-full bg-subtle border ${errors.description ? "border-danger" : "border-border"} focus:border-border-accent rounded-md px-3 py-2 text-sm text-text-primary outline-none transition-colors`} />
                {errors.description && <p className="text-[10px] text-danger mt-1">{errors.description.message as string}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Amount *</label>
                  <input type="number" step="0.01" min="0" {...register("amount")} placeholder="5600"
                    className={`w-full bg-subtle border ${errors.amount ? "border-danger" : "border-border"} focus:border-border-accent rounded-md px-3 py-2 text-sm font-mono text-text-primary outline-none transition-colors`} />
                  {errors.amount && <p className="text-[10px] text-danger mt-1">{errors.amount.message as string}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Currency</label>
                  <select {...register("currency")} className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2.5 text-sm text-text-primary outline-none transition-colors">
                    {["INR", "USD", "EUR", "GBP"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Category</label>
                  <select {...register("category")} className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2.5 text-sm text-text-primary outline-none transition-colors capitalize">
                    {["software", "travel", "marketing", "equipment", "other"].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Date</label>
                  <input type="date" {...register("date")} className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-xs text-text-primary outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Notes (optional)</label>
                <input {...register("notes")} placeholder="Brief description for reference"
                  className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-sm text-text-primary outline-none transition-colors" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); reset(); }}
                  className="flex-1 border border-border-strong text-text-primary text-[11px] font-semibold py-2.5 rounded-md hover:bg-subtle transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 bg-accent text-[#0C0C0E] text-[11px] font-semibold py-2.5 rounded-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-elevated border border-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-display text-[18px] text-text-primary mb-2">Delete Expense</h3>
            <p className="text-sm text-text-secondary mb-5">Remove <strong className="text-text-primary">"{deleteTarget.description}"</strong>? This cannot be undone.</p>
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
