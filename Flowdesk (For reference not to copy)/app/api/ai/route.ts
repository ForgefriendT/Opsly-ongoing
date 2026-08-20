import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { askAdvisor } from "@/lib/gemini";
import { formatCurrency, convertToCurrency } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const supabase = createClient();
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startOfMonth = `${year}-${month}-01`;
    // Find last day of month
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const endOfMonth = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

    // 1. Fetch Invoices for cash flow stats
    const { data: invoices, error: invErr } = await supabase
      .from("invoices")
      .select("status, total, currency, paid_at, client:clients(name)");
    if (invErr) throw invErr;

    // 2. Fetch Monthly Expenses
    const { data: expenses, error: expErr } = await supabase
      .from("expenses")
      .select("amount, date")
      .gte("date", startOfMonth)
      .lte("date", endOfMonth);
    if (expErr) throw expErr;

    // 3. Fetch Time Entries
    const { data: timeEntries, error: timeErr } = await supabase
      .from("time_entries")
      .select("hours, rate")
      .eq("billed", false);
    if (timeErr) throw timeErr;

    // 4. Fetch Active Clients count
    const { count: activeClients, error: clientErr } = await supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");
    if (clientErr) throw clientErr;

    // Aggregate statistics
    let totalRevenue = 0;
    let thisMonthRevenue = 0;
    let outstandingAmount = 0;
    let outstandingCount = 0;
    let overdueAmount = 0;
    let overdueCount = 0;

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const baseCurrency = process.env.NEXT_PUBLIC_BASE_CURRENCY || "INR";

    invoices?.forEach((inv) => {
      const amount = convertToCurrency(Number(inv.total) || 0, inv.currency, baseCurrency);
      if (inv.status === "paid") {
        totalRevenue += amount;
        if (inv.paid_at) {
          const paidDate = new Date(inv.paid_at);
          if (paidDate.getFullYear() === currentYear && paidDate.getMonth() === currentMonth) {
            thisMonthRevenue += amount;
          }
        }
      } else if (inv.status === "sent" || inv.status === "pending") {
        outstandingAmount += amount;
        outstandingCount++;
      } else if (inv.status === "overdue") {
        outstandingAmount += amount;
        outstandingCount++;
        overdueAmount += amount;
        overdueCount++;
      }
    });

    let monthlyExpenses = 0;
    expenses?.forEach((exp) => {
      // Assuming expenses might have a currency column, defaulting to baseCurrency if not present
      const expCurrency = exp.currency || baseCurrency;
      monthlyExpenses += convertToCurrency(Number(exp.amount) || 0, expCurrency, baseCurrency);
    });

    let unbilledHours = 0;
    let unbilledValue = 0;
    timeEntries?.forEach((entry) => {
      const hrs = Number(entry.hours) || 0;
      const rate = Number(entry.rate) || 1500;
      unbilledHours += hrs;
      unbilledValue += hrs * rate;
    });

    // Top client calculation
    const clientRevenue: Record<string, number> = {};
    invoices?.forEach((inv) => {
      if (inv.status === "paid" && inv.client?.name) {
        const amount = convertToCurrency(Number(inv.total) || 0, inv.currency, baseCurrency);
        clientRevenue[inv.client.name] = (clientRevenue[inv.client.name] || 0) + amount;
      }
    });

    let topClientName = "None";
    let topClientRevenue = 0;
    Object.keys(clientRevenue).forEach((name) => {
      if (clientRevenue[name] > topClientRevenue) {
        topClientRevenue = clientRevenue[name];
        topClientName = name;
      }
    });

    const aiStats = {
      total_revenue: formatCurrency(totalRevenue, baseCurrency),
      this_month_revenue: formatCurrency(thisMonthRevenue, baseCurrency),
      outstanding_amount: formatCurrency(outstandingAmount, baseCurrency),
      outstanding_count: outstandingCount,
      overdue_amount: formatCurrency(overdueAmount, baseCurrency),
      overdue_count: overdueCount,
      monthly_expenses: formatCurrency(monthlyExpenses, baseCurrency),
      net_this_month: formatCurrency(thisMonthRevenue - monthlyExpenses, baseCurrency),
      unbilled_hours: unbilledHours,
      unbilled_value: formatCurrency(unbilledValue, baseCurrency),
      active_clients: activeClients || 0,
      top_client_name: topClientName,
      top_client_revenue: formatCurrency(topClientRevenue, baseCurrency),
    };

    const advice = await askAdvisor(question, aiStats);
    return NextResponse.json({ reply: advice });
  } catch (err: any) {
    console.error("AI advisor endpoint error:", err);
    return NextResponse.json({ error: err.message || "Advisor failed to process request" }, { status: 500 });
  }
}
