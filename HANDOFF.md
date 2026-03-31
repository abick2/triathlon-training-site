# Handoff: Dynamic Run Tab — merged to master

## Current state

- **Branch:** `master`
- **Commit:** `26c8b08` (merged from `feature/dynamic-run-tab`)
- **Tests:** 134 passing, 6 pre-existing failures in `tests/api/chat.test.ts` (Anthropic mock missing `.stream` — not introduced by this work), 7 skipped (DB integration tests)
- **Status:** Run tab is fully dynamic. Tri tab and Chat tab are unchanged.

---

## What was built in this session

### Schema migration (backend)

The Supabase database was migrated from the original UUID-based `training_weeks`/`workouts` schema to a new workout-centric schema with serial integer PKs. All backend code was updated to match.

**New tables:**
- `training_plans` — race info, goal time, pace, athlete profile
- `pace_targets` — named pace zones linked to a plan
- `training_weeks` — week number, phase (Build/Taper/Race), label, dates, target mileage
- `workouts` — one row per day, linked to a week and plan; `workout_type`, `total_miles`, `primary_pace_zone`, `is_rest_day`, `is_race_day`, `is_key_workout`
- `workout_segments` — warmup/main_set/interval_rep/cooldown/stride/cross_train rows linked to a workout
- `coach_memory` — preserved from original schema (UUID id, key/value)

**Schema reference:** `SCHEMA.md`

### New and updated files

| File | What changed |
|---|---|
| `types/index.ts` | Full rewrite — new types for all tables, integer IDs, `WorkoutType`/`SegmentType`/`Phase` unions |
| `api/plan/index.ts` | **New** — `GET /api/plan` returns `training_plans` with nested `pace_targets` |
| `api/weeks/index.ts` | Updated column names (`workout_date`, `day_of_week`, etc.) |
| `api/workouts/index.ts` | Rewrite — integer ID validation, `workout_type` enum validation, new required fields |
| `api/workouts/[id].ts` | Rewrite — integer ID, `GET` returns nested `workout_segments`, `PUT` validates new fields |
| `lib/anthropic.ts` | Updated all 8 tool schemas and `executeTool()` queries to match new schema |
| `tests/fixtures/index.ts` | Full rewrite — integer IDs, all new types |
| `tests/types.test.ts` | Full rewrite — covers all new types and enums |
| `tests/api/plan.test.ts` | **New** — 5 tests for `GET /api/plan` |
| `tests/api/workouts.test.ts` | Rewrite — updated mocks and validation tests |
| `tests/lib/anthropic.test.ts` | Updated fixtures and tool schema tests |
| `index.html` | Run tab made fully dynamic (see below) |
| `styles.css` | Added `.hero-week-range`, `.day-date`, `.prog-week--build` |

### Dynamic Run tab (frontend)

The Run tab HTML was gutted of all hardcoded content and replaced with empty containers. JavaScript renders everything from API data:

**API calls on load:**
- `GET /api/plan` → race name, goal time, goal pace, race date
- `GET /api/weeks` → all training weeks with nested workouts

**Render pipeline:**
1. `findCurrentWeek(weeks)` — finds the week where today falls between `week_start`/`week_end`; falls back to next upcoming week, then last week
2. `renderRunHero(week, plan)` — total weekly mileage, date range (e.g. "Mar 30 – Apr 5, 2026"), week label and race goal
3. `renderRunCards(workouts)` — 7 workout cards with day + date (e.g. "MONDAY 3/30"), difficulty badge, title, miles
4. `renderRunBarChart(workouts)` — daily mileage bars
5. `buildRunPlan(weeks, plan, currentWeek)` → `renderProgression(runPlan, 'run', false)` — progression chart with one bar per week, handles any number of weeks

**Workout dialog:**
- `openWorkout(card)` is now async
- Run workouts fetch segments from `GET /api/workouts/:id` on first open, then cache in `segmentCache`
- Dialog header shows day + date (e.g. "Monday 3/30")

**Phase mapping (DB → CSS):**
| DB value | CSS class | Color |
|---|---|---|
| Build | `prog-week--build` | `--color-phase-build` |
| Taper | `prog-week--taper` | `--color-phase-taper` |
| Race | `prog-week--peak` | `--color-phase-peak` |

---

## Setup steps

### 1. Supabase

The DB schema is described in `SCHEMA.md`. Run the SQL in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor to create the tables, then populate them with your training plan data.

### 2. Local environment

Create `.env.local` in the project root:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run locally

```bash
npm install
vercel dev    # frontend + API on localhost:3000
```

### 4. Deploy

```bash
vercel --prod
```

---

## Architecture

```
Browser (index.html / styles.css)
  ├── Run tab    — dynamic: fetches /api/plan + /api/weeks on load
  ├── Tri tab    — still hardcoded (future work)
  └── Chat tab   — SSE streaming UI → fetch('/api/chat')

Vercel Serverless Functions (TypeScript)
  ├── /api/plan          — training plan + pace targets
  ├── /api/chat          — streams Claude responses, executes tools
  ├── /api/workouts      — GET (list) + POST
  ├── /api/workouts/:id  — GET (with segments) + PUT + DELETE
  └── /api/weeks         — all weeks with nested workouts

Supabase (PostgreSQL)
  ├── training_plans     — race info, goal time, pace zones
  ├── pace_targets       — named pace zones linked to a plan
  ├── training_weeks     — week number, phase, dates, target mileage
  ├── workouts           — one per day; type, miles, flags
  ├── workout_segments   — warmup/intervals/cooldown detail
  └── coach_memory       — key-value store for AI coach notes

Anthropic API
  └── Claude (claude-sonnet-4-6) via streaming + tool use + prompt caching
```

---

## Known issues / pre-existing failures

- `tests/api/chat.test.ts` — 6 tests fail because the Anthropic mock is missing `.stream`. These failures pre-date this work and exist on master. Not a regression.

---

## Next features to build

1. **Wire Tri tab to DB** — Tri tab is still hardcoded. When swim/bike data is added to the schema, it should follow the same dynamic pattern as the Run tab.
2. **`vercel dev` debugging** — local dev server hasn't been confirmed working end-to-end. Needs `.env.local` + `vercel link` to test.
3. **Fix chat tests** — The 6 failing `chat.test.ts` tests need the Anthropic mock updated to support `.stream`.
4. **Integration test DB** — Set `SUPABASE_TEST_URL` + `SUPABASE_TEST_ANON_KEY` in `.env.local` to unlock 7 skipped integration tests.

---

## Running tests

```bash
npm test              # all unit tests (no DB needed)
npm test -- --watch   # watch mode
```
