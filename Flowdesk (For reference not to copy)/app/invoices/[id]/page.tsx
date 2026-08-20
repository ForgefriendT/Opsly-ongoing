"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Invoice, Client } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Download, Mail, CheckCircle, Trash2, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-success/10 text-success",
  overdue: "bg-danger/10 text-danger",
  sent: "bg-info/10 text-info",
  draft: "bg-subtle text-text-secondary",
  cancelled: "bg-subtle text-text-tertiary",
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchInvoice = async () => {
    setLoading(true);
    const res = await fetch(`/api/invoices/${id}`);
    if (res.ok) setInvoice(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchInvoice(); }, [id]);

  const handleMarkPaid = async () => {
    await fetch(`/api/invoices/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid" }) });
    fetchInvoice();
    showToast("Invoice marked as paid");
  };

  const handleDelete = async () => {
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    router.push("/invoices");
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current || !invoice) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: "#FAFAF8" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoice_number}_${invoice.client?.name?.replace(/\s+/g, "_") || "invoice"}.pdf`);
      showToast("PDF downloaded successfully");
    } catch (e) {
      showToast("PDF generation failed", "error");
    }
    setDownloading(false);
  };

  const handleSendEmail = async () => {
    if (!previewRef.current || !invoice) return;
    setSending(true);
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: "#FAFAF8" });
      const pdfBase64 = canvas.toDataURL("image/png").split(",")[1];
      const res = await fetch(`/api/invoices/${id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64 }),
      });
      if (res.ok) { showToast("Invoice emailed successfully!"); fetchInvoice(); }
      else showToast("Email delivery failed", "error");
    } catch (e) {
      showToast("Failed to send email", "error");
    }
    setSending(false);
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>;
  if (!invoice) return <div className="text-center py-24 text-text-secondary text-sm">Invoice not found.</div>;

  const ownerName = "Webyte Designs";
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || "hello@webytedesigns.com";

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb & Actions */}
      <div className="flex justify-between items-center">
        <Link href="/invoices" className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-xs transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
        </Link>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_STYLES[invoice.status] || STATUS_STYLES.draft}`}>{invoice.status}</span>
          {invoice.status !== "paid" && (
            <button onClick={handleMarkPaid} className="flex items-center gap-1.5 border border-border-strong text-text-primary text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-success/10 hover:text-success hover:border-success/30 transition-all">
              <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
            </button>
          )}
          <button onClick={handleDownloadPDF} disabled={downloading} className="flex items-center gap-1.5 border border-border-strong text-text-primary text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-subtle transition-all">
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
          </button>
          <button onClick={handleSendEmail} disabled={sending || !invoice.client?.email} className="flex items-center gap-1.5 bg-accent text-[#0C0C0E] text-[11px] font-semibold px-3 py-1.5 rounded-md hover:brightness-110 transition-all disabled:opacity-50">
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} Send Email
          </button>
          <button onClick={() => setShowDelete(true)} className="p-2 rounded-md hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content: Invoice preview + Sidebar */}
      <div className="flex gap-5">
        {/* PDF Preview */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-base">
          <div ref={previewRef} id="invoice-preview" className="bg-white border shadow-sm rounded-lg p-10 w-full max-w-[800px] text-[#1a1a1a] text-sm leading-relaxed font-sans animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="font-semibold text-2xl text-[#1a1a1a] tracking-tight">{ownerName}</p>
                <p className="text-xs text-[#666] mt-1">{ownerEmail}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#1a1a1a] tracking-widest uppercase">Invoice</p>
                <p className="font-mono text-sm text-[#666] mt-1">{invoice.invoice_number}</p>
              </div>
            </div>

            {/* Bill To & Dates */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#888] mb-2">Bill to</p>
                <p className="font-semibold text-sm">{invoice.client?.name || "—"}</p>
                {invoice.client?.company && <p className="text-sm text-[#555]">{invoice.client.company}</p>}
                {invoice.client?.email && <p className="text-xs text-[#888] mt-0.5">{invoice.client.email}</p>}
                {invoice.client?.address && <p className="text-xs text-[#888]">{invoice.client.address}</p>}
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#888] mb-0.5">Issue Date</p>
                  <p className="text-sm">{formatDate(invoice.issue_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#888] mb-0.5">Due Date</p>
                  <p className="text-sm font-semibold">{formatDate(invoice.due_date)}</p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full mb-6 text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="text-left text-[11px] font-semibold uppercase text-[#888] pb-2 pr-4">Description</th>
                  <th className="text-center text-[11px] font-semibold uppercase text-[#888] pb-2 w-16">Qty</th>
                  <th className="text-right text-[11px] font-semibold uppercase text-[#888] pb-2 w-28">Unit Price</th>
                  <th className="text-right text-[11px] font-semibold uppercase text-[#888] pb-2 w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).sort((a, b) => a.sort_order - b.sort_order).map(item => (
                  <tr key={item.id} className="border-b border-black/5">
                    <td className="py-2.5 pr-4 text-[13px]">{item.description}</td>
                    <td className="py-2.5 text-center text-[13px] text-[#555]">{item.quantity}</td>
                    <td className="py-2.5 text-right font-mono text-[13px] text-[#555]">{formatCurrency(item.unit_price, invoice.currency)}</td>
                    <td className="py-2.5 text-right font-mono text-[13px]">{formatCurrency(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-60">
                <div className="flex justify-between text-sm text-[#555] mb-1.5"><span>Subtotal</span><span className="font-mono">{formatCurrency(invoice.subtotal, invoice.currency)}</span></div>
                {invoice.tax_rate > 0 && <div className="flex justify-between text-sm text-[#555] mb-1.5"><span>Tax ({invoice.tax_rate}%)</span><span className="font-mono">{formatCurrency(invoice.tax_amount, invoice.currency)}</span></div>}
                {invoice.discount > 0 && <div className="flex justify-between text-sm text-[#555] mb-1.5"><span>Discount</span><span className="font-mono">−{formatCurrency(invoice.discount, invoice.currency)}</span></div>}
                <div className="flex justify-between font-bold text-base border-t border-black/10 pt-2 mt-2">
                  <span>Total</span>
                  <span className="font-mono">{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 pt-6 border-t border-black/10">
                <p className="text-[10px] font-semibold uppercase text-[#888] mb-1.5">Notes</p>
                <p className="text-sm text-[#555] leading-relaxed">{invoice.notes}</p>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-[#888] mt-12 pt-4 border-t border-black/10 leading-relaxed text-center">
              This invoice was generated with FlowDesk. Payment due within {invoice.payment_terms || "30 days"} of issue date.
            </p>
          </div>
        </div>

        {/* Sidebar with details */}
        <div className="w-56 shrink-0 flex flex-col gap-3">
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-3">Invoice Details</p>
            <div className="flex flex-col gap-2 text-xs">
              <div><span className="text-text-secondary">Issued</span><br /><span className="text-text-primary">{formatDate(invoice.issue_date)}</span></div>
              <div><span className="text-text-secondary">Due</span><br /><span className="text-text-primary">{formatDate(invoice.due_date)}</span></div>
              <div><span className="text-text-secondary">Currency</span><br /><span className="font-mono text-text-primary">{invoice.currency}</span></div>
              {invoice.paid_at && <div><span className="text-text-secondary">Paid On</span><br /><span className="text-success">{formatDate(invoice.paid_at)}</span></div>}
            </div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-3">Amount Summary</p>
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span className="font-mono text-text-primary">{formatCurrency(invoice.subtotal, invoice.currency)}</span></div>
              {invoice.tax_rate > 0 && <div className="flex justify-between"><span className="text-text-secondary">Tax</span><span className="font-mono text-text-primary">{formatCurrency(invoice.tax_amount, invoice.currency)}</span></div>}
              <div className="flex justify-between pt-1.5 border-t border-border font-semibold"><span className="text-text-primary">Total</span><span className="font-mono text-accent">{formatCurrency(invoice.total, invoice.currency)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 bg-elevated border rounded-md px-4 py-3 flex items-center gap-3 text-xs z-50 animate-in slide-in-from-bottom-2 ${toast.type === "success" ? "border-success/30" : "border-danger/30"}`}>
          <div className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-success" : "bg-danger"}`} />
          {toast.msg}
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-elevated border border-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-display text-[18px] text-text-primary mb-2">Delete Invoice</h3>
            <p className="text-sm text-text-secondary mb-5">Delete <strong className="font-mono text-text-primary">{invoice.invoice_number}</strong>? This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDelete(false)} className="border border-border-strong text-text-primary text-[11px] font-semibold px-4 py-2 rounded-md hover:bg-subtle transition-all">Cancel</button>
              <button onClick={handleDelete} className="bg-danger/10 border border-danger/30 text-danger text-[11px] font-semibold px-4 py-2 rounded-md hover:bg-danger/20 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
