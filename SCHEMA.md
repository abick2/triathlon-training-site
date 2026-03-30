# Training Plan — Database Schema
> Hand this file to Claude Code as context when building the frontend.

---

## Stack
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (if needed — data is currently single-user)
- **Realtime**: Supabase Realtime available on all tables

---

## Tables

### `training_plans`
Top-level plan record. One row per plan.

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | Auto-increment |
| `athlete_name` | `text` | e.g. "Andrew" |
| `race_name` | `text` | e.g. "Half Marathon" |
| `race_date` | `date` | e.g. `2026-04-20` |
| `race_distance` | `text` | e.g. "Half Marathon (13.1 mi)" |
| `goal_time` | `text` | e.g. "1:12:00" |
| `goal_pace_per_mile` | `text` | e.g. "5:29" |
| `pr_time` | `text` | Previous PR, e.g. "1:15:20" |
| `pr_notes` | `text` | Context on PR, e.g. "hilly course" |
| `current_weekly_mileage_min` | `int` | Lower bound of recent weekly mileage |
| `current_weekly_mileage_max` | `int` | Upper bound of recent weekly mileage |
| `fitness_level` | `text` | "Advanced" / "Intermediate" / "Beginner" |
| `created_at` | `timestamptz` | Auto-set |

---

### `pace_targets`
Named pace zones for the plan. FK → `training_plans`.

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | |
| `plan_id` | `int` FK | → `training_plans.id` |
| `zone_name` | `text` | e.g. "Race pace", "Tempo", "Intervals", "Long run", "Easy/Recovery" |
| `pace_min` | `text` | Fastest bound, e.g. "5:10" |
| `pace_max` | `text` | Slowest bound, e.g. "5:20" |
| `notes` | `text` | e.g. "VO2 max effort, 1K to mile reps" |

**Zone names in this dataset:**
- `Race pace` — 5:29/mi (1:12:00 goal)
- `Tempo` — 5:35–5:45/mi (lactate threshold)
- `Intervals` — 5:10–5:20/mi (VO2 max)
- `Long run` — 6:30–7:00/mi (easy, aerobic)
- `Easy/Recovery` — 7:00–7:45/mi (truly easy)

---

### `training_weeks`
One row per week block. FK → `training_plans`.

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | |
| `plan_id` | `int` FK | → `training_plans.id` |
| `week_number` | `int` | 1–4 |
| `phase` | `text` | `"Build"`, `"Taper"`, or `"Race"` |
| `label` | `text` | e.g. "Sharpen", "Peak quality", "Taper begins", "Race week" |
| `week_start` | `date` | Monday of the week |
| `week_end` | `date` | Sunday of the week |
| `target_mileage` | `numeric(5,1)` | Target run miles for the week |
| `notes` | `text` | Coaching notes for the week |

**Weeks in this dataset:**
| # | Phase | Label | Dates | Miles |
|---|---|---|---|---|
| 1 | Build | Sharpen | Mar 27 – Apr 2 | 40 |
| 2 | Build | Peak quality | Apr 3 – Apr 9 | 38 |
| 3 | Taper | Taper begins | Apr 10 – Apr 16 | 26 |
| 4 | Race | Race week | Apr 17 – Apr 20 | 10 |

---

### `workouts`
One row per day/session. FK → `training_weeks` and `training_plans`.

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | |
| `week_id` | `int` FK | → `training_weeks.id` |
| `plan_id` | `int` FK | → `training_plans.id` (denormalized for easy querying) |
| `workout_date` | `date` | Exact calendar date |
| `day_of_week` | `text` | "Monday" – "Sunday" |
| `workout_type` | `text` | See enum below |
| `total_miles` | `numeric(5,1)` | NULL for rest/cross-train days |
| `primary_pace_zone` | `text` | Matches `pace_targets.zone_name` |
| `notes` | `text` | Coaching notes for the day |
| `is_rest_day` | `boolean` | True for full rest days |
| `is_race_day` | `boolean` | True only for April 20 |
| `is_key_workout` | `boolean` | True for non-negotiable sessions (intervals, tempo, long runs) |

**`workout_type` values:**
`Easy` | `Intervals` | `Tempo` | `Long` | `Cross-train` | `Rest` | `Shakeout` | `Race`

**Key workouts flagged (`is_key_workout = true`):**
- All interval days (Friday each week)
- All tempo days (Tuesday each week)
- All long runs (Sunday each week)
- Race day

---

### `workout_segments`
Structured breakdown of each workout into warmup / main set / intervals / cooldown / strides / cross-train. FK → `workouts`.

