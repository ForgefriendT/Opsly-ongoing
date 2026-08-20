"use client";

import { useEffect, useRef, useState } from "react";
import { Client, DocumentType } from "@/types";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, X, Loader2, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const DISCLAIMER = `DISCLAIMER: This document is a template generated for informational and organizational purposes only. It does not constitute legal advice and should not be relied upon as such. FlowDesk makes no representations regarding the legal validity or enforceability of this document in any jurisdiction. Before executing any agreement, consult a qualified legal professional.`;

interface TemplateConfig {
  type: DocumentType;
  name: string;
  desc: string;
  icon: string;
  color: string;
  fields: { key: string; label: string; type: string; placeholder?: string; required?: boolean }[];
  generateContent: (fields: Record<string, string>, client?: Client) => string;
}

const TEMPLATES: TemplateConfig[] = [
  {
    type: "nda",
    name: "Non-Disclosure Agreement",
    desc: "Mutual NDA protecting confidential information",
    icon: "🔒",
    color: "bg-accent/10 text-accent",
    fields: [
      { key: "party_a", label: "Your Full Name / Company", type: "text", placeholder: "Fauzan Baig / Webyte Designs", required: true },
      { key: "party_b", label: "Other Party Name / Company", type: "text", placeholder: "Sofia Reyes / Reyes Digital", required: true },
      { key: "effective_date", label: "Effective Date", type: "date", required: true },
      { key: "duration_years", label: "Duration (years)", type: "text", placeholder: "2", required: true },
      { key: "purpose", label: "Purpose / Project Description", type: "textarea", placeholder: "Website redesign and brand identity project" },
    ],
    generateContent: (f) => `NON-DISCLOSURE AGREEMENT\n\nThis Non-Disclosure Agreement ("Agreement") is entered into as of ${f.effective_date || "[Date]"}, between ${f.party_a || "[Party A]"} ("Disclosing Party") and ${f.party_b || "[Party B]"} ("Receiving Party").\n\n1. CONFIDENTIAL INFORMATION\nThe Receiving Party agrees to keep confidential all non-public information disclosed by the Disclosing Party in connection with: ${f.purpose || "[Project Description]"}.\n\n2. OBLIGATIONS\nThe Receiving Party shall not disclose, copy, or use any Confidential Information for any purpose other than the stated purpose without prior written consent.\n\n3. DURATION\nThis Agreement shall remain in effect for a period of ${f.duration_years || "2"} years from the Effective Date.\n\n4. EXCEPTIONS\nConfidential Information does not include information that is publicly known, independently developed, or lawfully received from a third party.\n\n5. GOVERNING LAW\nThis Agreement shall be governed by applicable laws.\n\nIN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.\n\n${f.party_a || "[Party A]"} _____________________ Date: _______\n${f.party_b || "[Party B]"} _____________________ Date: _______`,
  },
  {
    type: "service_agreement",
    name: "Freelance Service Agreement",
    desc: "Standard freelance service contract",
    icon: "📋",
    color: "bg-info/10 text-info",
    fields: [
      { key: "service_provider", label: "Service Provider Name", type: "text", placeholder: "Fauzan Baig", required: true },
      { key: "client_name", label: "Client Name", type: "text", placeholder: "Sofia Reyes", required: true },
      { key: "services", label: "Services Provided", type: "textarea", placeholder: "UI/UX Design, Branding, Web Development", required: true },
      { key: "start_date", label: "Start Date", type: "date" },
      { key: "end_date", label: "End Date (optional)", type: "date" },
      { key: "rate", label: "Rate (per hour/project)", type: "text", placeholder: "₹2,500/hour or ₹45,000 fixed" },
      { key: "payment_terms", label: "Payment Terms", type: "text", placeholder: "50% upfront, 50% on delivery" },
    ],
    generateContent: (f) => `FREELANCE SERVICE AGREEMENT\n\nThis Freelance Service Agreement ("Agreement") is entered into between ${f.service_provider || "[Service Provider]"} ("Freelancer") and ${f.client_name || "[Client]"} ("Client").\n\n1. SERVICES\nFreelancer agrees to provide the following services: ${f.services || "[Services]"}\n\n2. TIMELINE\nServices shall commence on ${f.start_date || "[Start Date]"}${f.end_date ? ` and conclude by ${f.end_date}` : ""}.\n\n3. COMPENSATION\nClient agrees to pay Freelancer at the rate of ${f.rate || "[Rate]"}.\n\n4. PAYMENT TERMS\n${f.payment_terms || "Payment due within 30 days of invoice."}\n\n5. INTELLECTUAL PROPERTY\nUpon full payment, all deliverables become the exclusive property of Client.\n\n6. CONFIDENTIALITY\nBoth parties agree to keep project details and business information confidential.\n\n7. TERMINATION\nEither party may terminate this Agreement with 14 days written notice.\n\nSigned:\n${f.service_provider || "[Freelancer]"} _____________________ Date: _______\n${f.client_name || "[Client]"} _____________________ Date: _______`,
  },
  {
    type: "scope_of_work",
    name: "Project Scope of Work",
    desc: "Define deliverables, timeline, and milestones",
    icon: "📐",
    color: "bg-success/10 text-success",
    fields: [
      { key: "project_name", label: "Project Name", type: "text", placeholder: "Reyes Digital Website Redesign", required: true },
      { key: "client_name", label: "Client Name", type: "text", placeholder: "Sofia Reyes", required: true },
      { key: "objectives", label: "Project Objectives", type: "textarea", placeholder: "Redesign the company website to improve UX and conversion..." },
      { key: "deliverables", label: "Deliverables", type: "textarea", placeholder: "Homepage, About, Services, Contact pages; Mobile-responsive design..." },
      { key: "timeline", label: "Timeline", type: "text", placeholder: "6 weeks from project kickoff" },
      { key: "budget", label: "Total Budget", type: "text", placeholder: "₹85,000" },
      { key: "exclusions", label: "Out of Scope", type: "textarea", placeholder: "Content writing, SEO, Photography" },
    ],
    generateContent: (f) => `SCOPE OF WORK\n\nProject: ${f.project_name || "[Project Name]"}\nClient: ${f.client_name || "[Client]"}\nDate: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}\n\n1. OBJECTIVES\n${f.objectives || "[Project objectives]"}\n\n2. DELIVERABLES\n${f.deliverables || "[List of deliverables]"}\n\n3. TIMELINE\n${f.timeline || "[Project timeline]"}\n\n4. BUDGET\nTotal project budget: ${f.budget || "[Budget]"}\n\n5. OUT OF SCOPE\nThe following items are explicitly excluded from this scope:\n${f.exclusions || "[Exclusions]"}\n\n6. APPROVAL\nAny changes to this scope must be agreed upon in writing by both parties.\n\nApproved by:\nClient: ${f.client_name || "[Client]"} _____________________ Date: _______`,
  },
  {
    type: "payment_terms",
    name: "Payment Terms Letter",
    desc: "Late fees, payment schedule, and methods",
    icon: "💳",
    color: "bg-warning/10 text-warning",
    fields: [
      { key: "your_name", label: "Your Name / Business", type: "text", placeholder: "Fauzan Baig / Webyte Designs", required: true },
      { key: "client_name", label: "Client Name", type: "text", placeholder: "Sofia Reyes", required: true },
      { key: "payment_due", label: "Payment Due (days)", type: "text", placeholder: "30", required: true },
      { key: "late_fee_percent", label: "Late Fee (%/month)", type: "text", placeholder: "2" },
      { key: "payment_methods", label: "Accepted Payment Methods", type: "textarea", placeholder: "Bank transfer, UPI (GPay, PhonePe), PayPal" },
      { key: "currency", label: "Currency", type: "text", placeholder: "INR" },
    ],
    generateContent: (f) => `PAYMENT TERMS LETTER\n\nFrom: ${f.your_name || "[Your Name]"}\nTo: ${f.client_name || "[Client]"}\nDate: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}\n\nDear ${f.client_name || "Client"},\n\nThis letter outlines the payment terms governing our professional engagement:\n\n1. PAYMENT DUE DATE\nAll invoices are due within ${f.payment_due || "30"} days of the invoice date.\n\n2. CURRENCY\nAll payments shall be made in ${f.currency || "INR"} unless otherwise agreed.\n\n3. ACCEPTED PAYMENT METHODS\n${f.payment_methods || "Bank transfer, UPI"}\n\n4. LATE PAYMENT\nInvoices unpaid after the due date will incur a late fee of ${f.late_fee_percent || "2"}% per month on the outstanding balance.\n\n5. DISPUTES\nAny billing disputes must be raised within 7 days of invoice receipt.\n\nBy continuing to engage services, the Client acknowledges and agrees to these payment terms.\n\nSincerely,\n${f.your_name || "[Your Name]"}`,
  },
  {
    type: "freelance_contract",
    name: "General Business Contract",
    desc: "Comprehensive contract for client work",
    icon: "📝",
    color: "bg-subtle text-text-secondary",
    fields: [
      { key: "contractor", label: "Contractor Name", type: "text", placeholder: "Fauzan Baig", required: true },
      { key: "client_name", label: "Client Name", type: "text", placeholder: "Sofia Reyes", required: true },
      { key: "project_description", label: "Project Description", type: "textarea", placeholder: "Describe the work to be completed..." },
      { key: "compensation", label: "Compensation Details", type: "text", placeholder: "₹45,000 fixed-price" },
      { key: "start_date", label: "Start Date", type: "date" },
      { key: "jurisdiction", label: "Governing Jurisdiction", type: "text", placeholder: "State of Maharashtra, India" },
    ],
    generateContent: (f) => `GENERAL BUSINESS CONTRACT\n\nThis Agreement is entered into between ${f.contractor || "[Contractor]"} ("Contractor") and ${f.client_name || "[Client]"} ("Client"), effective ${f.start_date || new Date().toLocaleDateString("en-IN")}.\n\n1. WORK DESCRIPTION\n${f.project_description || "[Project Description]"}\n\n2. COMPENSATION\nClient agrees to compensate Contractor: ${f.compensation || "[Compensation]"}\n\n3. INDEPENDENT CONTRACTOR STATUS\nContractor is an independent professional. This Agreement does not create an employment relationship.\n\n4. DELIVERABLES & REVISIONS\nContractor will provide deliverables as agreed. Minor revisions are included; major scope changes will be billed additionally.\n\n5. OWNERSHIP\nAll deliverables become Client property upon receipt of full payment.\n\n6. LIMITATION OF LIABILITY\nContractor's liability shall not exceed the total compensation paid under this Agreement.\n\n7. GOVERNING LAW\nThis Agreement shall be governed by the laws of ${f.jurisdiction || "[Jurisdiction]"}.\n\nSigned:\n${f.contractor || "[Contractor]"} _____________________ Date: _______\n${f.client_name || "[Client]"} _____________________ Date: _______`,
  },
];

