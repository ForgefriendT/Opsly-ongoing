import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateDocumentSchema = z.object({
  client_id: z.string().uuid().optional().nullable(),
  template_type: z.enum(["nda", "service_agreement", "freelance_contract", "payment_terms", "scope_of_work"]).optional(),
  title: z.string().min(1).optional(),
  content: z.record(z.string()).optional(),
  status: z.enum(["draft", "sent", "signed"]).optional(),
  pdf_url: z.string().optional().nullable(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = updateDocumentSchema.parse(body);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("documents")
      .update(parsed)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete document" }, { status: 500 });
  }
}
