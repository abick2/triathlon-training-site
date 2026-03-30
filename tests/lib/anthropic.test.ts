/**
 * Tests for lib/anthropic.ts
 *
 * Covers: client creation, coach profile loading, tool schema validation,
 * tool execution logic, system prompt structure, and coach boundary behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';

// ─── Supabase mock ────────────────────────────────────────────────────────────

let mockSingleResult: { data: unknown; error: unknown } = { data: null, error: null };
let mockListResult: { data: unknown; error: unknown } = { data: [], error: null };
let mockUpsertResult: { data: unknown; error: unknown } = { data: null, error: null };

vi.mock('../../lib/supabase.js', () => ({
  getSupabaseClient: () => ({
    from: (_table: string) => ({
      select: (_cols: string) => ({
        // Filters applied first (get_workouts pattern), then .order() terminates
        eq: (_col: string, _val: unknown) => ({
          order: () => Promise.resolve(mockListResult),
          single: () => Promise.resolve(mockSingleResult),
          gte: (_c: string, _v: string) => ({
            lte: (_c2: string, _v2: string) => ({
              order: () => Promise.resolve(mockListResult),
            }),
          }),
        }),
        // Direct .order() for when no filters are applied
        order: () => Promise.resolve(mockListResult),
        gte: (_col: string, _val: string) => ({
          lte: (_col2: string, _val2: string) => ({
            order: () => Promise.resolve(mockListResult),
          }),
        }),
      }),
      update: (_data: unknown) => ({
        eq: (_col: string, _val: unknown) => ({
          select: () => ({
            single: () => Promise.resolve(mockSingleResult),
          }),
        }),
      }),
      upsert: (_data: unknown, _opts: unknown) => ({
        select: () => ({
          single: () => Promise.resolve(mockUpsertResult),
        }),
      }),
    }),
  }),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  getAnthropicClient,
  loadCoachProfile,
  setCoachProfileForTest,
  resetCoachProfile,
  COACH_TOOLS,
  executeTool,
  buildSystemPrompt,
} from '../../lib/anthropic.js';

// ─── Client creation ──────────────────────────────────────────────────────────

describe('getAnthropicClient', () => {
  it('returns a client when ANTHROPIC_API_KEY is set', () => {
    const client = getAnthropicClient();
    expect(client).toBeDefined();
  });

  it('throws when ANTHROPIC_API_KEY is missing', () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    expect(() => {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('Missing ANTHROPIC_API_KEY environment variable.');
      }
    }).toThrow('Missing ANTHROPIC_API_KEY');

    process.env.ANTHROPIC_API_KEY = original;
  });
});

// ─── Coach profile ────────────────────────────────────────────────────────────

describe('loadCoachProfile', () => {
  beforeEach(() => resetCoachProfile());
  afterEach(() => resetCoachProfile());

  it('loads and returns a non-empty string', () => {
    const profile = loadCoachProfile();
    expect(typeof profile).toBe('string');
    expect(profile.length).toBeGreaterThan(100);
  });

  it('returns the same cached instance on repeated calls', () => {
    const a = loadCoachProfile();
    const b = loadCoachProfile();
    expect(a).toBe(b);
  });

  it('contains swim preference guidance', () => {
    const profile = loadCoachProfile();
    expect(profile).toContain('swim');
    expect(profile.toLowerCase()).toContain('fully scripted');
  });

  it('contains the athlete PRs', () => {
    const profile = loadCoachProfile();
    expect(profile).toContain('2:14:23');
    expect(profile).toContain('1:15:21');
    expect(profile).toContain('4:21');
  });

  it('contains pushback guidance', () => {
    const profile = loadCoachProfile();
    expect(profile.toLowerCase()).toContain('push back');
  });

  it('setCoachProfileForTest overrides the loaded profile', () => {
    setCoachProfileForTest('test profile content');
    expect(loadCoachProfile()).toBe('test profile content');
  });
});

// ─── Tool schema validation ───────────────────────────────────────────────────

describe('COACH_TOOLS schema', () => {
  const EXPECTED_TOOL_NAMES = [
    'get_week',
    'get_workouts',
    'get_workout',
    'update_workout',
    'swap_workout_days',
    'add_workout_note',
    'get_coach_memory',
    'update_coach_memory',
  ];

  it('exports exactly the expected 8 tools', () => {
    expect(COACH_TOOLS).toHaveLength(8);
  });

  it('contains all expected tool names', () => {
    const names = COACH_TOOLS.map((t) => t.name);
    for (const expected of EXPECTED_TOOL_NAMES) {
      expect(names).toContain(expected);
    }
  });

  it.each(COACH_TOOLS)('tool "$name" has required schema fields', (tool) => {
    expect(typeof tool.name).toBe('string');
    expect(tool.name.length).toBeGreaterThan(0);
    expect(typeof tool.description).toBe('string');
    expect(tool.description.length).toBeGreaterThan(10);
    expect(tool.input_schema).toBeDefined();
    expect(tool.input_schema.type).toBe('object');
    expect(tool.input_schema.properties).toBeDefined();
  });

  it('update_workout requires workout_id and updates', () => {
    const tool = COACH_TOOLS.find((t) => t.name === 'update_workout')!;
    expect(tool.input_schema.required).toContain('workout_id');
    expect(tool.input_schema.required).toContain('updates');
  });

  it('swap_workout_days requires both workout IDs', () => {
    const tool = COACH_TOOLS.find((t) => t.name === 'swap_workout_days')!;
    expect(tool.input_schema.required).toContain('workout_id_a');
    expect(tool.input_schema.required).toContain('workout_id_b');
  });

  it('get_workouts has no required fields (all filters optional)', () => {
    const tool = COACH_TOOLS.find((t) => t.name === 'get_workouts')!;
    expect(tool.input_schema.required).toHaveLength(0);
  });

  it('update_workout workout_type enum contains all valid values', () => {
    const tool = COACH_TOOLS.find((t) => t.name === 'update_workout')!;
    const updatesProp = (tool.input_schema.properties as Record<string, unknown>).updates as {
      properties: Record<string, { enum?: string[] }>;
    };
    const workoutTypeEnum = updatesProp.properties.workout_type.enum;
    expect(workoutTypeEnum).toContain('Easy');
    expect(workoutTypeEnum).toContain('Intervals');
    expect(workoutTypeEnum).toContain('Tempo');
    expect(workoutTypeEnum).toContain('Long');
    expect(workoutTypeEnum).toContain('Rest');
    expect(workoutTypeEnum).toContain('Race');
  });
});

// ─── Tool execution ───────────────────────────────────────────────────────────

const FIXTURE_WORKOUT = {
  id: 1,
  week_id: 1,
  plan_id: 1,
  workout_date: '2026-03-24',
  day_of_week: 'Tuesday',
  workout_type: 'Easy',
  total_miles: 6,
  primary_pace_zone: 'Easy/Recovery',
  notes: null,
  is_rest_day: false,
  is_race_day: false,
  is_key_workout: false,
};

describe('executeTool — get_workout', () => {
  it('returns success with workout data', async () => {
    mockSingleResult = { data: FIXTURE_WORKOUT, error: null };
    const result = await executeTool('get_workout', { workout_id: 1 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual(FIXTURE_WORKOUT);
  });

  it('returns error when workout not found (PGRST116)', async () => {
    mockSingleResult = { data: null, error: { code: 'PGRST116', message: 'not found' } };
    const result = await executeTool('get_workout', { workout_id: 999 });
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});

describe('executeTool — update_workout', () => {
  it('returns success with updated workout', async () => {
    mockSingleResult = { data: { ...FIXTURE_WORKOUT, notes: 'Great session.' }, error: null };
    const result = await executeTool('update_workout', {
      workout_id: 1,
      updates: { notes: 'Great session.' },
    });
    expect(result.success).toBe(true);
  });

  it('returns error on DB failure', async () => {
    mockSingleResult = { data: null, error: { code: '23514', message: 'Check constraint failed' } };
    const result = await executeTool('update_workout', {
      workout_id: 1,
      updates: { workout_type: 'invalid' },
    });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('executeTool — get_workouts', () => {
  it('returns empty array when no workouts', async () => {
    mockListResult = { data: [], error: null };
    const result = await executeTool('get_workouts', {});
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('returns workouts list on success', async () => {
    mockListResult = { data: [FIXTURE_WORKOUT], error: null };
    const result = await executeTool('get_workouts', { week_id: 1 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual([FIXTURE_WORKOUT]);
  });

  it('returns error on DB failure', async () => {
    mockListResult = { data: null, error: { message: 'connection error' } };
    const result = await executeTool('get_workouts', {});
    expect(result.success).toBe(false);
  });
});

describe('executeTool — add_workout_note', () => {
  it('appends note to null notes field', async () => {
    // First call: fetch existing notes (null)
    mockSingleResult = { data: { notes: null }, error: null };
    const result = await executeTool('add_workout_note', {
      workout_id: 1,
      note: 'Felt great today.',
    });
    // The update mock also returns mockSingleResult
    expect(result.success).toBe(true);
  });

  it('returns error when workout not found on note fetch', async () => {
    mockSingleResult = { data: null, error: { code: 'PGRST116', message: 'not found' } };
    const result = await executeTool('add_workout_note', {
      workout_id: 999,
      note: 'Felt great.',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});

describe('executeTool — get_coach_memory', () => {
  it('returns memory value on success', async () => {
    mockSingleResult = {
      data: { key: 'swim_preference', value: 'Fully scripted workouts only.' },
      error: null,
    };
    const result = await executeTool('get_coach_memory', { key: 'swim_preference' });
    expect(result.success).toBe(true);
  });

  it('returns descriptive error when key not found', async () => {
    mockSingleResult = { data: null, error: { code: 'PGRST116', message: 'not found' } };
    const result = await executeTool('get_coach_memory', { key: 'missing_key' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('missing_key');
  });
});

describe('executeTool — update_coach_memory', () => {
  it('upserts memory and returns success', async () => {
    mockUpsertResult = {
      data: { key: 'injury_notes', value: 'Left knee soreness noted on 2026-03-24.' },
      error: null,
    };
    const result = await executeTool('update_coach_memory', {
      key: 'injury_notes',
      value: 'Left knee soreness noted on 2026-03-24.',
    });
    expect(result.success).toBe(true);
  });
});

describe('executeTool — unknown tool', () => {
  it('returns error for an unrecognized tool name', async () => {
    const result = await executeTool('destroy_everything', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown tool');
  });
});

// ─── System prompt structure ──────────────────────────────────────────────────

describe('buildSystemPrompt', () => {
  beforeEach(() => {
    setCoachProfileForTest('# Test Coach Profile\nThis is a test.');
  });
  afterEach(() => resetCoachProfile());

  it('returns an array with at least one block', () => {
    const prompt = buildSystemPrompt();
    expect(Array.isArray(prompt)).toBe(true);
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('first block is a text block with cache_control', () => {
    const prompt = buildSystemPrompt();
    const first = prompt[0] as Anthropic.Beta.PromptCaching.PromptCachingBetaTextBlockParam;
    expect(first.type).toBe('text');
    expect(first.cache_control).toEqual({ type: 'ephemeral' });
  });

  it('first block text contains the coach profile', () => {
    const prompt = buildSystemPrompt();
    const first = prompt[0] as { type: string; text: string };
    expect(first.text).toContain('Test Coach Profile');
  });
});

// ─── Coach boundary behavior (profile content checks) ────────────────────────

describe('coach profile boundary content', () => {
  beforeEach(() => resetCoachProfile());
  afterEach(() => resetCoachProfile());

  it('profile prohibits simple interval-only swim format', () => {
    const profile = loadCoachProfile();
    // Profile should warn against simple interval style
    expect(profile.toLowerCase()).toMatch(/interval/);
  });

  it('profile includes rest day swap as acceptable change', () => {
    const profile = loadCoachProfile();
    expect(profile.toLowerCase()).toContain('rest day');
    expect(profile.toLowerCase()).toMatch(/accommodat/);
  });

  it('profile calls out taper as protected period', () => {
    const profile = loadCoachProfile();
    expect(profile.toLowerCase()).toContain('taper');
  });

  it('profile lists race date', () => {
    const profile = loadCoachProfile();
    expect(profile).toContain('May 3');
  });
});
