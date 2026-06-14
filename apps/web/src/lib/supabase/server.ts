import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './types';

// Server-only Supabase client. We use Supabase purely as a Postgres database
// (no Supabase Auth / RLS), so every call runs with the service secret key and
// authorization is the app's responsibility. NEVER import this from a Client
// Component — the secret key must not reach the browser.

let cached: SupabaseClient<Database> | null = null;

export function db(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in apps/web/.env (see .env.example).',
    );
  }

  cached = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
