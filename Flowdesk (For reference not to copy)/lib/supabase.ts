import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Creates and returns a client connected to the Supabase database.
 * Falls back safely with a warning if credentials are not configured.
 */
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === "undefined") {
      console.warn("WARNING: Supabase URL and/or Anon Key are missing in environment variables.");
    }
  }
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
