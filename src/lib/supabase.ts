import { createClient } from "@supabase/supabase-js";

// Fetch Vite environment variables
const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL as string) || "";
const supabaseAnonKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || "";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "ASTEYA Core NOTICE: Supabase credentials not fully configured in environment variables. Engagement of offline in-memory gemology caches active."
  );
}

// Instantiate Supabase Client (if keys configured) or mock
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);
