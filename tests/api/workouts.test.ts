/**
 * Tests for GET/POST /api/workouts and GET/PUT/DELETE /api/workouts/[id]
 *
 * Mock strategy: vi.mock() is hoisted to the top of the module.
 * Each describe block controls the mock's resolved values via the shared
 * `mockListResult` / `mockSingleResult` objects.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  fixtureWorkoutEasy,
  fixtureWorkoutRest,
  fixtureWorkoutWithSegments,
  fixtureCreateWorkoutBody,
  fixtureUpdateWorkoutBody,
  FIXTURE_WORKOUT_ID,
} from '../fixtures/index.js';

// ─── Shared mock state ────────────────────────────────────────────────────────

let mockListResult: { data: unknown; error: unknown } = { data: [], error: null };
let mockSingleResult: { data: unknown; error: unknown } = { data: null, error: null };
let mockMutateResult: { data: unknown; error: unknown } = { data: null, error: null };
let mockDeleteResult: { error: unknown } = { error: null };

// ─── Supabase mock (hoisted) ──────────────────────────────────────────────────

vi.mock('../../lib/supabase.js', () => {
  return {
    getSupabaseClient: () => ({
      from: (_table: string) => ({
        // SELECT list: .select().order() or .select().eq().order()
        select: (_cols: string) => ({
          order: (_col: string) => Promise.resolve(mockListResult),
          eq: (_col: string, _val: unknown) => ({
            // GET [id] chain: .eq().order().single()
            order: () => ({
              single: () => Promise.resolve(mockSingleResult),
            }),
            // Also support .eq().single() for older patterns
            single: () => Promise.resolve(mockSingleResult),
          }),
          single: () => Promise.resolve(mockSingleResult),
        }),
        // INSERT: .insert().select().single()
        insert: (_data: unknown) => ({
          select: () => ({
            single: () => Promise.resolve(mockMutateResult),
          }),
        }),
        // UPDATE: .update().eq().select().single()
        update: (_data: unknown) => ({
          eq: (_col: string, _val: unknown) => ({
            select: () => ({
              single: () => Promise.resolve(mockMutateResult),
            }),
          }),
        }),
        // DELETE: .delete().eq()
        delete: () => ({
          eq: (_col: string, _val: unknown) => Promise.resolve(mockDeleteResult),
        }),
      }),
    }),
  };
});

// ─── Lazy imports (after mock is set up) ─────────────────────────────────────

import handler from '../../api/workouts/index.js';
import idHandler from '../../api/workouts/[id].js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeResMock(): VercelResponse {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
  return res as unknown as VercelResponse;
}

function makeReq(method: string, body?: unknown, query?: Record<string, string>): VercelRequest {
  return { method, body: body ?? null, query: query ?? {} } as unknown as VercelRequest;
}

// ─── GET /api/workouts ────────────────────────────────────────────────────────

describe('GET /api/workouts', () => {
  it('returns 200 with workout list', async () => {
    mockListResult = { data: [fixtureWorkoutEasy, fixtureWorkoutRest], error: null };

    const res = makeResMock();
    await handler(makeReq('GET'), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([fixtureWorkoutEasy, fixtureWorkoutRest]);
  });

  it('returns 200 with empty array when no workouts', async () => {
    mockListResult = { data: [], error: null };

    const res = makeResMock();
    await handler(makeReq('GET'), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('returns 500 on DB error', async () => {
    mockListResult = { data: null, error: { message: 'DB connection failed' } };

    const res = makeResMock();
    await handler(makeReq('GET'), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch workouts' });
  });

  it('returns 405 for non-GET/POST methods', async () => {
    for (const method of ['PUT', 'DELETE', 'PATCH']) {
      const res = makeResMock();
      await handler(makeReq(method), res);
      expect(res.status).toHaveBeenCalledWith(405);
    }
  });
});

// ─── POST /api/workouts — validation ─────────────────────────────────────────

describe('POST /api/workouts — input validation', () => {
  it('returns 400 when body is missing', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', null), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when week_id is missing', async () => {
    const { week_id: _, ...noWeekId } = fixtureCreateWorkoutBody;
    const res = makeResMock();
    await handler(makeReq('POST', noWeekId), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('week_id') })
    );
  });

  it('returns 400 for invalid workout_type', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', { ...fixtureCreateWorkoutBody, workout_type: 'Yoga' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('workout_type') })
    );
  });

  it('returns 400 for malformed workout_date', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', { ...fixtureCreateWorkoutBody, workout_date: '3/30/2026' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('workout_date') })
    );
  });

  it('returns 400 for invalid day_of_week', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', { ...fixtureCreateWorkoutBody, day_of_week: 'Blursday' as never }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for negative total_miles', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', { ...fixtureCreateWorkoutBody, total_miles: -5 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('allows null total_miles', async () => {
    mockMutateResult = { data: { ...fixtureWorkoutRest }, error: null };
    const res = makeResMock();
    await handler(makeReq('POST', { ...fixtureCreateWorkoutBody, total_miles: null }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 201 for a valid body', async () => {
    mockMutateResult = { data: fixtureWorkoutEasy, error: null };

    const res = makeResMock();
    await handler(makeReq('POST', fixtureCreateWorkoutBody), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fixtureWorkoutEasy);
  });

  it('returns 404 when week_id foreign key not found', async () => {
    mockMutateResult = { data: null, error: { code: '23503', message: 'FK violation' } };

    const res = makeResMock();
    await handler(makeReq('POST', fixtureCreateWorkoutBody), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'week_id or plan_id not found' });
  });
});

// ─── GET /api/workouts/[id] ───────────────────────────────────────────────────

describe('GET /api/workouts/[id]', () => {
  it('returns 400 for a non-integer id', async () => {
    const res = makeResMock();
    await idHandler(makeReq('GET', null, { id: 'not-an-int' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('integer') })
    );
  });

  it('returns 400 for zero id', async () => {
    const res = makeResMock();
    await idHandler(makeReq('GET', null, { id: '0' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when workout not found (PGRST116)', async () => {
    mockSingleResult = { data: null, error: { code: 'PGRST116', message: 'not found' } };

    const res = makeResMock();
    await idHandler(makeReq('GET', null, { id: String(FIXTURE_WORKOUT_ID) }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Workout not found' });
  });

  it('returns 200 with workout and segments on success', async () => {
    mockSingleResult = { data: fixtureWorkoutWithSegments, error: null };

    const res = makeResMock();
    await idHandler(makeReq('GET', null, { id: String(FIXTURE_WORKOUT_ID) }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fixtureWorkoutWithSegments);
  });
});

// ─── PUT /api/workouts/[id] ───────────────────────────────────────────────────

describe('PUT /api/workouts/[id] — input validation', () => {
  it('returns 400 for empty body', async () => {
    const res = makeResMock();
    await idHandler(makeReq('PUT', {}, { id: String(FIXTURE_WORKOUT_ID) }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for invalid workout_type', async () => {
    const res = makeResMock();
    await idHandler(makeReq('PUT', { workout_type: 'Yoga' }, { id: String(FIXTURE_WORKOUT_ID) }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('workout_type') })
    );
  });

  it('returns 400 for non-boolean is_rest_day', async () => {
    const res = makeResMock();
    await idHandler(makeReq('PUT', { is_rest_day: 'yes' }, { id: String(FIXTURE_WORKOUT_ID) }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for invalid workout_date format', async () => {
    const res = makeResMock();
    await idHandler(makeReq('PUT', { workout_date: '30-03-2026' }, { id: String(FIXTURE_WORKOUT_ID) }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for negative total_miles', async () => {
    const res = makeResMock();
    await idHandler(makeReq('PUT', { total_miles: -1 }, { id: String(FIXTURE_WORKOUT_ID) }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('allows null total_miles in an update', async () => {
    mockMutateResult = { data: { ...fixtureWorkoutRest }, error: null };

    const res = makeResMock();
    await idHandler(makeReq('PUT', { total_miles: null }, { id: String(FIXTURE_WORKOUT_ID) }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 200 for a valid partial update (notes)', async () => {
    mockMutateResult = { data: { ...fixtureWorkoutEasy, notes: 'Felt great.' }, error: null };

    const res = makeResMock();
    await idHandler(makeReq('PUT', fixtureUpdateWorkoutBody, { id: String(FIXTURE_WORKOUT_ID) }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when updating a non-existent workout', async () => {
    mockMutateResult = { data: null, error: { code: 'PGRST116', message: 'not found' } };

    const res = makeResMock();
    await idHandler(makeReq('PUT', fixtureUpdateWorkoutBody, { id: String(FIXTURE_WORKOUT_ID) }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ─── DELETE /api/workouts/[id] ────────────────────────────────────────────────

describe('DELETE /api/workouts/[id]', () => {
  it('returns 204 on successful delete', async () => {
    mockDeleteResult = { error: null };

    const res = makeResMock();
    await idHandler(makeReq('DELETE', null, { id: String(FIXTURE_WORKOUT_ID) }), res);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('returns 400 for an invalid id', async () => {
    const res = makeResMock();
    await idHandler(makeReq('DELETE', null, { id: 'bad-id' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on DB error', async () => {
    mockDeleteResult = { error: { message: 'DB error' } };

    const res = makeResMock();
    await idHandler(makeReq('DELETE', null, { id: String(FIXTURE_WORKOUT_ID) }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── Unsupported method ───────────────────────────────────────────────────────

describe('[id] endpoint — method not allowed', () => {
  it('returns 405 for PATCH', async () => {
    const res = makeResMock();
    await idHandler(makeReq('PATCH', null, { id: String(FIXTURE_WORKOUT_ID) }), res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
