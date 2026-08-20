import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().default("INR"),
  category: z.enum(["software", "travel", "marketing", "equipment", "other"]).default("other"),
  date: z.string(),
  notes: z.string().optional().nullable(),
  receipt_url: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = expenseSchema.parse(body);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("expenses")
      .insert(parsed)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to create expense" }, { status: 500 });
  }
}
