import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateClientSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  currency: z.string().optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "lead"]).optional(),
  tags: z.array(z.string()).optional(),
  total_billed: z.number().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Client not found" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = updateClientSchema.parse(body);
    const supabase = createClient();

    const updateData = { ...parsed };
    if (parsed.email === "") {
      updateData.email = null;
    }

    const { data, error } = await supabase
      .from("clients")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    
    // Manually cascade delete to prevent orphaned data
    await supabase.from("documents").delete().eq("client_id", params.id);
    await supabase.from("time_entries").delete().eq("client_id", params.id);
    await supabase.from("invoices").delete().eq("client_id", params.id);

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete client" }, { status: 500 });
  }
}
