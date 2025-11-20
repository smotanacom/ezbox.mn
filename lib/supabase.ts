import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Check if we're on the server (not in the browser)
const isServer = typeof window === 'undefined';

// Only validate service key on the server
if (isServer && (!supabaseServiceKey || supabaseServiceKey === 'your-service-role-key-here' || supabaseServiceKey.trim() === '')) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required. Get it from Supabase Dashboard → Settings → API → service_role key');
}

// Client for frontend (anon key, restricted by RLS)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Client for backend (service role key, bypasses RLS)
// On client-side, this will use anon key (but should never be called from client)
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
