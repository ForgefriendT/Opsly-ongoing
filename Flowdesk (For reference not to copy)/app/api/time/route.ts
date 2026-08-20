import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const timeEntrySchema = z.object({
  client_id: z.string().uuid().optional().nullable(),
  invoice_id: z.string().uuid().optional().nullable(),
  description: z.string().min(1, "Description is required"),
  date: z.string(),
  hours: z.number().positive("Hours must be greater than 0"),
  rate: z.number().optional().nullable(),
  billed: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const client_id = searchParams.get("client_id");
    const billed = searchParams.get("billed");

    const supabase = createClient();
    let query = supabase
      .from("time_entries")
      .select("*, client:clients(*)")
      .order("date", { ascending: false });

    if (client_id) {
      query = query.eq("client_id", client_id);
    }
    if (billed !== null) {
      query = query.eq("billed", billed === "true");
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch time entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = timeEntrySchema.parse(body);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("time_entries")
      .insert(parsed)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to create time entry" }, { status: 500 });
  }
}
