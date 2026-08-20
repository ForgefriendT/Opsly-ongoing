import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as dfnsFormat } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number to currency format based on preferred currency.
 */
export function formatCurrency(amount: number, currency: string = "INR"): string {
  try {
    const locale = currency === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is invalid
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// Simple static conversion map for MVP. In a real app, you'd fetch live rates.
const exchangeRates: Record<string, number> = {
  USD: 83.5, // 1 USD = 83.5 INR
  EUR: 90.0,
  GBP: 105.0,
  JPY: 0.55,
  INR: 1,
};

export function convertToCurrency(amount: number, fromCurrency: string, toCurrency: string = "INR"): number {
  const fromRate = exchangeRates[fromCurrency?.toUpperCase()] || 1;
  const toRate = exchangeRates[toCurrency?.toUpperCase()] || 1;
  // Convert to INR first (base), then to target
  const inrAmount = amount * fromRate;
  return inrAmount / toRate;
}

/**
 * Formats a date string or object to DD MMM YYYY format.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return dfnsFormat(d, "dd MMM yyyy");
  } catch (error) {
    return "";
  }
}

/**
 * Generates the next sequential invoice number.
 */
export function generateInvoiceNumber(existingNumbers: string[]): string {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const existing = existingNumbers
    .filter((n) => n && n.startsWith(prefix))
    .map((n) => parseInt(n.replace(prefix, "")) || 0);
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}
