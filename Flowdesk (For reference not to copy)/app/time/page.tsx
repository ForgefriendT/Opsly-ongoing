"use client";

import { useEffect, useRef, useState } from "react";
import { Client, TimeEntry } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTimerStore } from "@/store";
import { Play, Pause, StopCircle, ArrowRight, Trash2, Loader2 } from "lucide-react";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

export default function TimePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingEntry, setPendingEntry] = useState<{ clientId: string; description: string; hours: number; rate: number } | null>(null);
  const [billRate, setBillRate] = useState(1500);
  const [deleteTarget, setDeleteTarget] = useState<TimeEntry | null>(null);

  const timer = useTimerStore();
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [timerClientId, setTimerClientId] = useState("");
  const [timerDesc, setTimerDesc] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Tick the timer UI
  useEffect(() => {
    if (timer.isActive && !timer.isPaused) {
      timerRef.current = setInterval(() => {
        timer.tick();
        setDisplaySeconds(timer.elapsedSeconds);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setDisplaySeconds(timer.elapsedSeconds);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timer.isActive, timer.isPaused]);

  const fetchData = async () => {
    setLoading(true);
    const [cRes, tRes] = await Promise.all([fetch("/api/clients"), fetch("/api/time")]);
    const [clientData, timeData] = await Promise.all([cRes.json(), tRes.json()]);
    setClients(Array.isArray(clientData) ? clientData : []);
    setTimeEntries(Array.isArray(timeData) ? timeData : []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleStart = () => {
    const client = clients.find(c => c.id === timerClientId);
    timer.startTimer(timerClientId, client?.name || "", timerDesc, billRate);
    setDisplaySeconds(0);
  };

  const handleStop = () => {
    const result = timer.stopTimer();
    if (result) {
      setPendingEntry(result);
      setBillRate(result.rate || 1500);
      setShowSaveModal(true);
    }
  };

  const handleSaveEntry = async () => {
    if (!pendingEntry) return;
    await fetch("/api/time", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: pendingEntry.clientId || null,
        description: pendingEntry.description,
        date: new Date().toISOString().split("T")[0],
        hours: pendingEntry.hours,
        rate: billRate,
        billed: false,
      }),
    });
    setPendingEntry(null);
    setShowSaveModal(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/time/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    fetchData();
  };

  const handleConvertToInvoice = async (entry: TimeEntry) => {
    // Mark as billed and navigate to new invoice
    const clientId = entry.client_id;
    window.location.href = `/invoices/new?client_id=${clientId || ""}`;
  };

  const unbilledEntries = timeEntries.filter(e => !e.billed);
  const unbilledHours = unbilledEntries.reduce((s, e) => s + Number(e.hours), 0);
  const unbilledValue = unbilledEntries.reduce((s, e) => s + Number(e.hours) * (Number(e.rate) || 0), 0);

  // Group entries by week
  const grouped: Record<string, TimeEntry[]> = {};
  timeEntries.forEach(entry => {
    const d = new Date(entry.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split("T")[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Unbilled Hours</p>
          <p className="font-mono text-xl font-medium text-warning">{unbilledHours.toFixed(1)}h</p>
          <p className="text-xs text-text-secondary mt-1">Not yet invoiced</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Unbilled Value</p>
          <p className="font-mono text-xl font-medium text-text-primary">{formatCurrency(unbilledValue, "INR")}</p>
          <p className="text-xs text-text-secondary mt-1">Approximate</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Total Entries</p>
          <p className="font-mono text-xl font-medium text-text-primary">{timeEntries.length}</p>
          <p className="text-xs text-text-secondary mt-1">All time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        {/* Timer Widget */}
        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Active Timer</p>
            {timer.isActive && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-danger/10 text-danger flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                Recording
              </span>
            )}
          </div>

          {/* Timer Display */}
          <div className="text-center mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">Current session</p>
            <p className="font-mono text-5xl font-medium text-text-primary tracking-wider">{formatDuration(displaySeconds)}</p>
            {timer.isActive && timer.clientName && (
              <p className="text-xs text-text-secondary mt-2">{timer.clientName} — {timer.description || "No description"}</p>
            )}
          </div>

          {/* Setup inputs (only when not active) */}
          {!timer.isActive && (
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Client</label>
                <select value={timerClientId} onChange={e => setTimerClientId(e.target.value)}
                  className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2.5 text-sm text-text-primary outline-none transition-colors">
                  <option value="">No client selected</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Task Description</label>
                <input type="text" value={timerDesc} onChange={e => setTimerDesc(e.target.value)}
                  placeholder="What are you working on?"
                  className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-sm text-text-primary outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Hourly Rate (₹)</label>
                <input type="number" value={billRate} onChange={e => setBillRate(Number(e.target.value))}
                  className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-sm font-mono text-text-primary outline-none transition-colors" />
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2 mt-auto justify-center">
            {!timer.isActive ? (
              <button onClick={handleStart}
                className="flex items-center gap-2 bg-accent text-[#0C0C0E] font-semibold text-sm px-5 py-2.5 rounded-md hover:brightness-110 active:scale-[0.98] transition-all">
                <Play className="w-4 h-4 fill-current" /> Start Timer
              </button>
            ) : (
              <>
                <button onClick={() => timer.isPaused ? timer.resumeTimer() : timer.pauseTimer()}
                  className="flex items-center gap-2 border border-border-strong text-text-primary text-sm px-4 py-2.5 rounded-md hover:bg-subtle transition-all">
                  {timer.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {timer.isPaused ? "Resume" : "Pause"}
                </button>
                <button onClick={handleStop}
                  className="flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-2.5 rounded-md hover:bg-danger/20 transition-all">
                  <StopCircle className="w-4 h-4" /> Stop & Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* Time Log */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Time Log</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-accent animate-spin" /></div>
          ) : timeEntries.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-11 h-11 bg-subtle rounded-lg flex items-center justify-center text-lg">⏱</div>
              <p className="text-sm text-text-secondary">No time entries yet. Start your timer above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {["Date", "Client", "Description", "Hours", "Rate", "Amount", "Status", ""].map(h => (
                      <th key={h} className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary px-4 py-3 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.map(entry => (
                    <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-subtle/40 transition-colors group">
                      <td className="px-4 py-3.5 text-xs text-text-secondary">{formatDate(entry.date)}</td>
                      <td className="px-4 py-3.5 text-xs text-text-primary">{entry.client?.name || "—"}</td>
                      <td className="px-4 py-3.5 text-xs text-text-secondary max-w-[160px] truncate">{entry.description}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-text-primary">{Number(entry.hours).toFixed(1)}h</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-text-secondary">{entry.rate ? formatCurrency(Number(entry.rate), "INR") + "/h" : "—"}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-text-primary">
                        {entry.rate ? formatCurrency(Number(entry.hours) * Number(entry.rate), "INR") : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${entry.billed ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                          {entry.billed ? "Billed" : "Unbilled"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!entry.billed && (
                            <button onClick={() => handleConvertToInvoice(entry)} title="Convert to Invoice"
                              className="p-1.5 rounded hover:bg-accent/10 text-text-secondary hover:text-accent transition-colors">
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => setDeleteTarget(entry)} title="Delete"
                            className="p-1.5 rounded hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors">
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
      </div>

      {/* Save Entry Modal */}
      {showSaveModal && pendingEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-elevated border border-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-display text-[18px] text-text-primary mb-1">Save Time Entry</h3>
            <p className="text-sm text-text-secondary mb-4">Confirm billing details for this session.</p>
            <div className="bg-subtle rounded-md p-4 mb-4 flex flex-col gap-2 text-xs">
              <div className="flex justify-between"><span className="text-text-secondary">Duration</span><span className="font-mono text-text-primary">{pendingEntry.hours.toFixed(2)}h</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Description</span><span className="text-text-primary">{pendingEntry.description || "Time logged"}</span></div>
            </div>
            <div className="mb-4">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Hourly Rate (₹)</label>
              <input type="number" value={billRate} onChange={e => setBillRate(Number(e.target.value))}
                className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-sm font-mono text-text-primary outline-none transition-colors" />
              <p className="text-xs text-accent mt-1.5">Total value: {formatCurrency(pendingEntry.hours * billRate, "INR")}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setPendingEntry(null); setShowSaveModal(false); }} className="flex-1 border border-border-strong text-text-primary text-[11px] font-semibold py-2 rounded-md hover:bg-subtle transition-all">Discard</button>
              <button onClick={handleSaveEntry} className="flex-1 bg-accent text-[#0C0C0E] text-[11px] font-semibold py-2 rounded-md hover:brightness-110 transition-all">Save Entry</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-elevated border border-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-display text-[18px] text-text-primary mb-2">Delete Time Entry</h3>
            <p className="text-sm text-text-secondary mb-5">Remove this time entry? This cannot be undone.</p>
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
