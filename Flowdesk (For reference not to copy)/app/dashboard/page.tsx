"use client";

import { useEffect, useState, useRef } from "react";
import { formatCurrency, convertToCurrency } from "@/lib/utils";
import Link from "next/link";
import { 
  Users, FileText, IndianRupee, Clock, TrendingUp, 
  ArrowUpRight, AlertCircle, Sparkles, Loader2, Send
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    outstanding: 0,
    activeClients: 0,
    unbilledHours: 0,
    recentInvoices: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  // AI Advisor State
  const [aiLoading, setAiLoading] = useState(false);
  const [messages, setMessages] = useState<{role: "user"|"assistant", content: string}[]>([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [clientsRes, invoicesRes, timeRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/invoices"),
          fetch("/api/time")
        ]);
        
        const clients = await clientsRes.json();
        const invoices = await invoicesRes.json();
        const time = await timeRes.json();

        const activeClients = Array.isArray(clients) ? clients.filter((c: any) => c.status === "active").length : 0;
        
        let totalRev = 0;
        let outstd = 0;
        const recent = [];
        
        if (Array.isArray(invoices)) {
          invoices.forEach((inv: any) => {
            const amountInBase = convertToCurrency(Number(inv.total), inv.currency, "INR");
            if (inv.status === "paid") totalRev += amountInBase;
            if (inv.status === "sent" || inv.status === "overdue") outstd += amountInBase;
          });
          recent.push(...invoices.slice(0, 5));
        }

        let unbilled = 0;
        if (Array.isArray(time)) {
          time.forEach((t: any) => {
            if (!t.billed) unbilled += Number(t.hours);
          });
        }

        setStats({
          totalRevenue: totalRev,
          outstanding: outstd,
          activeClients,
          unbilledHours: unbilled,
          recentInvoices: recent,
        });

      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAskAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || aiLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setAiLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: userMessage,
          context: {
            revenue: stats.totalRevenue,
            outstanding: stats.outstanding,
            unbilledHours: stats.unbilledHours,
            activeClients: stats.activeClients
          }
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error connecting to Gemini." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Network error occurred." }]);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl text-text-primary">Overview</h1>
          <p className="text-sm text-text-secondary mt-1">Here's what's happening with your business today.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/time" className="bg-surface border border-border text-text-primary text-[11px] font-semibold px-4 py-2 rounded-md hover:bg-subtle transition-all flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Log Time
          </Link>
          <Link href="/invoices/new" className="bg-accent text-[#0C0C0E] text-[11px] font-semibold px-4 py-2 rounded-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> New Invoice
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
        <div className="bg-surface border border-border rounded-lg p-5 hover:border-border-strong transition-colors cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-md bg-success/10 text-success flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">Total Revenue</p>
          <p className="font-mono text-2xl font-medium text-text-primary">{formatCurrency(stats.totalRevenue, "INR")}</p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-md bg-warning/10 text-warning flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">Outstanding</p>
          <p className="font-mono text-2xl font-medium text-text-primary">{formatCurrency(stats.outstanding, "INR")}</p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-md bg-info/10 text-info flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">Active Clients</p>
          <p className="font-mono text-2xl font-medium text-text-primary">{stats.activeClients}</p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-md bg-accent/10 text-accent flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">Unbilled Hours</p>
          <p className="font-mono text-2xl font-medium text-text-primary">{stats.unbilledHours.toFixed(1)}h</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Recent Invoices */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border flex justify-between items-center">
            <h3 className="font-display text-[16px] text-text-primary">Recent Invoices</h3>
            <Link href="/invoices" className="text-[11px] text-text-secondary hover:text-accent transition-colors">View All →</Link>
          </div>
          {stats.recentInvoices.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-secondary">
              No recent invoices found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border bg-subtle/30">
                    <th className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3 text-left">Invoice #</th>
                    <th className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3 text-left">Client</th>
                    <th className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3 text-right">Amount</th>
                    <th className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-5 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-subtle/50 transition-colors">
                      <td className="px-5 py-3.5"><Link href={`/invoices/${inv.id}`} className="font-mono text-xs text-accent hover:underline">{inv.invoice_number}</Link></td>
                      <td className="px-5 py-3.5 text-xs text-text-primary">{inv.client?.name || "—"}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs text-text-primary">{formatCurrency(Number(inv.total), inv.currency)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          inv.status === 'paid' ? 'bg-success/10 text-success' : 
                          inv.status === 'overdue' ? 'bg-danger/10 text-danger' : 
                          inv.status === 'sent' ? 'bg-info/10 text-info' : 
                          'bg-subtle text-text-secondary'
                        }`}>{inv.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Gemini AI Advisor */}
        <div className="bg-surface border border-border rounded-lg flex flex-col h-[500px]">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="font-display text-[16px] text-text-primary">Financial Advisor</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="text-center my-auto">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <p className="text-sm text-text-primary font-medium mb-1">Hi, I'm your AI Advisor</p>
                <p className="text-xs text-text-secondary leading-relaxed max-w-[250px] mx-auto">
                  Ask me about your revenue, cash flow, outstanding payments, or tips to grow your freelance business.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <button onClick={() => setInput("How is my business performing this month?")} className="text-[11px] bg-subtle border border-border px-3 py-1.5 rounded text-text-secondary hover:text-text-primary hover:border-border-strong transition-all text-left truncate">
                    "How is my business performing?"
                  </button>
                  <button onClick={() => setInput("Who owes me money right now?")} className="text-[11px] bg-subtle border border-border px-3 py-1.5 rounded text-text-secondary hover:text-text-primary hover:border-border-strong transition-all text-left truncate">
                    "Who owes me money right now?"
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] text-xs p-3 rounded-xl ${
                    msg.role === "user" 
                      ? "bg-accent text-[#0C0C0E] rounded-tr-sm" 
                      : "bg-subtle border border-border text-text-primary rounded-tl-sm prose prose-invert prose-p:leading-relaxed prose-pre:bg-elevated prose-pre:border prose-pre:border-border"
                  }`}>
                    {msg.role === "user" ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                  </div>
                </div>
              ))
            )}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-subtle border border-border text-text-primary p-3 rounded-xl rounded-tl-sm flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-text-secondary" />
                  <span className="text-xs text-text-secondary">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleAskAI} className="p-3 border-t border-border bg-elevated/50">
            <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask your AI advisor..."
                className="w-full bg-surface border border-border focus:border-border-accent rounded-full pl-4 pr-10 py-2.5 text-xs text-text-primary outline-none transition-colors"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || aiLoading}
                className="absolute right-1.5 top-1.5 p-1.5 bg-accent text-[#0C0C0E] rounded-full hover:brightness-110 disabled:opacity-50 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
