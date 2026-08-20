// lib/gemini.ts

interface GeminiStats {
  total_revenue: string;
  this_month_revenue: string;
  outstanding_amount: string;
  outstanding_count: number;
  overdue_amount: string;
  overdue_count: number;
  monthly_expenses: string;
  net_this_month: string;
  unbilled_hours: number;
  unbilled_value: string;
  active_clients: number;
  top_client_name: string;
  top_client_revenue: string;
}

/**
 * Sends a financial advisory prompt to Google Gemini Flash API.
 */
export async function askAdvisor(question: string, stats: GeminiStats): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "API Key Error: GEMINI_API_KEY is not configured in .env.local.";
  }

  const systemPrompt = `You are FlowDesk's financial advisor. You have access to the user's business data below. 
Answer questions clearly, concisely, and in plain language. Give specific numbers when 
relevant. Be direct. Do not give generic advice. Do not say "I recommend consulting a 
financial advisor." You are that advisor for simple questions.

User's data:
- Total revenue (all time): ${stats.total_revenue}
- Revenue this month: ${stats.this_month_revenue}
- Outstanding invoices: ${stats.outstanding_amount} across ${stats.outstanding_count} invoices
- Overdue invoices: ${stats.overdue_amount} across ${stats.overdue_count} invoices
- Total expenses this month: ${stats.monthly_expenses}
- Net this month: ${stats.net_this_month}
- Unbilled hours: ${stats.unbilled_hours}h worth ${stats.unbilled_value}
- Active clients: ${stats.active_clients}
- Top client by revenue: ${stats.top_client_name} (${stats.top_client_revenue})`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nUser Question: ${question}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Empty response from Gemini model");
    }

    return text.trim();
  } catch (error: any) {
    console.error("Gemini advisor fetch failed:", error);
    return `Advisor Error: Failed to contact the AI advisor. Details: ${error.message || error}`;
  }
}
