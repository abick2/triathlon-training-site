import { createClient, SupabaseClient } from '@supabase/supabase-js';

function createSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY are required.'
    );
  }

  return createClient(url, key);
}

// Singleton for use in API routes
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createSupabaseClient();
  }
  return _client;
}

// Named factory for test injection — pass test env vars explicitly
export function createTestClient(url: string, key: string): SupabaseClient {
  return createClient(url, key);
}