This is the most granular table — it's where rep counts, distances, paces, and rest periods live as queryable data rather than free text.

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | |
| `workout_id` | `int` FK | → `workouts.id` |
| `segment_order` | `int` | 1 = first segment in workout |
| `segment_type` | `text` | See enum below |
| `description` | `text` | Human-readable description of the segment |
| `reps` | `int` | Number of repetitions (NULL if N/A) |
| `rep_distance` | `text` | e.g. "1mi", "1200m", "1K", "20s", "30s" |
| `pace_min` | `text` | Fastest bound, e.g. "5:10" |
| `pace_max` | `text` | Slowest bound, e.g. "5:20" |
| `rest_duration` | `text` | e.g. "90s", "2 min", "full recovery" |
| `distance_miles` | `numeric(5,1)` | Total miles for segment (if applicable) |
| `duration_minutes` | `int` | Duration in minutes (cross-train / rest segments) |

**`segment_type` values:**
`warmup` | `main_set` | `interval_rep` | `cooldown` | `stride` | `cross_train`

---

## Relationships

```
training_plans (1) ──< pace_targets       (many)
training_plans (1) ──< training_weeks     (many)
training_plans (1) ──< workouts           (many)   [denormalized FK]
training_weeks (1) ──< workouts           (many)
workouts       (1) ──< workout_segments   (many)
```

---

## Convenience Views

Three views are pre-built in the database:

### `v_full_plan`
One row per workout day. Joins `training_plans → training_weeks → workouts`.
Useful for: calendar views, weekly summaries, day-by-day display.

**Columns:** `athlete_name`, `goal_time`, `week_number`, `phase`, `week_label`, `workout_date`, `day_of_week`, `workout_type`, `total_miles`, `primary_pace_zone`, `is_key_workout`, `is_rest_day`, `is_race_day`, `workout_notes`

### `v_key_workouts`
Only flagged key workouts, joined with all their segments.
Useful for: "workout detail" pages, structured interval display.

**Columns:** `workout_date`, `day_of_week`, `workout_type`, `total_miles`, `notes`, `segment_order`, `segment_type`, `description`, `reps`, `rep_distance`, `pace_min`, `pace_max`, `rest_duration`

### `v_weekly_summary`
One row per week with mileage totals and run day counts.
Useful for: mileage charts, week-over-week progress bars.

**Columns:** `week_number`, `phase`, `label`, `week_start`, `week_end`, `target_mileage`, `run_days`, `actual_total_miles`

---

## Suggested Frontend Pages / Components

### 1. Plan overview (`/`)
- Race countdown (days until April 20)
- Goal time + PR comparison
- Weekly mileage bar chart using `v_weekly_summary`
- Phase progress indicator (Build → Taper → Race)

### 2. Weekly calendar (`/week/:week_number`)
- 7-day grid view per week
- Color-coded by `workout_type` (easy = green, intervals = purple, tempo = blue, long = amber, rest = gray, race = gold)
- Flag badge on `is_key_workout` days
- Click day → workout detail drawer

### 3. Workout detail (`/workout/:id`)
- Header: date, type, total miles, pace zone
- Segment table: ordered list of warmup → main set → cooldown
- For interval reps: show `reps × rep_distance @ pace_min–pace_max / rest_duration`
- Coaching notes

### 4. Pace reference card
- Table of all 5 pace zones from `pace_targets`
- Color-coded by zone intensity

### 5. Key workouts list (`/key-workouts`)
- Filtered list of all `is_key_workout = true` sessions
- Grouped by week
- Each expanded to show segments inline

---

## Supabase Query Examples

```js
// Fetch all weeks with their workouts
const { data } = await supabase
  .from('training_weeks')
  .select('*, workouts(*)')
  .order('week_number');

// Fetch a single workout with its segments
const { data } = await supabase
  .from('workouts')
  .select('*, workout_segments(*)')
  .eq('id', workoutId)
  .single();

// Fetch the full plan view
const { data } = await supabase
  .from('v_full_plan')
  .select('*')
  .order('workout_date');

// Fetch weekly mileage summary for chart
const { data } = await supabase
  .from('v_weekly_summary')
  .select('*')
  .order('week_number');

// Fetch all key workouts with segments
const { data } = await supabase
  .from('v_key_workouts')
  .select('*')
  .order('workout_date, segment_order');
```

---

## Color Coding Reference (for frontend)
Consistent color mapping for `workout_type`:

| Type | Suggested color | Use case |
|---|---|---|
| `Easy` | Green | Low-intensity runs |
| `Intervals` | Purple | VO2 max sessions |
| `Tempo` | Blue | Threshold sessions |
| `Long` | Amber | Long run days |
| `Cross-train` | Pink | Bike / swim |
| `Rest` | Gray | Rest days |
| `Shakeout` | Teal | Pre-race easy runs |
| `Race` | Gold/Orange | Race day only |
