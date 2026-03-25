const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY   = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}

// ── Public client — respects RLS (used for anon operations) ──
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// ── Admin client — service_role key, bypasses ALL RLS ────────
// This is the ONLY client used by the backend.
// service_role key bypasses RLS at the Postgres level — no
// policy can block it. This is the correct pattern for a
// server-side API that enforces access control in middleware.
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      // Explicitly identify as service role to ensure RLS bypass
      'X-Client-Info': 'supabase-js-node/service-role'
    }
  }
});

module.exports = { supabase, supabaseAdmin };
