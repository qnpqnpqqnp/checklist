import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Check .env.local exists and restart `npm run dev`."
  );
}

// createClient() throws synchronously if either argument is falsy. Falling
// back to placeholder strings here keeps that throw from happening at
// module-evaluation time (which would break hydration for every client
// component that imports this file, not just Supabase-dependent UI).
// Actual Supabase calls will still fail cleanly and surface through the
// normal { data, error } / toast error handling in lists-context.tsx.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.invalid",
  supabaseAnonKey || "placeholder"
);
