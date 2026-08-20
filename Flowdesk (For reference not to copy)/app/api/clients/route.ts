import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  currency: z.string().default("INR"),
  notes: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "lead"]).default("active"),
  tags: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = clientSchema.parse(body);
    const supabase = createClient();

    // Standardize empty strings as null
    const insertData = {
      ...parsed,
      email: parsed.email === "" ? null : parsed.email,
    };

    const { data, error } = await supabase
      .from("clients")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to create client" }, { status: 500 });
  }
}
