"use client";

import { useEffect, useState } from "react";
import { getMockRates, getCurrencyName } from "@/lib/currency";
import { formatCurrency } from "@/lib/utils";
import { RefreshCw, ArrowRight } from "lucide-react";

const MAJOR_CURRENCIES = ["USD", "EUR", "GBP", "AED", "JPY", "SGD", "AUD", "CAD", "CHF", "CNY", "HKD", "NZD", "SAR", "ZAR"];

// Simulated % change for display purposes
const MOCK_CHANGES: Record<string, number> = {
  USD: 0.12, EUR: -0.08, GBP: 0.04, AED: 0.0, JPY: -0.21,
  SGD: 0.06, AUD: 0.15, CAD: -0.03, CHF: 0.09, CNY: -0.11,
  HKD: 0.02, NZD: 0.18, SAR: 0.0, ZAR: -0.34,
};

export default function CurrenciesPage() {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [base, setBase] = useState("INR");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  // Converter
  const [convertAmount, setConvertAmount] = useState(1000);
  const [fromCurrency, setFromCurrency] = useState("INR");
  const [toCurrency, setToCurrency] = useState("USD");

  const fetchRates = async () => {
    setLoading(true);
    const mockRates = getMockRates();
    setRates(mockRates);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => { fetchRates(); }, []);

  const convertedAmount = rates[toCurrency] && rates[fromCurrency]
    ? (convertAmount / (fromCurrency === "INR" ? 1 : 1 / rates[fromCurrency])) * (toCurrency === "INR" ? 1 : rates[toCurrency])
    : 0;

  const getDisplayRate = (code: string) => {
    if (!rates[code]) return "—";
    const rate = rates[code];
    return rate < 0.01 ? rate.toFixed(6) : rate < 1 ? rate.toFixed(4) : rate.toFixed(2);
  };

  const minutesAgo = lastUpdated ? Math.floor((Date.now() - lastUpdated.getTime()) / 60000) : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-text-secondary">Live exchange rates relative to {base}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-tertiary">
            Updated {minutesAgo === 0 ? "just now" : `${minutesAgo}m ago`}
          </span>
          <button onClick={fetchRates} disabled={loading} className="flex items-center gap-1.5 border border-border-strong text-text-primary text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-subtle transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Currency Rates Table */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {/* Base Selector */}
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Base Currency</p>
              <select value={base} onChange={e => setBase(e.target.value)}
                className="bg-subtle border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-text-primary outline-none focus:border-border-accent transition-colors">
                <option value="INR">INR — Indian Rupee</option>
                {MAJOR_CURRENCIES.map(c => (
                  <option key={c} value={c}>{c} — {getCurrencyName(c)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rates List */}
          <div className="divide-y divide-border">
            {MAJOR_CURRENCIES.map(code => {
              const change = MOCK_CHANGES[code] || 0;
              return (
                <div key={code} className="flex items-center px-5 py-3.5 hover:bg-subtle/50 transition-colors">
                  <span className="font-mono text-xs font-medium text-text-primary w-12">{code}</span>
                  <span className="text-xs text-text-secondary flex-1 ml-3">{getCurrencyName(code)}</span>
                  <span className="font-mono text-xs text-text-primary mr-4">{getDisplayRate(code)}</span>
                  <span className={`text-[10px] font-mono w-14 text-right ${change > 0 ? "text-success" : change < 0 ? "text-danger" : "text-text-tertiary"}`}>
                    {change > 0 ? "↑" : change < 0 ? "↓" : ""}{Math.abs(change).toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Converter */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-lg p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-4">Currency Converter</p>

            <div className="flex flex-col gap-3">
              {/* Amount */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">Amount</label>
                <input type="number" value={convertAmount} min={0} onChange={e => setConvertAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2.5 text-base font-mono text-text-primary outline-none transition-colors" />
              </div>

              {/* From */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">From</label>
                <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value)}
                  className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2.5 text-sm font-mono text-text-primary outline-none transition-colors">
                  <option value="INR">INR</option>
                  {MAJOR_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="p-2 bg-subtle rounded-full">
                  <ArrowRight className="w-4 h-4 text-text-secondary" />
                </div>
              </div>

              {/* To */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">To</label>
                <select value={toCurrency} onChange={e => setToCurrency(e.target.value)}
                  className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2.5 text-sm font-mono text-text-primary outline-none transition-colors">
                  <option value="INR">INR</option>
                  {MAJOR_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Result */}
              <div className="bg-accent/5 border border-border-accent rounded-md px-4 py-4 mt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">{convertAmount.toLocaleString()} {fromCurrency} equals</p>
                <p className="font-mono text-2xl font-medium text-accent">{convertedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {toCurrency}</p>
              </div>
            </div>
          </div>

          {/* All Equivalents */}
          <div className="bg-surface border border-border rounded-lg p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-3">
              {convertAmount.toLocaleString()} {fromCurrency} in all currencies
            </p>
            <div className="flex flex-col divide-y divide-border/50">
              {MAJOR_CURRENCIES.slice(0, 7).map(code => {
                if (code === fromCurrency) return null;
                const converted = rates[code] ? (fromCurrency === "INR" ? convertAmount * rates[code] : convertAmount / rates[fromCurrency] * rates[code]) : 0;
                return (
                  <div key={code} className="flex justify-between items-center py-2 text-xs">
                    <span className="font-mono text-text-secondary w-10">{code}</span>
                    <span className="text-text-secondary text-[11px] flex-1 mx-2">{getCurrencyName(code)}</span>
                    <span className="font-mono text-text-primary">{converted.toFixed(code === "JPY" ? 0 : 2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
