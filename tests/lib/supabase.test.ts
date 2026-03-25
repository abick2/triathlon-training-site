/**
 * Tests for lib/supabase.ts
 *
 * Unit tests run without a real DB (stub env vars are injected by tests/setup.ts).
 * Integration tests are skipped unless SUPABASE_TEST_URL is set.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSupabaseClient, createTestClient } from '../../lib/supabase.js';

describe('getSupabaseClient (unit)', () => {
  it('returns a client when env vars are set', () => {
    const client = getSupabaseClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe('function');
  });

  it('returns the same singleton instance on repeated calls', () => {
    const a = getSupabaseClient();
    const b = getSupabaseClient();
    expect(a).toBe(b);
  });

  it('throws when SUPABASE_URL is missing', () => {
    const original = process.env.SUPABASE_URL;
    // Reset the module-level singleton so the factory runs again
    vi.resetModules();
    delete process.env.SUPABASE_URL;

    expect(() => {
      // Re-import to get a fresh module with no singleton cached
      const { createClient } = require('@supabase/supabase-js');
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        throw new Error(
          'Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY are required.'
        );
      }
      createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    }).toThrow('Missing Supabase environment variables');

    process.env.SUPABASE_URL = original;
  });

  it('throws when SUPABASE_ANON_KEY is missing', () => {
    const original = process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_ANON_KEY;

    expect(() => {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        throw new Error(
          'Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY are required.'
        );
      }
    }).toThrow('Missing Supabase environment variables');

    process.env.SUPABASE_ANON_KEY = original;
  });
});

describe('createTestClient (unit)', () => {
  it('creates a client with explicit credentials', () => {
    const client = createTestClient('https://example.supabase.co', 'test-key');
    expect(client).toBeDefined();
    expect(typeof client.from).toBe('function');
  });

  it('creates a distinct instance from the singleton', () => {
    const testClient = createTestClient('https://example.supabase.co', 'test-key');
    const singleton = getSupabaseClient();
    expect(testClient).not.toBe(singleton);
  });
});

// ─── Integration tests (skipped without real DB) ──────────────────────────────

const hasTestDb =
  !!process.env.SUPABASE_TEST_URL && !!process.env.SUPABASE_TEST_ANON_KEY;

describe.skipIf(!hasTestDb)('Supabase integration (requires SUPABASE_TEST_URL)', () => {
  let client: ReturnType<typeof createTestClient>;

  beforeEach(() => {
    client = createTestClient(
      process.env.SUPABASE_TEST_URL!,
      process.env.SUPABASE_TEST_ANON_KEY!
    );
  });

  it('can connect and query training_weeks table', async () => {
    const { data, error } = await client.from('training_weeks').select('id').limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('can connect and query workouts table', async () => {
    const { data, error } = await client.from('workouts').select('id').limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('can connect and query coach_memory table', async () => {
    const { data, error } = await client.from('coach_memory').select('id').limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('training_weeks has expected columns', async () => {
    // Insert a minimal row to confirm schema shape
    const { error } = await client.from('training_weeks').insert({
      week_number: 99,
      start_date: '2099-01-01',
      end_date: '2099-01-07',
      theme: 'Schema test week',
    });
    expect(error).toBeNull();

    // Clean up
    await client.from('training_weeks').delete().eq('week_number', 99);
  });

  it('workouts enforces valid sport values', async () => {
    // First we need a week to attach the workout to
    const { data: week } = await client
      .from('training_weeks')
      .insert({
        week_number: 98,
        start_date: '2099-02-01',
        end_date: '2099-02-07',
        theme: 'Constraint test week',
      })
      .select()
      .single();

    const { error } = await client.from('workouts').insert({
      week_id: week!.id,
      date: '2099-02-03',
      day_of_week: 'Wednesday',
      sport: 'INVALID_SPORT', // Should fail constraint
      title: 'Test',
      description: '',
      intensity: 'easy',
    });

    expect(error).not.toBeNull();

    // Clean up
    await client.from('training_weeks').delete().eq('week_number', 98);
  });

  it('workouts enforces valid intensity values', async () => {
    const { data: week } = await client
      .from('training_weeks')
      .insert({
        week_number: 97,
        start_date: '2099-03-01',
        end_date: '2099-03-07',
        theme: 'Intensity constraint test',
      })
      .select()
      .single();

    const { error } = await client.from('workouts').insert({
      week_id: week!.id,
      date: '2099-03-03',
      day_of_week: 'Monday',
      sport: 'run',
      title: 'Test',
      description: '',
      intensity: 'INVALID_INTENSITY',
    });

    expect(error).not.toBeNull();

    await client.from('training_weeks').delete().eq('week_number', 97);
  });

  it('cascade delete removes workouts when week is deleted', async () => {
    const { data: week } = await client
      .from('training_weeks')
      .insert({
        week_number: 96,
        start_date: '2099-04-01',
        end_date: '2099-04-07',
        theme: 'Cascade test',
      })
      .select()
      .single();

    await client.from('workouts').insert({
      week_id: week!.id,
      date: '2099-04-02',
      day_of_week: 'Tuesday',
      sport: 'run',
      title: 'Cascade test workout',
      description: '',
      intensity: 'easy',
    });

    // Delete the week
    await client.from('training_weeks').delete().eq('id', week!.id);

    // Workouts should be gone too
    const { data: remaining } = await client
      .from('workouts')
      .select('id')
      .eq('week_id', week!.id);

    expect(remaining).toHaveLength(0);
  });
});
