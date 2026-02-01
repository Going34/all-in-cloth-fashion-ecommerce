import 'server-only';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getJwtRole(jwt: string): string | null {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const json = Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const parsed = JSON.parse(json) as { role?: string } | null;
    return parsed?.role ?? null;
  } catch {
    return null;
  }
}

export function getAdminDbClient() {
  if (!supabaseUrl) {
    throw new Error(
      'Supabase URL not configured. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL).'
    );
  }
  if (!supabaseServiceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY not configured. This is required for server-side auth routes.'
    );
  }

  const role = getJwtRole(supabaseServiceRoleKey);
  if (role && role !== 'service_role') {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY must be a service_role key (got role "${role}"). ` +
      'Open Supabase Dashboard → Project Settings → API → Project API keys → service_role.'
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}




