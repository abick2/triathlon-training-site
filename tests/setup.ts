/**
 * Global test setup for Vitest.
 * Sets stub environment variables so unit tests don't throw on client init.
 */
process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? 'test-anon-key';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? 'sk-ant-test';
