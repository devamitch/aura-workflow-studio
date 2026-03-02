import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const fallbackUrl = "https://placeholder.supabase.co";
const fallbackAnonKey = "public-anon-key-not-configured";

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    "Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable auth.",
  );
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl! : fallbackUrl,
  isSupabaseConfigured ? supabaseAnonKey! : fallbackAnonKey,
  isSupabaseConfigured
    ? undefined
    : {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
);
