"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Client, Invoice, TimeEntry, Document } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, FileText, Clock, FilePen, Loader2, Edit2, Trash2 } from "lucide-react";
import ClientForm from "@/components/clients/ClientForm";

type Tab = "overview" | "invoices" | "time" | "documents";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-success/10 text-success",
  overdue: "bg-danger/10 text-danger",
  pending: "bg-warning/10 text-warning",
  sent: "bg-info/10 text-info",
  draft: "bg-subtle text-text-secondary",
  cancelled: "bg-subtle text-text-tertiary",
};

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientRes, invoicesRes, timeRes, docsRes] = await Promise.all([
        fetch(`/api/clients/${id}`),
        fetch(`/api/invoices?client_id=${id}`),
        fetch(`/api/time?client_id=${id}`),
        fetch(`/api/documents`),
      ]);
      const [clientData, invoicesData, timeData, docsData] = await Promise.all([
        clientRes.json(),
        invoicesRes.json(),
        timeRes.json(),
        docsRes.json(),
      ]);
      setClient(clientData);
      setInvoices(Array.isArray(invoicesData) ? invoicesData.filter((inv: Invoice) => inv.client_id === id) : []);
      setTimeEntries(Array.isArray(timeData) ? timeData : []);
      setDocuments(Array.isArray(docsData) ? docsData.filter((doc: Document) => doc.client_id === id) : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleUpdate = async (data: any) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setIsEditing(false);
      fetchData();
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/clients");
  };

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <Loader2 className="w-6 h-6 text-accent animate-spin" />
    </div>
  );

  if (!client) return (
    <div className="text-center py-24 text-text-secondary text-sm">Client not found.</div>
  );

  const initials = client.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  const unbilledHours = timeEntries.filter(t => !t.billed).reduce((sum, t) => sum + Number(t.hours), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button */}
      <Link href="/clients" className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-xs transition-colors w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Clients
      </Link>

      {/* Header Card */}
      <div className="bg-surface border border-border rounded-lg p-6 flex flex-col sm:flex-row sm:items-start gap-5">
        <div className="w-14 h-14 rounded-full bg-accent/10 text-accent flex items-center justify-center text-lg font-semibold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="font-display text-[28px] text-text-primary leading-none">{client.name}</h1>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              client.status === "active" ? "bg-success/10 text-success" :
              client.status === "lead" ? "bg-accent/10 text-accent" :
              "bg-subtle text-text-tertiary"
            }`}>{client.status}</span>
          </div>
          <p className="text-sm text-text-secondary mb-3">{client.company || "Individual Client"}</p>
          <div className="flex flex-wrap gap-2">
            {(client.tags || []).map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-subtle text-text-secondary border border-border">{tag}</span>
            ))}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 border border-border-strong text-text-primary text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-subtle transition-all">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 bg-danger/10 border border-danger/20 text-danger text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-danger/20 transition-all">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Total Billed</p>
          <p className="font-mono text-xl font-medium text-accent">{formatCurrency(Number(client.total_billed) || 0, client.currency)}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Invoices</p>
          <p className="font-mono text-xl font-medium text-text-primary">{invoices.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Unbilled Hours</p>
          <p className="font-mono text-xl font-medium text-warning">{unbilledHours.toFixed(1)}h</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Currency</p>
          <p className="font-mono text-xl font-medium text-text-primary">{client.currency}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-subtle p-1 rounded-md w-fit">
        {(["overview", "invoices", "time", "documents"] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`text-xs font-medium px-4 py-1.5 rounded-md capitalize transition-all ${
              activeTab === tab ? "bg-elevated text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-lg p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-4">Contact Details</p>
            <div className="flex flex-col gap-3">
              {[
                { label: "Email", value: client.email },
                { label: "Phone", value: client.phone },
                { label: "Address", value: client.address },
                { label: "Country", value: client.country },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-text-secondary text-xs">{label}</span>
                  <span className="text-text-primary text-right max-w-[200px] truncate text-xs">{value}</span>
                </div>
              ) : null)}
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary text-xs">Member since</span>
                <span className="text-text-primary text-xs">{formatDate(client.created_at)}</span>
              </div>
            </div>
          </div>
          {client.notes && (
            <div className="bg-surface border border-border rounded-lg p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-3">Notes</p>
              <p className="text-sm text-text-secondary leading-relaxed">{client.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-11 h-11 bg-subtle rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-text-tertiary" /></div>
              <p className="text-sm text-text-secondary">No invoices for this client yet.</p>
              <Link href={`/invoices/new?client_id=${id}`} className="bg-accent text-[#0C0C0E] text-[11px] font-semibold px-4 py-2 rounded-md hover:brightness-110 transition-all">
                Create Invoice
              </Link>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3">Invoice #</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3">Due Date</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3">Amount</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-subtle/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/invoices/${inv.id}`} className="font-mono text-xs text-accent hover:underline">{inv.invoice_number}</Link>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-text-secondary">{formatDate(inv.due_date)}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs text-text-primary">{formatCurrency(Number(inv.total), inv.currency)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[inv.status] || STATUS_STYLES.draft}`}>{inv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "time" && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {timeEntries.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-11 h-11 bg-subtle rounded-lg flex items-center justify-center"><Clock className="w-5 h-5 text-text-tertiary" /></div>
              <p className="text-sm text-text-secondary">No time entries logged for this client.</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3">Date</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3">Description</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3">Hours</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3">Amount</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.map(entry => (
                  <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-subtle/50 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-text-secondary">{formatDate(entry.date)}</td>
                    <td className="px-5 py-3.5 text-xs text-text-primary">{entry.description}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs">{Number(entry.hours).toFixed(1)}h</td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs text-text-primary">
                      {entry.rate ? formatCurrency(Number(entry.hours) * Number(entry.rate), client.currency) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${entry.billed ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {entry.billed ? "Billed" : "Unbilled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "documents" && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-11 h-11 bg-subtle rounded-lg flex items-center justify-center"><FilePen className="w-5 h-5 text-text-tertiary" /></div>
              <p className="text-sm text-text-secondary">No documents generated for this client.</p>
              <Link href="/documents" className="bg-accent text-[#0C0C0E] text-[11px] font-semibold px-4 py-2 rounded-md hover:brightness-110 transition-all">
                Document Studio
              </Link>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3">Title</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3">Type</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3">Created</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-subtle/50 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-text-primary font-medium">{doc.title}</td>
                    <td className="px-5 py-3.5 text-xs text-text-secondary capitalize">{doc.template_type.replace(/_/g, " ")}</td>
                    <td className="px-5 py-3.5 text-xs text-text-secondary">{formatDate(doc.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        doc.status === "signed" ? "bg-success/10 text-success" : doc.status === "sent" ? "bg-info/10 text-info" : "bg-subtle text-text-secondary"
                      }`}>{doc.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <ClientForm client={client} onSave={handleUpdate} onClose={() => setIsEditing(false)} />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-elevated border border-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-display text-[18px] text-text-primary mb-2">Delete Client</h3>
            <p className="text-sm text-text-secondary mb-5">
              Are you sure you want to delete <strong className="text-text-primary">{client.name}</strong>? This action cannot be undone and will remove all associated records.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="border border-border-strong text-text-primary text-[11px] font-semibold px-4 py-2 rounded-md hover:bg-subtle transition-all">Cancel</button>
              <button onClick={handleDelete} className="bg-danger/10 border border-danger/30 text-danger text-[11px] font-semibold px-4 py-2 rounded-md hover:bg-danger/20 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
