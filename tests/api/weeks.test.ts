/**
 * Tests for GET /api/weeks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fixtureWeekWithWorkouts } from '../fixtures/index.js';

// ─── Mock Supabase ────────────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();

vi.mock('../../lib/supabase.js', () => ({
  getSupabaseClient: () => ({ from: mockFrom }),
}));

// Chain: .from().select().order().order()
function setupSupabaseChain(result: { data: unknown; error: unknown }) {
  mockOrder.mockReturnValue(result);
  const orderFirst = vi.fn().mockReturnValue({ order: mockOrder });
  mockSelect.mockReturnValue({ order: orderFirst });
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

let handler: typeof import('../../api/weeks/index.js').default;

beforeEach(async () => {
  vi.resetModules();
  vi.mock('../../lib/supabase.js', () => ({
    getSupabaseClient: () => ({ from: mockFrom }),
  }));
  handler = (await import('../../api/weeks/index.js')).default;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/weeks', () => {
  it('returns 200 with array of weeks on success', async () => {
    setupSupabaseChain({ data: [fixtureWeekWithWorkouts], error: null });

    const req = makeReq('GET');
    const res = makeResMock();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([fixtureWeekWithWorkouts]);
  });

  it('returns 200 with empty array when no weeks exist', async () => {
    setupSupabaseChain({ data: [], error: null });

    const req = makeReq('GET');
    const res = makeResMock();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('returns 500 when Supabase returns an error', async () => {
    setupSupabaseChain({ data: null, error: { message: 'DB connection failed' } });

    const req = makeReq('GET');
    const res = makeResMock();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch weeks' });
  });

  it('returns 405 for non-GET methods', async () => {
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      const req = makeReq(method);
      const res = makeResMock();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
    }
  });
});
