/**
 * Type conformance tests.
 * Validates that fixtures match their TypeScript types and that
 * enum values are exhaustively covered.
 */

import { describe, it, expect } from 'vitest';
import type {
  Sport,
  Intensity,
  DayOfWeek,
  Workout,
  TrainingWeek,
  CreateWorkoutBody,
} from '../types/index.js';
import {
  fixtureWeek,
  fixtureWorkoutSwim,
  fixtureWorkoutRun,
  fixtureWorkoutRest,
  fixtureCreateWorkoutBody,
  fixtureUpdateWorkoutBody,
  fixtureWeekWithWorkouts,
  fixtureCoachMemory,
} from './fixtures/index.js';

// ─── Enum coverage ────────────────────────────────────────────────────────────

const VALID_SPORTS: Sport[] = ['swim', 'bike', 'run', 'brick', 'rest', 'strength'];
const VALID_INTENSITIES: Intensity[] = ['easy', 'moderate', 'hard', 'race', 'rest'];
const VALID_DAYS: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

describe('type enums', () => {
  it('covers all 6 sport values', () => {
    expect(VALID_SPORTS).toHaveLength(6);
    expect(VALID_SPORTS).toContain('swim');
    expect(VALID_SPORTS).toContain('bike');
    expect(VALID_SPORTS).toContain('run');
    expect(VALID_SPORTS).toContain('brick');
    expect(VALID_SPORTS).toContain('rest');
    expect(VALID_SPORTS).toContain('strength');
  });

  it('covers all 5 intensity values', () => {
    expect(VALID_INTENSITIES).toHaveLength(5);
  });

  it('covers all 7 days of week', () => {
    expect(VALID_DAYS).toHaveLength(7);
  });
});

// ─── TrainingWeek fixture ─────────────────────────────────────────────────────

describe('TrainingWeek fixture', () => {
  it('has required fields', () => {
    expect(fixtureWeek.id).toBeTruthy();
    expect(typeof fixtureWeek.week_number).toBe('number');
    expect(fixtureWeek.week_number).toBeGreaterThan(0);
    expect(fixtureWeek.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(fixtureWeek.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof fixtureWeek.theme).toBe('string');
  });

  it('end_date is on or after start_date', () => {
    expect(fixtureWeek.end_date >= fixtureWeek.start_date).toBe(true);
  });

  it('notes is string or null', () => {
    expect(
      fixtureWeek.notes === null || typeof fixtureWeek.notes === 'string'
    ).toBe(true);
  });
});

// ─── Workout fixtures ─────────────────────────────────────────────────────────

describe('Workout fixtures', () => {
  const workouts: Workout[] = [fixtureWorkoutSwim, fixtureWorkoutRun, fixtureWorkoutRest];

  it.each(workouts)('workout "$title" has required fields', (workout) => {
    expect(workout.id).toBeTruthy();
    expect(workout.week_id).toBeTruthy();
    expect(workout.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(VALID_DAYS).toContain(workout.day_of_week);
    expect(VALID_SPORTS).toContain(workout.sport);
    expect(typeof workout.title).toBe('string');
    expect(workout.title.length).toBeGreaterThan(0);
    expect(VALID_INTENSITIES).toContain(workout.intensity);
    expect(typeof workout.completed).toBe('boolean');
  });

  it('swim workout has fully scripted description', () => {
    expect(fixtureWorkoutSwim.description).toContain('Warm-Up');
    expect(fixtureWorkoutSwim.description).toContain('Main Set');
    expect(fixtureWorkoutSwim.description).toContain('Cool-Down');
  });

  it('rest workout has rest intensity', () => {
    expect(fixtureWorkoutRest.sport).toBe('rest');
    expect(fixtureWorkoutRest.intensity).toBe('rest');
    expect(fixtureWorkoutRest.duration_min).toBeNull();
    expect(fixtureWorkoutRest.distance).toBeNull();
  });

  it('duration_min is positive integer or null', () => {
    workouts.forEach((w) => {
      if (w.duration_min !== null) {
        expect(Number.isInteger(w.duration_min)).toBe(true);
        expect(w.duration_min).toBeGreaterThan(0);
      }
    });
  });
});

// ─── WeekWithWorkouts fixture ─────────────────────────────────────────────────

describe('WeekWithWorkouts fixture', () => {
  it('contains the week fields', () => {
    expect(fixtureWeekWithWorkouts.id).toBe(fixtureWeek.id);
    expect(fixtureWeekWithWorkouts.week_number).toBe(fixtureWeek.week_number);
  });

  it('workouts array is non-empty', () => {
    expect(fixtureWeekWithWorkouts.workouts.length).toBeGreaterThan(0);
  });

  it('all workouts belong to the week', () => {
    fixtureWeekWithWorkouts.workouts.forEach((w) => {
      expect(w.week_id).toBe(fixtureWeek.id);
    });
  });
});

// ─── CoachMemory fixture ──────────────────────────────────────────────────────

describe('CoachMemory fixture', () => {
  it('has required fields', () => {
    expect(fixtureCoachMemory.id).toBeTruthy();
    expect(typeof fixtureCoachMemory.key).toBe('string');
    expect(typeof fixtureCoachMemory.value).toBe('string');
    expect(fixtureCoachMemory.key.length).toBeGreaterThan(0);
    expect(fixtureCoachMemory.value.length).toBeGreaterThan(0);
  });
});

// ─── CreateWorkoutBody fixture ────────────────────────────────────────────────

describe('CreateWorkoutBody fixture', () => {
  it('has required fields', () => {
    expect(fixtureCreateWorkoutBody.week_id).toBeTruthy();
    expect(fixtureCreateWorkoutBody.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(VALID_DAYS).toContain(fixtureCreateWorkoutBody.day_of_week);
    expect(VALID_SPORTS).toContain(fixtureCreateWorkoutBody.sport);
    expect(VALID_INTENSITIES).toContain(fixtureCreateWorkoutBody.intensity);
  });
});

// ─── UpdateWorkoutBody fixture ────────────────────────────────────────────────

describe('UpdateWorkoutBody fixture', () => {
  it('all present fields are valid types', () => {
    if (fixtureUpdateWorkoutBody.completed !== undefined) {
      expect(typeof fixtureUpdateWorkoutBody.completed).toBe('boolean');
    }
    if (fixtureUpdateWorkoutBody.sport !== undefined) {
      expect(VALID_SPORTS).toContain(fixtureUpdateWorkoutBody.sport);
    }
    if (fixtureUpdateWorkoutBody.intensity !== undefined) {
      expect(VALID_INTENSITIES).toContain(fixtureUpdateWorkoutBody.intensity);
    }
  });
});

// ─── Date format helper ───────────────────────────────────────────────────────

describe('date format validation', () => {
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

  it('fixture dates are ISO YYYY-MM-DD', () => {
    expect(fixtureWeek.start_date).toMatch(ISO_DATE);
    expect(fixtureWeek.end_date).toMatch(ISO_DATE);
    expect(fixtureWorkoutSwim.date).toMatch(ISO_DATE);
    expect(fixtureWorkoutRun.date).toMatch(ISO_DATE);
    expect(fixtureCreateWorkoutBody.date).toMatch(ISO_DATE);
  });
});
