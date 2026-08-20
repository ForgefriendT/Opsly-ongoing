"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Client, InvoiceItem } from "@/types";
import { formatCurrency, formatDate, generateInvoiceNumber } from "@/lib/utils";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledClientId = searchParams.get("client_id") || "";

  const [clients, setClients] = useState<Client[]>([]);
  const [existingNumbers, setExistingNumbers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [clientId, setClientId] = useState(prefilledClientId);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [currency, setCurrency] = useState("INR");
  const [taxRate, setTaxRate] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unit_price: 0 }]);

  // Load clients & existing invoice numbers
  useEffect(() => {
    Promise.all([fetch("/api/clients"), fetch("/api/invoices")]).then(async ([cr, ir]) => {
      const clientData = await cr.json();
      const invoiceData = await ir.json();
      setClients(Array.isArray(clientData) ? clientData : []);
      const numbers = Array.isArray(invoiceData) ? invoiceData.map((i: any) => i.invoice_number) : [];
      setExistingNumbers(numbers);
      setInvoiceNumber(generateInvoiceNumber(numbers));
    });
  }, []);

  // Set currency from selected client
  useEffect(() => {
    if (clientId) {
      const c = clients.find(c => c.id === clientId);
      if (c) setCurrency(c.currency || "INR");
    }
  }, [clientId, clients]);

  // Calculations
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount - discount;

  const selectedClient = clients.find(c => c.id === clientId);

  const addItem = () => setItems(prev => [...prev, { description: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSave = async (status: "draft" | "sent") => {
    if (!clientId || !invoiceNumber) return;
    setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          client_id: clientId,
          status,
          issue_date: issueDate,
          due_date: dueDate,
          currency,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          discount,
          total,
          notes,
          payment_terms: paymentTerms,
          items: items.map((item, idx) => ({ ...item, sort_order: idx })),
        }),
      });
      if (res.ok) {
        const invoice = await res.json();
        router.push(`/invoices/${invoice.id}`);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const ownerName = "Webyte Designs";
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || "hello@webytedesigns.com";

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <Link href="/invoices" className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-xs transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
        </Link>
        <div className="flex gap-2">
          <button onClick={() => handleSave("draft")} disabled={saving}
            className="border border-border-strong text-text-primary text-[11px] font-semibold px-4 py-2 rounded-md hover:bg-subtle transition-all disabled:opacity-50">
            Save Draft
          </button>
          <button onClick={() => handleSave("sent")} disabled={saving}
            className="bg-accent text-[#0C0C0E] text-[11px] font-semibold px-4 py-2 rounded-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Send via Email
          </button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex gap-5 min-h-[70vh]">
        {/* LEFT: Form */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Client & Meta */}
          <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Client *</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)}
                className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2.5 text-sm text-text-primary outline-none transition-colors">
                <option value="">Select a client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Invoice #</label>
                <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                  className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 font-mono text-xs text-text-primary outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2.5 text-sm text-text-primary outline-none transition-colors">
                  {["INR", "USD", "EUR", "GBP", "AED", "JPY", "SGD"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Issue Date</label>
                <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)}
                  className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-xs text-text-primary outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-xs text-text-primary outline-none transition-colors" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-surface border border-border rounded-lg p-5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-4">Line Items</label>
            <div className="flex flex-col gap-2">
              {/* Header */}
              <div className="grid grid-cols-[1fr_60px_100px_80px_28px] gap-2 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary pb-1">
                <span>Description</span><span className="text-center">Qty</span><span>Unit Price</span><span className="text-right">Amount</span><span />
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_60px_100px_80px_28px] gap-2 items-center">
                  <input type="text" value={item.description} onChange={e => updateItem(idx, "description", e.target.value)}
                    placeholder="Description of service..."
                    className="bg-subtle border border-border focus:border-border-accent rounded-md px-2.5 py-1.5 text-xs text-text-primary outline-none transition-colors" />
                  <input type="number" value={item.quantity} min={1} onChange={e => updateItem(idx, "quantity", parseFloat(e.target.value) || 1)}
                    className="bg-subtle border border-border focus:border-border-accent rounded-md px-2 py-1.5 text-xs text-text-primary outline-none transition-colors text-center" />
                  <input type="number" value={item.unit_price} min={0} onChange={e => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)}
                    className="bg-subtle border border-border focus:border-border-accent rounded-md px-2.5 py-1.5 text-xs font-mono text-text-primary outline-none transition-colors" />
                  <span className="text-xs font-mono text-text-primary text-right">{formatCurrency(item.quantity * item.unit_price, currency)}</span>
                  <button onClick={() => removeItem(idx)} disabled={items.length === 1}
                    className="p-1 rounded hover:bg-danger/10 text-text-tertiary hover:text-danger transition-colors disabled:opacity-30">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={addItem} className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors mt-2 w-fit">
                <Plus className="w-3.5 h-3.5" /> Add line item
              </button>
            </div>

            {/* Totals */}
            <div className="mt-5 pt-4 border-t border-border flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Tax Rate (%)</label>
                  <input type="number" value={taxRate} min={0} max={100} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-xs text-text-primary outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Discount (flat)</label>
                  <input type="number" value={discount} min={0} onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-xs font-mono text-text-primary outline-none transition-colors" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                <div className="flex justify-between text-xs text-text-secondary"><span>Subtotal</span><span className="font-mono">{formatCurrency(subtotal, currency)}</span></div>
                <div className="flex justify-between text-xs text-text-secondary"><span>Tax ({taxRate}%)</span><span className="font-mono">{formatCurrency(taxAmount, currency)}</span></div>
                {discount > 0 && <div className="flex justify-between text-xs text-text-secondary"><span>Discount</span><span className="font-mono text-success">−{formatCurrency(discount, currency)}</span></div>}
                <div className="flex justify-between text-sm font-semibold text-text-primary pt-2 border-t border-border mt-1">
                  <span>Total</span><span className="font-mono text-accent">{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Payment Terms */}
          <div className="bg-surface border border-border rounded-lg p-5 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Thank you for your business..."
                className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-xs text-text-primary outline-none transition-colors resize-none" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Payment Terms</label>
              <textarea value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} rows={3}
                placeholder="Net 30. Late fee of 2% per month."
                className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-xs text-text-primary outline-none transition-colors resize-none" />
            </div>
          </div>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="w-[320px] shrink-0 flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Live Preview</p>
          <div className="bg-white border shadow-sm rounded-lg p-6 text-[#1a1a1a] text-xs leading-relaxed font-sans animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="font-semibold text-lg text-[#1a1a1a] tracking-tight">{ownerName}</p>
                <p className="text-[10px] text-[#666] mt-0.5">{ownerEmail}</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-[#1a1a1a] tracking-widest uppercase">Invoice</p>
                <p className="font-mono text-[10px] text-[#666] mt-1">{invoiceNumber}</p>
              </div>
            </div>
            {/* Client & Date */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#888] mb-0.5">Bill to</p>
                <p className="font-medium text-[11px]">{selectedClient?.name || "—"}</p>
                {selectedClient?.email && <p className="text-[10px] text-[#888]">{selectedClient.email}</p>}
              </div>
              <div className="text-right">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#888] mb-0.5">Due date</p>
                <p className="text-[11px]">{formatDate(dueDate)}</p>
              </div>
            </div>
            {/* Items */}
            <div className="border-t border-black/10 pt-2 mb-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-1.5 border-b border-black/5 text-[11px]">
                  <span className="truncate max-w-[140px]">{item.description || `Item ${idx + 1}`}</span>
                  <span className="font-mono shrink-0 ml-2">{formatCurrency(item.quantity * item.unit_price, currency)}</span>
                </div>
              ))}
              {taxRate > 0 && (
                <div className="flex justify-between py-1.5 border-b border-black/5 text-[11px] text-[#888]">
                  <span>Tax ({taxRate}%)</span>
                  <span className="font-mono">{formatCurrency(taxAmount, currency)}</span>
                </div>
              )}
            </div>
            {/* Total */}
            <div className="flex justify-between font-bold text-sm border-t border-black/10 pt-2">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(total, currency)}</span>
            </div>
            {/* Disclaimer */}
            <p className="text-[8px] text-[#888] mt-6 pt-3 border-t border-black/5 leading-relaxed text-center">
              This invoice was generated with FlowDesk. Payment due within {paymentTerms || "30 days"} of issue date.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>}>
      <NewInvoiceForm />
    </Suspense>
  );
}
