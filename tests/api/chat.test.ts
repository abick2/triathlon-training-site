/**
 * Tests for POST /api/chat
 *
 * We mock lib/anthropic entirely, giving us full control over the stream,
 * tool execution, and coach profile — no network calls, no filesystem reads.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Mock stream factory ──────────────────────────────────────────────────────
// Each test can call makeMockStream() to configure what Claude "returns".

interface StreamConfig {
  textDeltas?: string[];
  finalContent?: Array<{ type: string; [k: string]: unknown }>;
  stopReason?: string;
  rejectWith?: Error;
}

function makeMockStream(cfg: StreamConfig) {
  const { textDeltas = [], finalContent = [], stopReason = 'end_turn', rejectWith } = cfg;

  return {
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      if (event === 'text') {
        for (const t of textDeltas) cb(t);
      }
    }),
    finalMessage: rejectWith
      ? vi.fn().mockRejectedValue(rejectWith)
      : vi.fn().mockResolvedValue({ content: finalContent, stop_reason: stopReason }),
  };
}

// ─── Shared mock stream holder ────────────────────────────────────────────────
// The mock calls this factory; tests swap it out via mockStreamFactory.

let mockStreamFactory = () =>
  makeMockStream({
    textDeltas: ['Hello, '],
    finalContent: [{ type: 'text', text: 'Hello, coach.' }],
    stopReason: 'end_turn',
  });

// ─── Mock lib/anthropic.js ────────────────────────────────────────────────────

vi.mock('../../lib/anthropic.js', () => {
  const mockMessagesStream = vi.fn((..._args: unknown[]) => mockStreamFactory());

  return {
    getAnthropicClient: () => ({
      beta: {
        promptCaching: {
          messages: { stream: mockMessagesStream },
        },
      },
    }),
    buildSystemPrompt: () => [
      { type: 'text', text: 'Test coach profile', cache_control: { type: 'ephemeral' } },
    ],
    COACH_TOOLS: [],
    executeTool: vi.fn().mockResolvedValue({ success: true, data: { id: 'abc' } }),
    __messagesStream: mockMessagesStream,
  };
});

// ─── Import handler after mocks ───────────────────────────────────────────────

import handler from '../../api/chat.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sseWrites: string[] = [];

function makeResMock(): VercelResponse {
  sseWrites.length = 0;

  return {
    setHeader: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    write: vi.fn((chunk: string) => {
      sseWrites.push(chunk);
      return true;
    }),
    end: vi.fn().mockReturnThis(),
  } as unknown as VercelResponse;
}

function makeReq(method: string, body?: unknown): VercelRequest {
  return { method, body: body ?? null, query: {} } as unknown as VercelRequest;
}

function parseSseEvents(): Array<Record<string, unknown>> {
  return sseWrites
    .join('')
    .split('\n\n')
    .filter((chunk) => chunk.startsWith('data: '))
    .map((chunk) => JSON.parse(chunk.replace('data: ', '')));
}

const VALID_BODY = {
  messages: [{ role: 'user', content: 'Move my Wednesday run to Thursday.' }],
};

// ─── Method guard ─────────────────────────────────────────────────────────────

describe('POST /api/chat — method guard', () => {
  it('returns 405 for GET', async () => {
    const res = makeResMock();
    await handler(makeReq('GET'), res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 405 for DELETE', async () => {
    const res = makeResMock();
    await handler(makeReq('DELETE'), res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});

// ─── Input validation ─────────────────────────────────────────────────────────

describe('POST /api/chat — input validation', () => {
  it('returns 400 when body is missing', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', null), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when messages is not an array', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', { messages: 'hello' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('array') })
    );
  });

  it('returns 400 when messages array is empty', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', { messages: [] }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('empty') })
    );
  });

  it('returns 400 for invalid message role', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', { messages: [{ role: 'system', content: 'hello' }] }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('role') })
    );
  });

  it('returns 400 for empty message content', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', { messages: [{ role: 'user', content: '   ' }] }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('content') })
    );
  });

  it('returns 400 when a message is not an object', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', { messages: ['hello'] }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('accepts multi-turn message history', async () => {
    mockStreamFactory = () =>
      makeMockStream({ textDeltas: ['Sure.'], finalContent: [{ type: 'text', text: 'Sure.' }] });

    const res = makeResMock();
    await handler(makeReq('POST', {
      messages: [
        { role: 'user', content: 'Can you move my rest day?' },
        { role: 'assistant', content: 'Which day do you want to move it to?' },
        { role: 'user', content: 'Move it to Friday.' },
      ],
    }), res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
  });
});

// ─── SSE headers ─────────────────────────────────────────────────────────────

describe('POST /api/chat — SSE headers', () => {
  beforeEach(() => {
    mockStreamFactory = () =>
      makeMockStream({ textDeltas: ['Done.'], finalContent: [{ type: 'text', text: 'Done.' }] });
  });

  it('sets Content-Type to text/event-stream', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', VALID_BODY), res);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
  });

  it('sets Cache-Control to no-cache', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', VALID_BODY), res);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
  });

  it('sets Connection to keep-alive', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', VALID_BODY), res);
    expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
  });

  it('calls res.status(200) before streaming', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', VALID_BODY), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ─── Text streaming ───────────────────────────────────────────────────────────

describe('POST /api/chat — text streaming', () => {
  beforeEach(() => {
    mockStreamFactory = () =>
      makeMockStream({
        textDeltas: ['Here is ', 'your training update.'],
        finalContent: [{ type: 'text', text: 'Here is your training update.' }],
        stopReason: 'end_turn',
      });
  });

  it('writes delta events for each streamed token', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', VALID_BODY), res);

    const events = parseSseEvents();
    const deltas = events.filter((e) => e.type === 'delta');
    expect(deltas.length).toBeGreaterThan(0);
  });

  it('writes a done event at the end', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', VALID_BODY), res);

    const events = parseSseEvents();
    expect(events.find((e) => e.type === 'done')).toBeDefined();
  });

  it('calls res.end() after the done event', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', VALID_BODY), res);
    expect(res.end).toHaveBeenCalled();
  });

  it('all delta events have a text field', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', VALID_BODY), res);

    const events = parseSseEvents();
    for (const e of events.filter((e) => e.type === 'delta')) {
      expect(typeof e.text).toBe('string');
    }
  });

  it('concatenated delta text matches full response', async () => {
    const res = makeResMock();
    await handler(makeReq('POST', VALID_BODY), res);

    const events = parseSseEvents();
    const fullText = events
      .filter((e) => e.type === 'delta')
      .map((e) => e.text as string)
      .join('');
    expect(fullText).toBe('Here is your training update.');
  });
});

// ─── Tool call round-trip ─────────────────────────────────────────────────────

describe('POST /api/chat — tool use', () => {
  it('emits tool_use and tool_result events, then done on a two-turn exchange', async () => {
    let call = 0;
    mockStreamFactory = () => {
      call++;
      if (call === 1) {
        // First turn: Claude uses a tool
        return makeMockStream({
          textDeltas: ['Looking up...'],
          finalContent: [
            {
              type: 'tool_use',
              id: 'tool_abc',
              name: 'get_workout',
              input: { workout_id: 'aaa' },
            },
          ],
          stopReason: 'tool_use',
        });
      }
      // Second turn: Claude responds normally
      return makeMockStream({
        textDeltas: ['Your workout is on Tuesday.'],
        finalContent: [{ type: 'text', text: 'Your workout is on Tuesday.' }],
        stopReason: 'end_turn',
      });
    };

    const res = makeResMock();
    await handler(makeReq('POST', VALID_BODY), res);

    const events = parseSseEvents();
    const types = events.map((e) => e.type);

    expect(types).toContain('tool_use');
    expect(types).toContain('tool_result');
    expect(types).toContain('done');
  });

  it('tool_use event includes name and input', async () => {
    let call = 0;
    mockStreamFactory = () => {
      call++;
      if (call === 1) {
        return makeMockStream({
          textDeltas: [],
          finalContent: [
            { type: 'tool_use', id: 'tool_xyz', name: 'get_workout', input: { workout_id: 'bbb' } },
          ],
          stopReason: 'tool_use',
        });
      }
      return makeMockStream({
        textDeltas: ['Done.'],
        finalContent: [{ type: 'text', text: 'Done.' }],
        stopReason: 'end_turn',
      });
    };

    const res = makeResMock();
    await handler(makeReq('POST', VALID_BODY), res);

    const events = parseSseEvents();
    const toolUseEvent = events.find((e) => e.type === 'tool_use');
    expect(toolUseEvent).toBeDefined();
    expect(toolUseEvent!.name).toBe('get_workout');
    expect(toolUseEvent!.input).toEqual({ workout_id: 'bbb' });
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe('POST /api/chat — error handling', () => {
  it('emits an error SSE event when Anthropic throws', async () => {
    mockStreamFactory = () =>
      makeMockStream({ rejectWith: new Error('API rate limit exceeded') });

    const res = makeResMock();
    await handler(makeReq('POST', VALID_BODY), res);

    const events = parseSseEvents();
    const error = events.find((e) => e.type === 'error');
    expect(error).toBeDefined();
    expect(error!.message).toContain('rate limit');
  });

  it('calls res.end() even after an error', async () => {
    mockStreamFactory = () =>
      makeMockStream({ rejectWith: new Error('Network error') });

    const res = makeResMock();
    await handler(makeReq('POST', VALID_BODY), res);
    expect(res.end).toHaveBeenCalled();
  });
});

// ─── SSE event format ─────────────────────────────────────────────────────────

describe('SSE event format', () => {
  it('all written events are valid JSON prefixed with "data: "', async () => {
    mockStreamFactory = () =>
      makeMockStream({
        textDeltas: ['Token1.', ' Token2.'],
        finalContent: [{ type: 'text', text: 'Token1. Token2.' }],
        stopReason: 'end_turn',
      });

    const res = makeResMock();
    await handler(makeReq('POST', VALID_BODY), res);

    for (const write of sseWrites) {
      if (write.trim()) {
        expect(write).toMatch(/^data: /);
        const json = write.replace('data: ', '').replace(/\n\n$/, '');
        expect(() => JSON.parse(json)).not.toThrow();
      }
    }
  });

  it('events are separated by double newlines', async () => {
    mockStreamFactory = () =>
      makeMockStream({
        textDeltas: ['Hello.'],
        finalContent: [{ type: 'text', text: 'Hello.' }],
        stopReason: 'end_turn',
      });

    const res = makeResMock();
    await handler(makeReq('POST', VALID_BODY), res);

    for (const write of sseWrites) {
      if (write.includes('data: ')) {
        expect(write).toMatch(/\n\n$/);
      }
    }
  });
});