export default function DocumentsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState<TemplateConfig | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [selectedClientId, setSelectedClientId] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([fetch("/api/clients"), fetch("/api/documents")]).then(async ([cr, dr]) => {
      setClients(await cr.json());
      setDocuments(await dr.json());
      setLoading(false);
    });
  }, []);

  const handleSelectTemplate = (template: TemplateConfig) => {
    setActiveTemplate(template);
    setFields({});
    setTitle(`${template.name} — ${new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`);
  };

  const generatedContent = activeTemplate
    ? activeTemplate.generateContent(fields, clients.find(c => c.id === selectedClientId))
    : "";

  const handleSave = async () => {
    if (!activeTemplate) return;
    setSaving(true);
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: selectedClientId || null,
        template_type: activeTemplate.type,
        title: title || activeTemplate.name,
        content: fields,
        status: "draft",
      }),
    });
    setSaving(false);
    setActiveTemplate(null);
    const res = await fetch("/api/documents");
    setDocuments(await res.json());
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: "#FAFAF8" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${(title || "document").replace(/\s+/g, "_")}.pdf`);
    setDownloading(false);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-text-secondary">Generate contracts and legal templates</p>
        </div>
        {activeTemplate && (
          <button onClick={() => setActiveTemplate(null)} className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-xs transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Templates
          </button>
        )}
      </div>

      {!activeTemplate ? (
        <>
          {/* Disclaimer Banner */}
          <div className="flex items-start gap-3 bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
            <span className="text-danger text-sm shrink-0 mt-0.5">⚠</span>
            <p className="text-xs text-text-secondary leading-relaxed">
              All documents include a legal disclaimer and are templates only — <strong className="text-text-primary">not legal advice</strong>. Consult a qualified legal professional before executing any agreement.
            </p>
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map(template => (
              <button key={template.type} onClick={() => handleSelectTemplate(template)}
                className="bg-surface border border-border rounded-lg p-5 text-left hover:border-border-strong transition-all duration-150 cursor-pointer group">
                <div className={`w-9 h-9 rounded-md ${template.color} flex items-center justify-center text-lg mb-3`}>
                  {template.icon}
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">{template.name}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{template.desc}</p>
                <p className="text-[10px] text-accent mt-3 opacity-0 group-hover:opacity-100 transition-opacity">Generate →</p>
              </button>
            ))}
          </div>

          {/* Recent Documents */}
          {!loading && documents.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-3">Recent Documents</p>
              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      {["Title", "Type", "Client", "Created", "Status"].map(h => (
                        <th key={h} className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {documents.slice(0, 8).map((doc: any) => (
                      <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-subtle/40 transition-colors">
                        <td className="px-4 py-3.5 text-xs font-medium text-text-primary">{doc.title}</td>
                        <td className="px-4 py-3.5 text-xs text-text-secondary capitalize">{doc.template_type?.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3.5 text-xs text-text-secondary">{doc.client?.name || "—"}</td>
                        <td className="px-4 py-3.5 text-xs text-text-secondary">{formatDate(doc.created_at)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            doc.status === "signed" ? "bg-success/10 text-success" : doc.status === "sent" ? "bg-info/10 text-info" : "bg-subtle text-text-secondary"
                          }`}>{doc.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Document Builder */
        <div className="flex gap-5">
          {/* Form */}
          <div className="w-80 shrink-0 flex flex-col gap-4">
            <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
              <div className={`w-9 h-9 rounded-md ${activeTemplate.color} flex items-center justify-center text-lg`}>{activeTemplate.icon}</div>
              <h2 className="font-display text-[20px] text-text-primary leading-tight">{activeTemplate.name}</h2>

              {/* Document Title */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Document Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-sm text-text-primary outline-none transition-colors" />
              </div>

              {/* Client Selector */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Link to Client</label>
                <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}
                  className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2.5 text-sm text-text-primary outline-none transition-colors">
                  <option value="">No client linked</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Dynamic Fields */}
              {activeTemplate.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                    {field.label}{field.required && " *"}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea value={fields[field.key] || ""} onChange={e => setFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder} rows={3}
                      className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-xs text-text-primary outline-none transition-colors resize-none" />
                  ) : (
                    <input type={field.type} value={fields[field.key] || ""} onChange={e => setFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-xs text-text-primary outline-none transition-colors" />
                  )}
                </div>
              ))}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 border border-border-strong text-text-primary text-[11px] font-semibold py-2 rounded-md hover:bg-subtle transition-all">
                  {saving ? "Saving..." : "Save Draft"}
                </button>
                <button onClick={handleDownloadPDF} disabled={downloading}
                  className="flex-1 bg-accent text-[#0C0C0E] text-[11px] font-semibold py-2 rounded-md hover:brightness-110 transition-all flex items-center justify-center gap-1.5">
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Download PDF
                </button>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-3">Document Preview</p>
            <div ref={previewRef} className="bg-[#FAFAF8] rounded-lg p-8 text-[#1a1a1a]">
              {/* Document Header */}
              <div className="border-b border-black/10 pb-6 mb-6 text-center">
                <h1 className="font-display text-2xl text-[#1a1a1a] mb-1">{activeTemplate.name.toUpperCase()}</h1>
                <p className="text-[11px] text-[#888]">Generated by FlowDesk · {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
              </div>

              {/* Document Content */}
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#333] font-[inherit] font-sans">
                {generatedContent}
              </pre>

              {/* Disclaimer */}
              <div className="mt-8 pt-6 border-t border-black/10">
                <p className="text-[8px] text-[#aaa] leading-relaxed">{DISCLAIMER}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
