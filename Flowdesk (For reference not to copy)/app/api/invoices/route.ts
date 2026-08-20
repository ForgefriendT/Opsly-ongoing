import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const itemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be greater than 0").default(1),
  unit_price: z.number().nonnegative("Price cannot be negative"),
  sort_order: z.number().default(0),
});

const invoiceSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  client_id: z.string().uuid("Invalid client ID"),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  issue_date: z.string(),
  due_date: z.string(),
  currency: z.string().default("INR"),
  subtotal: z.number().nonnegative(),
  tax_rate: z.number().nonnegative().default(0),
  tax_amount: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  notes: z.string().optional().nullable(),
  payment_terms: z.string().optional().nullable(),
  paid_at: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1, "At least one line item is required"),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("*, client:clients(*), items:invoice_items(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = invoiceSchema.parse(body);
    const supabase = createClient();

    // 1. Insert the invoice fields
    const { items, ...invoiceData } = parsed;
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        ...invoiceData,
        paid_at: invoiceData.status === "paid" && !invoiceData.paid_at ? new Date().toISOString() : invoiceData.paid_at,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // 2. Insert line items
    const lineItems = items.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      sort_order: item.sort_order,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(lineItems);

    if (itemsError) {
      // Rollback on line item insert failure
      await supabase.from("invoices").delete().eq("id", invoice.id);
      throw itemsError;
    }

    // 3. Return the fully formed invoice
    const { data: finalInvoice, error: finalError } = await supabase
      .from("invoices")
      .select("*, client:clients(*), items:invoice_items(*)")
      .eq("id", invoice.id)
      .single();

    if (finalError) throw finalError;

    return NextResponse.json(finalInvoice, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to create invoice" }, { status: 500 });
  }
}
