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

## Architecture

```
index.html / styles.css   — Static frontend (tabs: Run, Tri, Chat)
api/
  plan/
    index.ts              — GET /api/plan  (training plan + pace targets)
  chat.ts                 — POST /api/chat  (SSE streaming, tool-use loop, maxDuration 60s)
  workouts/
    index.ts              — GET/POST /api/workouts
    [id].ts               — GET/PUT/DELETE /api/workouts/:id  (GET includes nested segments)
  weeks/
    index.ts              — GET /api/weeks  (all weeks with nested workouts)
lib/
  supabase.ts             — Supabase client singleton + test factory
  anthropic.ts            — Anthropic client, tool definitions, tool executor, system prompt builder
types/
  index.ts                — Shared TypeScript types
coach-profile.md          — Coach persona, athlete profile, swim preferences, coaching philosophy
                            (loaded and prompt-cached on every conversation)
SCHEMA.md                 — Supabase database schema reference
supabase/
  migrations/001_initial_schema.sql  — Run this in Supabase SQL editor to set up tables
tests/
  types.test.ts           — Type and fixture conformance
  fixtures/index.ts       — Shared test data
  api/plan.test.ts        — Route tests for /api/plan
  api/weeks.test.ts       — Route tests (mocked Supabase)
  api/workouts.test.ts    — Route tests (mocked Supabase)
  api/chat.test.ts        — Chat endpoint tests (mocked Anthropic + Supabase)
  lib/supabase.test.ts    — Client unit tests + integration tests (skipped without real DB)
  lib/anthropic.test.ts   — Tool schema, tool execution, prompt caching, coach profile tests
```

## Database schema

See `SCHEMA.md` for the full schema. Key tables:

| Table | Purpose |
|---|---|
| `training_plans` | Race info, goal time, goal pace, athlete profile |
| `pace_targets` | Named pace zones (Easy, Tempo, Race pace, etc.) linked to a plan |
| `training_weeks` | One row per week — number, phase (Build/Taper/Race), label, dates, target mileage |
| `workouts` | One row per day — type, total_miles, pace zone, flags (rest/race/key), notes |
| `workout_segments` | Warmup/interval/cooldown detail rows linked to a workout |
| `coach_memory` | Key-value store for AI coach notes (UUID id) |

All PKs are serial integers except `coach_memory.id` (UUID).

## Run tab data flow

The Run tab is fully dynamic. On load it:
1. Fetches `GET /api/plan` and `GET /api/weeks` in parallel
2. Finds the current week by comparing today's date to `week_start`/`week_end`
3. Renders: hero (weekly mileage + date range), workout cards, bar chart, progression chart
4. Workout dialog fetches segments from `GET /api/workouts/:id` on first open (cached in memory)

The Tri tab is still hardcoded. Chat tab uses SSE streaming.

## CSS custom properties

Defined in `:root` — control color palette, typography scale, spacing, and transitions. Prefer editing these over hardcoding values elsewhere.

**Phase colors used in the progression chart:**
- `--color-phase-base`, `--color-phase-build`, `--color-phase-peak`, `--color-phase-taper`
- CSS classes: `.prog-week--base`, `.prog-week--build`, `.prog-week--peak`, `.prog-week--taper`
- DB phases (Build/Taper/Race) map to CSS classes via `mapPhaseForChart()` in `index.html`

**Responsive breakpoints:** 900px (3-col → 2-col grid) and 600px (2-col → 1-col grid).

**Scroll animations:** Elements with `.reveal-on-scroll` animate in via IntersectionObserver. Call `observePanel(panel)` after dynamically rendering content into a tab.

## Workout type mappings

| `workout_type` | `data-difficulty` | Display title |
|---|---|---|
| Easy | easy | Easy Run |
| Intervals | hard | VO₂max Intervals |
| Tempo | hard | Tempo Run |
| Long | long | Long Run |
| Cross-train | medium | Cross-Training |
| Rest | rest | Rest Day |
| Shakeout | easy | Shakeout Run |
| Race | hard | Race Day |

These are defined in `WORKOUT_DIFFICULTY` and `WORKOUT_TITLES` in `index.html`.

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
To run the skipped DB integration tests, set `SUPABASE_TEST_URL` and `SUPABASE_TEST_ANON_KEY` in `.env.local` pointing to a test project. Then `npm test` will include them.

## Key design decisions

- **Prompt caching**: `coach-profile.md` is the cached system prompt block. Editing it invalidates the cache for ~5 min.
- **Tool use**: All DB reads/writes from the LLM go through `executeTool()` in `lib/anthropic.ts`. Add new tools there + update the `CoachToolName` union in `types/index.ts`.
- **Streaming**: `/api/chat` uses SSE. The frontend parses `data: {...}\n\n` events. Tool calls show a status pill; text deltas stream into the bubble.
- **Coach persona**: `coach-profile.md` controls coaching behavior. Edit it to update the coach's style, athlete preferences, or training philosophy.
- **Dynamic weeks**: The Run tab handles any number of training weeks. Never hardcode week counts — always map over the array returned by `/api/weeks`.
