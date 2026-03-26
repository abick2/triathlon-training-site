/**
 * POST /api/chat
 *
 * Streaming chat endpoint for the triathlon coach.
 * Uses Server-Sent Events (SSE) so the browser can display tokens as they arrive.
 *
 * Flow:
 *   1. Receive { messages: ChatMessage[] } from the client
 *   2. Build the cached system prompt (coach profile)
 *   3. Call Claude with tool use enabled
 *   4. If Claude uses a tool: execute it, feed results back, continue streaming
 *   5. Stream text deltas to the client as SSE events
 *   6. Send a [DONE] event when the turn is complete
 *
 * SSE event format:
 *   data: {"type":"delta","text":"..."}\n\n
 *   data: {"type":"tool_use","name":"...","input":{...}}\n\n
 *   data: {"type":"tool_result","name":"...","success":true}\n\n
 *   data: {"type":"done"}\n\n
 *   data: {"type":"error","message":"..."}\n\n
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient, buildSystemPrompt, COACH_TOOLS, executeTool } from '../lib/anthropic.js';
import type { ChatMessage, ChatRequestBody } from '../types/index.js';

export const config = {
  maxDuration: 60,
};

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 2048;
// Maximum tool-use iterations before we stop (guards against infinite loops)
const MAX_TOOL_ROUNDS = 5;

function validateBody(body: unknown): { valid: true; data: ChatRequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;

  if (!Array.isArray(b.messages)) {
    return { valid: false, error: 'messages must be an array' };
  }
  if (b.messages.length === 0) {
    return { valid: false, error: 'messages array must not be empty' };
  }
  for (const msg of b.messages) {
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: 'Each message must be an object' };
    }
    const m = msg as Record<string, unknown>;
    if (m.role !== 'user' && m.role !== 'assistant') {
      return { valid: false, error: 'Each message role must be "user" or "assistant"' };
    }
    if (typeof m.content !== 'string' || !m.content.trim()) {
      return { valid: false, error: 'Each message content must be a non-empty string' };
    }
  }

  return { valid: true, data: b as unknown as ChatRequestBody };
}

function writeSse(res: VercelResponse, data: object) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = validateBody(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering if present
  res.status(200);

  const anthropic = getAnthropicClient();
  const systemPrompt = buildSystemPrompt();

  // Build initial message array (convert our ChatMessage[] to Anthropic format)
  let messages: Anthropic.MessageParam[] = validation.data.messages.map((m: ChatMessage) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    let toolRound = 0;

    while (toolRound <= MAX_TOOL_ROUNDS) {
      // Stream the response
      const stream = anthropic.beta.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        tools: COACH_TOOLS,
        messages,
      });

      let fullText = '';
      const toolUseBlocks: Anthropic.ToolUseBlock[] = [];

      // Stream text deltas to client
      stream.on('text', (text) => {
        fullText += text;
        writeSse(res, { type: 'delta', text });
      });

      // Collect tool use blocks as they arrive
      stream.on('inputJson', (_delta, snapshot) => {
        // We handle tool use in the finalMessage event below
        void snapshot;
      });

      const finalMessage = await stream.finalMessage();

      // Collect any tool use blocks from the final message
      for (const block of finalMessage.content) {
        if (block.type === 'tool_use') {
          toolUseBlocks.push(block);
        }
      }

      // No tool calls — we're done
      if (toolUseBlocks.length === 0 || finalMessage.stop_reason === 'end_turn') {
        writeSse(res, { type: 'done' });
        res.end();
        return;
      }

      // Notify client about tool calls in progress
      for (const toolBlock of toolUseBlocks) {
        writeSse(res, {
          type: 'tool_use',
          name: toolBlock.name,
          input: toolBlock.input,
        });
      }

      // Add assistant's turn (with tool use blocks) to message history
      messages = [
        ...messages,
        { role: 'assistant', content: finalMessage.content },
      ];

      // Execute all tools and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolBlock of toolUseBlocks) {
        const result = await executeTool(
          toolBlock.name,
          toolBlock.input as Record<string, unknown>
        );

        writeSse(res, {
          type: 'tool_result',
          name: toolBlock.name,
          success: result.success,
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: result.success
            ? JSON.stringify(result.data)
            : `Error: ${result.error}`,
          is_error: !result.success,
        });
      }

      // Add tool results to messages and loop for next Claude turn
      messages = [
        ...messages,
        { role: 'user', content: toolResults },
      ];

      toolRound++;
    }

    // Reached max tool rounds without finishing
    writeSse(res, {
      type: 'error',
      message: 'Maximum tool call iterations reached. Please try a more specific request.',
    });
    res.end();
  } catch (err) {
    console.error('[POST /api/chat] Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    writeSse(res, { type: 'error', message });
    res.end();
  }
}
