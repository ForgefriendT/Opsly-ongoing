import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const documentSchema = z.object({
  client_id: z.string().uuid().optional().nullable(),
  template_type: z.enum(["nda", "service_agreement", "freelance_contract", "payment_terms", "scope_of_work"]),
  title: z.string().min(1, "Title is required"),
  content: z.record(z.string()),
  status: z.enum(["draft", "sent", "signed"]).default("draft"),
  pdf_url: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*, client:clients(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = documentSchema.parse(body);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("documents")
      .insert(parsed)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to create document" }, { status: 500 });
  }
}
