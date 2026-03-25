# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A triathlon/half-marathon training site with an AI coaching assistant. The frontend is static HTML/CSS, backed by Vercel serverless API routes (TypeScript), a Supabase PostgreSQL database, and Anthropic Claude as the coaching LLM.

## Running Locally

```bash
npm install
# Add your keys to .env.local (copy from .env.example)
vercel dev          # runs frontend + API routes together on localhost:3000
```

Run tests:
```bash
npm test            # unit tests (no DB needed)
npm test -- --watch # watch mode
```

Seed the database with filler data:
```bash
npm run seed
```

## Architecture

```
index.html / styles.css   — Static frontend (tabs: Run, Tri, Chat)
api/
  chat.ts                 — POST /api/chat  (SSE streaming, tool-use loop, maxDuration 60s)
  workouts/
    index.ts              — GET/POST /api/workouts
    [id].ts               — GET/PUT/DELETE /api/workouts/:id
  weeks/
    index.ts              — GET /api/weeks  (nested workouts)
lib/
  supabase.ts             — Supabase client singleton + test factory
  anthropic.ts            — Anthropic client, tool definitions, tool executor, system prompt builder
types/
  index.ts                — Shared TypeScript types
coach-profile.md          — Coach persona, athlete profile, swim preferences, coaching philosophy
                            (loaded and prompt-cached on every conversation)
supabase/
  migrations/001_initial_schema.sql  — Run this in Supabase SQL editor to set up tables
  seed.ts                 — Dev seed script (15 weeks of filler data)
tests/
  types.test.ts           — Type and fixture conformance
  fixtures/index.ts       — Shared test data
  api/weeks.test.ts       — Route tests (mocked Supabase)
  api/workouts.test.ts    — Route tests (mocked Supabase)
  api/chat.test.ts        — Chat endpoint tests (mocked Anthropic + Supabase)
  lib/supabase.test.ts    — Client unit tests + integration tests (skipped without real DB)
  lib/anthropic.test.ts   — Tool schema, tool execution, prompt caching, coach profile tests
```

**CSS custom properties** (defined in `:root`) control the color palette, typography scale, spacing, and transitions — prefer editing these over hardcoding values elsewhere.

**Responsive breakpoints:** 900px (3-col → 2-col grid) and 600px (2-col → 1-col grid).

**Scroll animations:** Elements with `.reveal-on-scroll` animate in via the IntersectionObserver in `index.html`.

## Deployment

### First-time setup

1. **Supabase**: Create a project at supabase.com. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor.

2. **Vercel**: Install the CLI and link the project:
   ```bash
   npm i -g vercel
   vercel link
   ```

3. **Environment variables** — set these in the Vercel dashboard (Project → Settings → Environment Variables):
   | Variable | Where to find it |
   |---|---|
   | `SUPABASE_URL` | Supabase project → Settings → API |
   | `SUPABASE_ANON_KEY` | Supabase project → Settings → API |
   | `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |

4. **Deploy**:
   ```bash
   vercel --prod
   ```

### Subsequent deploys
```bash
vercel --prod
```

### Integration tests
To run the skipped DB integration tests, set `SUPABASE_TEST_URL` and `SUPABASE_TEST_ANON_KEY` in `.env.local` pointing to a test project (can be the same project). Then `npm test` will include them.

## Key design decisions

- **Prompt caching**: `coach-profile.md` is the cached system prompt block. Editing it invalidates the cache for ~5 min.
- **Tool use**: All DB reads/writes from the LLM go through `executeTool()` in `lib/anthropic.ts`. Add new tools there + update the type union in `types/index.ts`.
- **Streaming**: `/api/chat` uses SSE. The frontend parses `data: {...}\n\n` events. Tool calls show a status pill; text deltas stream into the bubble.
- **Coach persona**: `coach-profile.md` controls coaching behavior. Edit it to update the coach's style, athlete preferences, or training philosophy.
