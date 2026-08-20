import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const itemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit_price: z.number().nonnegative("Price cannot be negative"),
  sort_order: z.number().default(0),
});

const updateInvoiceSchema = z.object({
  invoice_number: z.string().min(1).optional(),
  client_id: z.string().uuid().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  issue_date: z.string().optional(),
  due_date: z.string().optional(),
  currency: z.string().optional(),
  subtotal: z.number().optional(),
  tax_rate: z.number().optional(),
  tax_amount: z.number().optional(),
  discount: z.number().optional(),
  total: z.number().optional(),
  notes: z.string().optional().nullable(),
  payment_terms: z.string().optional().nullable(),
  paid_at: z.string().optional().nullable(),
  items: z.array(itemSchema).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("*, client:clients(*), items:invoice_items(*)")
      .eq("id", params.id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invoice not found" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = updateInvoiceSchema.parse(body);
    const supabase = createClient();

    const { items, ...invoiceData } = parsed;

    // Handle paid timestamp
    if (invoiceData.status === "paid") {
      if (!invoiceData.paid_at) {
        invoiceData.paid_at = new Date().toISOString();
      }
    } else if (invoiceData.status && invoiceData.status !== "paid") {
      invoiceData.paid_at = null;
    }

    // 1. Update the base invoice details
    const { error: invoiceError } = await supabase
      .from("invoices")
      .update(invoiceData)
      .eq("id", params.id);

    if (invoiceError) throw invoiceError;

    // 2. If line items were edited/sent, replace all existing ones
    if (items) {
      const { error: deleteError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", params.id);

      if (deleteError) throw deleteError;

      const lineItems = items.map((item) => ({
        invoice_id: params.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        sort_order: item.sort_order,
      }));

      const { error: insertError } = await supabase
        .from("invoice_items")
        .insert(lineItems);

      if (insertError) throw insertError;
    }

    // 3. Return the fully updated record
    const { data: finalInvoice, error: finalError } = await supabase
      .from("invoices")
      .select("*, client:clients(*), items:invoice_items(*)")
      .eq("id", params.id)
      .single();

    if (finalError) throw finalError;

    return NextResponse.json(finalInvoice);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete invoice" }, { status: 500 });
  }
}
