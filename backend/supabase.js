import "dotenv/config"; // ✅ MUST BE FIRST LINE

import { createClient } from "@supabase/supabase-js";

/*
  IMPORTANT:
  dotenv MUST load before reading process.env
*/

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ SUPABASE_URL missing from .env");
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error("❌ SUPABASE_ANON_KEY missing from .env");
  process.exit(1);
}

/* Public client (for inserts where RLS allows) */
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* Admin client (for server-side reads) */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  { auth: { persistSession: false } }
);

export default supabase;
 