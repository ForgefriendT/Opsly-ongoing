import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { sendInvoiceEmail } from "@/lib/resend";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { pdfBase64 } = await req.json();
    if (!pdfBase64) {
      return NextResponse.json({ error: "Missing PDF base64 data" }, { status: 400 });
    }

    const supabase = createClient();
    
    // Fetch the invoice and client details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, client:clients(*)")
      .eq("id", params.id)
      .single();

    if (invoiceError || !invoice) {
      throw new Error(invoiceError?.message || "Invoice not found");
    }

    // Dispatch the email using our Resend helper
    const response = await sendInvoiceEmail(invoice, pdfBase64);
    if (response.error) throw response.error;

    // Transition state from 'draft' to 'sent' if applicable
    if (invoice.status === "draft") {
      await supabase
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", params.id);
    }

    return NextResponse.json({ success: true, messageId: response.data?.id });
  } catch (err: any) {
    console.error("Invoice emailing error:", err);
    return NextResponse.json({ error: err.message || "Failed to dispatch email invoice" }, { status: 500 });
  }
}
