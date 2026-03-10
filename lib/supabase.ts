// Re-export a singleton browser client for backward compatibility.
// Prefer importing createClient from lib/supabase-browser or lib/supabase-server directly.
import { createClient } from "@/lib/supabase-browser";
export const supabase = createClient();

export type TypedSupabaseClient = ReturnType<typeof createClient>;
export type { Database } from "@/types/database";
