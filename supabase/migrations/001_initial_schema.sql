-- =============================================================
-- Triathlon Training Site — Initial Schema
-- =============================================================
-- Run this in the Supabase SQL editor for both your production
-- and test projects.
-- =============================================================

-- Training weeks
CREATE TABLE IF NOT EXISTS training_weeks (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number  INTEGER     NOT NULL,
  start_date   DATE        NOT NULL,
  end_date     DATE        NOT NULL,
  theme        TEXT        NOT NULL DEFAULT '',
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,

  CONSTRAINT unique_week_number UNIQUE (week_number),
  CONSTRAINT valid_date_range   CHECK (end_date >= start_date)
);

-- Individual workouts
CREATE TABLE IF NOT EXISTS workouts (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id      UUID        NOT NULL REFERENCES training_weeks(id) ON DELETE CASCADE,
  date         DATE        NOT NULL,
  day_of_week  TEXT        NOT NULL CHECK (day_of_week IN (
                             'Monday','Tuesday','Wednesday','Thursday',
                             'Friday','Saturday','Sunday')),
  sport        TEXT        NOT NULL CHECK (sport IN (
                             'swim','bike','run','brick','rest','strength')),
  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  duration_min INTEGER,
  distance     TEXT,
  intensity    TEXT        NOT NULL CHECK (intensity IN (
                             'easy','moderate','hard','race','rest')),
  completed    BOOLEAN     NOT NULL DEFAULT false,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Coach memory: dynamic key-value store for learned athlete preferences
CREATE TABLE IF NOT EXISTS coach_memory (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  key         TEXT        NOT NULL UNIQUE,
  value       TEXT        NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS workouts_week_id_idx ON workouts(week_id);
CREATE INDEX IF NOT EXISTS workouts_date_idx    ON workouts(date);
CREATE INDEX IF NOT EXISTS workouts_sport_idx   ON workouts(sport);
