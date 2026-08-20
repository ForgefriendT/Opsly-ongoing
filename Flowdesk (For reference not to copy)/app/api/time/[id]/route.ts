import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateTimeEntrySchema = z.object({
  client_id: z.string().uuid().optional().nullable(),
  invoice_id: z.string().uuid().optional().nullable(),
  description: z.string().min(1).optional(),
  date: z.string().optional(),
  hours: z.number().positive().optional(),
  rate: z.number().optional().nullable(),
  billed: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = updateTimeEntrySchema.parse(body);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("time_entries")
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
    return NextResponse.json({ error: err.message || "Failed to update time entry" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("time_entries")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete time entry" }, { status: 500 });
  }
}
