# Handoff: Dynamic Backend — feature/dynamic-backend

## Current state

- **Branch:** `feature/dynamic-backend`
- **Commit:** all work committed (28 files, 8521 insertions)
- **Tests:** 124 passing, 7 skipped (DB integration tests — skipped until `SUPABASE_TEST_URL` is configured)
- **Status:** Code complete. Needs Supabase + Vercel setup before it will run.

---

## What was built

### New files

| File | Purpose |
|---|---|
| `package.json` | npm project: Anthropic SDK, Supabase client, Vitest, TypeScript, @vercel/node |
| `tsconfig.json` | TypeScript config for all API/lib/test code |
| `vercel.json` | Vercel config — `/api/chat` gets `maxDuration: 60` for streaming |
| `.gitignore` | Ignores node_modules, dist, .env.local, .vercel, coverage |
| `.env.example` | Template for required env vars |
| `vitest.config.ts` | Test runner config |
| `types/index.ts` | Shared TypeScript types: `Workout`, `TrainingWeek`, `WeekWithWorkouts`, `CoachMemory`, request bodies, tool names |
| `lib/supabase.ts` | Supabase client singleton + `createTestClient()` factory for tests |
| `lib/anthropic.ts` | Anthropic client, 8 coach tool definitions, `executeTool()`, `buildSystemPrompt()` with prompt caching |
| `coach-profile.md` | The coach's "brain" — athlete profile, swim preferences, coaching philosophy, pushback rules. Loaded and cached as the system prompt. |
| `api/weeks/index.ts` | `GET /api/weeks` — all training weeks with nested workouts |
| `api/workouts/index.ts` | `GET /api/workouts` + `POST /api/workouts` |
| `api/workouts/[id].ts` | `GET/PUT/DELETE /api/workouts/:id` |
| `api/chat.ts` | `POST /api/chat` — SSE streaming chat with tool-use agentic loop |
| `supabase/migrations/001_initial_schema.sql` | Schema: `training_weeks`, `workouts`, `coach_memory` tables with constraints and indexes |
| `supabase/seed.ts` | `npm run seed` — populates 15 weeks of filler training data (race May 3 2026) |
| `tests/setup.ts` | Global test setup (stub env vars) |
| `tests/fixtures/index.ts` | Shared test fixtures |
| `tests/types.test.ts` | Type + enum conformance tests |
| `tests/lib/supabase.test.ts` | Unit + integration tests for Supabase client |
| `tests/lib/anthropic.test.ts` | Tool schema validation, tool execution, prompt caching, coach profile content |
| `tests/api/weeks.test.ts` | Route tests for `/api/weeks` |
| `tests/api/workouts.test.ts` | Route tests for `/api/workouts` — validation, happy path, error cases |
| `tests/api/chat.test.ts` | Chat endpoint tests — SSE headers, streaming, tool round-trips, error handling |

### Modified files

| File | What changed |
|---|---|
| `index.html` | Added "Chat" tab button; added `#tab-chat` panel with chat UI (messages, input, send button); updated subtitle dict; added full SSE streaming JS client |
| `styles.css` | Added Chat tab styles: `.chat-container`, `.chat-messages`, `.chat-bubble`, `.chat-status-pill`, `.chat-input-area`, animations, responsive overrides |
| `CLAUDE.md` | Fully updated to reflect the new stack, architecture, file structure, deployment steps, and design decisions |

---

## Setup steps (required before the app will run)

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `supabase/migrations/001_initial_schema.sql`
3. Get your project URL and anon key from **Project Settings → API**

### 2. Local environment

Create `.env.local` in the project root (copy from `.env.example`):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...
```

Then seed filler data:

```bash
npm install
npm run seed
```

### 3. Vercel

```bash
npm i -g vercel
vercel link          # link this directory to a Vercel project
```

Add env vars in the **Vercel dashboard** (Project → Settings → Environment Variables) — same three vars as above.

### 4. Deploy

```bash
vercel --prod
```

### 5. Local dev

```bash
vercel dev    # runs frontend + API routes on localhost:3000
```

---

## Architecture

```
Browser (index.html / styles.css)
  ├── Run tab, Tri tab  — existing static content (unchanged)
  └── Chat tab          — SSE streaming UI → fetch('/api/chat')

