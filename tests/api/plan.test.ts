/**
 * Tests for GET /api/plan
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fixturePlanWithPaceTargets } from '../fixtures/index.js';

// ─── Mock Supabase ────────────────────────────────────────────────────────────

const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock('../../lib/supabase.js', () => ({
  getSupabaseClient: () => ({ from: mockFrom }),
}));

function setupSupabaseChain(result: { data: unknown; error: unknown }) {
  mockSingle.mockReturnValue(result);
  mockSelect.mockReturnValue({ single: mockSingle });
  mockFrom.mockReturnValue({ select: mockSelect });
}

function makeResMock() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
  return res as unknown as VercelResponse;
}

function makeReq(method = 'GET'): VercelRequest {
  return { method, query: {}, body: null } as unknown as VercelRequest;
}

// ─── Import handler (after mocks are set up) ─────────────────────────────────

let handler: typeof import('../../api/plan/index.js').default;

beforeEach(async () => {
  vi.resetModules();
  vi.mock('../../lib/supabase.js', () => ({
    getSupabaseClient: () => ({ from: mockFrom }),
  }));
  handler = (await import('../../api/plan/index.js')).default;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/plan', () => {
  it('returns 200 with plan and pace targets on success', async () => {
    setupSupabaseChain({ data: fixturePlanWithPaceTargets, error: null });

    const res = makeResMock();
    await handler(makeReq('GET'), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fixturePlanWithPaceTargets);
  });

  it('returns 404 when no plan exists (PGRST116)', async () => {
    setupSupabaseChain({ data: null, error: { code: 'PGRST116', message: 'not found' } });

    const res = makeResMock();
    await handler(makeReq('GET'), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No training plan found' });
  });

  it('returns 500 when Supabase returns an error', async () => {
    setupSupabaseChain({ data: null, error: { message: 'DB connection failed' } });

    const res = makeResMock();
    await handler(makeReq('GET'), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch plan' });
  });

  it('returns 405 for non-GET methods', async () => {
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      const res = makeResMock();
      await handler(makeReq(method), res);
      expect(res.status).toHaveBeenCalledWith(405);
    }
  });

  it('returned plan includes pace_targets array', async () => {
    setupSupabaseChain({ data: fixturePlanWithPaceTargets, error: null });

    const res = makeResMock();
    await handler(makeReq('GET'), res);

    const callArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(Array.isArray(callArg.pace_targets)).toBe(true);
    expect(callArg.pace_targets.length).toBeGreaterThan(0);
  });
});
