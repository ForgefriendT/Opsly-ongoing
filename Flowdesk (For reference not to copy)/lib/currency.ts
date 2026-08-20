// lib/currency.ts

let rateCache: { rates: Record<string, number>; fetchedAt: number } | null = null;

// Mock rates relative to INR (1 INR = X currency)
const MOCK_RATES: Record<string, number> = {
  INR: 1.0,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AED: 0.044,
  JPY: 1.84,
  SGD: 0.016,
  AUD: 0.018,
  CAD: 0.016,
  CHF: 0.011,
  CNY: 0.087,
  HKD: 0.094,
  NZD: 0.02,
  SAR: 0.045,
  ZAR: 0.22,
};

const CURRENCY_NAMES: Record<string, string> = {
  INR: "Indian Rupee",
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  AED: "UAE Dirham",
  JPY: "Japanese Yen",
  SGD: "Singapore Dollar",
  AUD: "Australian Dollar",
  CAD: "Canadian Dollar",
  CHF: "Swiss Franc",
  CNY: "Chinese Yuan",
  HKD: "Hong Kong Dollar",
  NZD: "New Zealand Dollar",
  SAR: "Saudi Riyal",
  ZAR: "South African Rand",
};

export async function getRates(base = "INR"): Promise<Record<string, number>> {
  const now = Date.now();
  if (rateCache && now - rateCache.fetchedAt < 15 * 60 * 1000) {
    return rateCache.rates;
  }
  try {
    const res = await fetch(`https://api.exchangerate.host/live?base=${base}`, {
      next: { revalidate: 900 }, // cache for 15 minutes in Next.js
    });
    const data = await res.json();
    if (data && data.quotes) {
      // The API returns rates in format USDINR etc. or relative
      // Let's extract rates and clean them.
      const cleanedRates: Record<string, number> = {};
      Object.keys(data.quotes).forEach((key) => {
        // Strip base if prefix (e.g. USDINR -> USD)
        const code = key.startsWith(base) ? key.slice(base.length) : key;
        cleanedRates[code] = data.quotes[key];
      });
      rateCache = { rates: cleanedRates, fetchedAt: now };
      return cleanedRates;
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.warn("Exchangerate API failed, falling back to cached mock rates.", error);
    return MOCK_RATES;
  }
}

export function getCurrencyName(code: string): string {
  return CURRENCY_NAMES[code] || code;
}

export function getMockRates(): Record<string, number> {
  return MOCK_RATES;
}