Vercel Serverless Functions (TypeScript)
  ├── /api/chat          — streams Claude responses, executes tools
  ├── /api/workouts      — CRUD for individual workouts
  ├── /api/workouts/:id  — single workout CRUD
  └── /api/weeks         — all weeks with nested workouts

Supabase (PostgreSQL)
  ├── training_weeks     — week_number, dates, theme, notes
  ├── workouts           — linked to weeks, sport/title/description/intensity/etc.
  └── coach_memory       — key-value store for dynamic coach notes

Anthropic API
  └── Claude (claude-sonnet-4-6) via streaming + tool use + prompt caching
```

---

## Coach system

### coach-profile.md

This file is the "CLAUDE.md" for the AI coach. It's read at startup and cached as the system prompt. Edit it to change:
- Athlete profile and PRs
- Swim workout requirements (fully scripted — no simple interval style)
- Coaching philosophy (pushback rules, acceptable vs. pushback-required changes)
- Race date and target

### 8 coach tools

Defined in `lib/anthropic.ts` → `COACH_TOOLS`, executed by `executeTool()`:

| Tool | Purpose |
|---|---|
| `get_week` | Fetch a training week by number (with workouts) |
| `get_workouts` | Fetch workouts with optional week_id/date range filter |
| `get_workout` | Fetch a single workout by UUID |
| `update_workout` | Update any fields on a workout |
| `swap_workout_days` | Swap dates/days between two workouts (for rest day moves) |
| `add_workout_note` | Append a note to a workout's notes field |
| `get_coach_memory` | Read a key from the coach_memory table |
| `update_coach_memory` | Write/update a key in coach_memory |

### Prompt caching

`buildSystemPrompt()` wraps `coach-profile.md` in `cache_control: { type: 'ephemeral' }`. Anthropic caches this for ~5 minutes — cuts input token costs significantly on follow-up messages within a session.

---

## Key design decisions

- **Streaming**: `/api/chat` uses Server-Sent Events (SSE). The browser reads `data: {...}\n\n` chunks. Text deltas stream into the bubble character by character. Tool calls show a "Thinking…" / "Using tool: …" status pill.
- **Tool-use loop**: The chat handler loops up to 5 rounds. Claude calls tools → we execute them → results fed back → Claude continues. Guards against infinite loops.
- **maxDuration: 60**: Set in `vercel.json` for `/api/chat`. Streaming responses from Claude are typically 5–20 seconds, well within the 60s limit on Vercel hobby tier.
- **Input validation**: All API routes validate inputs before hitting Supabase. Invalid enum values, missing required fields, malformed dates, and negative durations all return 400 with a descriptive message.

---

## Next features to build

1. **Wire Run/Tri tab data to the DB** — currently the Run and Tri tab workout cards are still hardcoded in `index.html`. The ideal next step is to fetch from `/api/weeks` and render dynamically, so the coach can actually modify what's shown.

2. **Build the real 15-week plan** — use the Chat coach to generate and refine Andrew's actual half-iron training plan leading to May 3. The filler seed data is a placeholder.

3. **Workout detail modal** — clicking a workout card opens a modal with the full description (sets, drills, pacing). The `description` field in the DB already holds rich text for swim workouts.

4. **Integration test DB** — set `SUPABASE_TEST_URL` + `SUPABASE_TEST_ANON_KEY` in `.env.local` to unlock the 7 skipped integration tests that verify schema constraints and cascade deletes against a real DB.

---

## Running tests

```bash
npm test              # all unit tests (no DB needed)
npm run test:watch    # watch mode
npm run test:coverage # coverage report → coverage/
```
