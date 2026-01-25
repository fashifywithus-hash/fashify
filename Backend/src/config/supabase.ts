import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL environment variable. Please add it to your .env file. See SETUP.md for instructions.");
}

if (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY. Please add at least one to your .env file. See SETUP.md for instructions.");
}

// Use service role key for admin operations, fallback to anon key
const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY || "";

export const supabase = createClient(SUPABASE_URL || "", supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
